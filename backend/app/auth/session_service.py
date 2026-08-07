from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session
from fastapi import HTTPException, Request, status

from app.users.model import User
from app.users.schema import UserLogin, LogoutRequest
from app.users.admin_services import is_suspension_active

from app.auth.security import (verify_password, create_access_token, hash_token)

from app.auth.token_service import create_and_store_refresh_token
from app.auth.token_model import RefreshToken
from app.auth.audit import log_auth_event
from app.auth.audit_model import AuthEventType
from app.config import settings

# Logs a user into the system.
def login_user(user_data: UserLogin, request: Request, db: Session):

    now = datetime.now(timezone.utc)
    normalised_email = user_data.email.strip().lower()
    user = (db.query(User).filter(User.email == normalised_email).first())

    # Email not found
    if not user:
        log_auth_event(db, request, AuthEventType.LOGIN_FAILED,
                       detail=f"Unknown email: {user_data.email[:60]}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    # Attempt while locked
    if user.locked_until is not None:
        locked_until = user.locked_until
        if locked_until.tzinfo is None:
            locked_until = locked_until.replace(tzinfo=timezone.utc)

        if now < locked_until:
            remaining_minutes = int((locked_until - now).total_seconds() / 60) + 1
            log_auth_event(db, request, AuthEventType.LOGIN_LOCKED, user_id=user.id,
                           detail=f"{remaining_minutes}min remaining")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    f"Account temporarily locked due to many failed login attempts. "
                    f"Please try again in {remaining_minutes} miniutes(s), "
                    f"or reset your password."
                ),
            )
        else: 
            # Lockout has expired
            user.locked_until = None
            db.commit()
    
    # Attempt MAX (wrong password, crosses threshold)
    if not verify_password(user_data.password, user.password):
        user.failed_login_attempt +=1
        if user.failed_login_attempt >= settings.LOGIN_MAX_ATTEMPTS:
            user.locked_until = now + timedelta(minutes=settings.LOGIN_LOCKOUT_MINUTES)
            db.commit()
            log_auth_event(db, request, AuthEventType.ACCOUNT_LOCKED, user_id=user.id,
                           detail=f"Locked for {settings.LOGIN_LOCKOUT_MINUTES}min")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    f"Too many failed login attempts. "
                    f"Your account has been locked for {settings.LOGIN_LOCKOUT_MINUTES} minute(s). "
                    f"You can reset your password instead"
                ),
            )
    
        # Warn when getting close to the limit (<= 2 attempts left)
        attempts_remaining = settings.LOGIN_MAX_ATTEMPTS - user.failed_login_attempt
        db.commit()
        log_auth_event(db, request, AuthEventType.LOGIN_FAILED, user_id=user.id,
                       detail=f" {attempts_remaining} attempt(s) remaining")

        detail = "Invalid email or password"
        if attempts_remaining <= 2:
            detail += f"({attempts_remaining} attempt(s) remaining before lockout"

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
        )
    
    if is_suspension_active(user, db):
        if user.suspended_until is None:
            detail = f"Your account has been suspended. Reason: {user.suspension_reason or 'Not specified'}."
        else: 
            suspended_until = user.suspended_until
            if suspended_until.tzinfo is None:
                suspended_until = suspended_until.replace(tzinfo=timezone.utc)
            detail = (
                f"Your account is suspended until {suspended_until.strftime('%d %B %Y')}."
                f"Reason: {user.suspension_reason or 'Not specified'}."
            )
            log_auth_event(db, request, AuthEventType.LOGIN_LOCKED, user_id=user.id, detail="suspended")
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=detail)
    
    # Email not verified
    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please verify your email first"
        )
    
    # Successful login - reset lockout counters
    user.failed_login_attempt = 0
    user.locked_until = None
    
    # Create JWT token
    access_token = create_access_token(
        data={"sub": str(user.id),"email": user.email, "role": user.role, "type": "access"}
    )

    # Issue a refresh token alongside the access token
    raw_refresh_token = create_and_store_refresh_token(user.id,db)
    
    # Login success
    return {
        "message": "Login successful",
        "access_token": access_token,
        "token_type": "bearer",
        "refresh_token": raw_refresh_token,
        "user": user,
    }

# Revokes the current session and deletes current refresh token from DB
def logout(request_body: LogoutRequest, request: Request, current_user: User, db: Session):

    token_hash= hash_token(request_body.refresh_token)

    # Deletes the specific refresh token from DB
    db.query(RefreshToken).filter(RefreshToken.token_hash == token_hash).delete()

    # Delete any already-rotated (is_used=True) tokens for this user
    db.query(RefreshToken).filter(
        RefreshToken.user_id == current_user.id,
        RefreshToken.is_used == True,
    ).delete()

    db.commit()
    log_auth_event(db, request, AuthEventType.LOGOUT, user_id=current_user.id)
    return {"message": "Logged out successfully"}

def logout_all_devices(current_user: User, request: Request, db:Session):
    # Deletes every refresh token for this user, immediately invalidating all sessions on all devices.
    db.query(RefreshToken).filter(RefreshToken.user_id == current_user.id).delete()
    db.commit()
    log_auth_event(db, request, AuthEventType.LOGOUT_ALL, user_id=current_user.id)
    return {"message": "All sessions have been revoked"}