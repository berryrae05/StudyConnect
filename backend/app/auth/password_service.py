from datetime import datetime, timezone

from sqlalchemy.orm import Session
from fastapi import HTTPException, Request, status

from app.users.model import User
from app.users.schema import ForgotPasswordRequest, ResetPasswordRequest

from app.auth.security import hash_password, verify_password
from app.auth.utils import create_password_reset_token, verify_password_reset_token, validate_password
    
from app.auth.email import send_password_reset_email
from app.auth.token_model import RefreshToken
from app.auth.password_history_model import PasswordHistory, HISTORY_LIMIT
from app.auth.audit import log_auth_event
from app.auth.audit_model import AuthEventType

RESET_COOLDOWN_SECONDS = 60

# Seeds user password history with the initial password hash (Called once)
def seed_password_history(user_id: int, hashed_password: str, db: Session) -> None:
    db.add(PasswordHistory(user_id=user_id, password=hashed_password))
    db.commit()

# Checks if User's new password matches any of the user's last HISTORY_LIMIT stored in hash
def check_password_history(user_id: int, new_plain_password: str, db: Session) -> None:

    recent = (
        db.query(PasswordHistory)
        .filter(PasswordHistory.user_id == user_id)
        .order_by(PasswordHistory.created_at.desc())
        .limit(HISTORY_LIMIT)
        .all()
    )
    for entry in recent:
        if verify_password(new_plain_password, entry.password): # Call verify_password() against each stored hash
            raise HTTPException(
                status_code = status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"This password was used recently. "
                    f"Please choose a password you haven't used in your last {HISTORY_LIMIT}."
                )
            )
        
def update_password_history(user_id: int, new_hashed_password: str, db: Session) -> None:

    db.add(PasswordHistory(user_id = user_id, password=new_hashed_password))
    db.flush()

    # Count total rows for this user
    total = (
        db.query(PasswordHistory)
        .filter(PasswordHistory.user_id == user_id)
        .count()
    )

    if total > HISTORY_LIMIT:
        # Find the threshold - delete anything older than the Nth most recent
        oldest_to_keep = (
            db.query(PasswordHistory.id)
            .filter(PasswordHistory.user_id == user_id)
            .order_by(PasswordHistory.created_at.desc())
            .limit(HISTORY_LIMIT)
            .subquery()
        )
        db.query(PasswordHistory).filter(
            PasswordHistory.user_id == user_id,
            PasswordHistory.id.notin_(oldest_to_keep),
        ).delete(synchronize_session=False)

    db.commit()

# Forgot password
async def forgot_password(request_body: ForgotPasswordRequest, request: Request, db: Session):

    GENERIC_MSG = "If that email is registered, a password reset link has been sent"
    email = request_body.email.strip().lower()
    user = db.query(User).filter(User.email == email).first()

    if not user:
        return {"message": GENERIC_MSG}
    
    # Cooldown check
    now = datetime.now(timezone.utc)
    if user.password_reset_sent_at is not None:
        sent_at = user.password_reset_sent_at
        if sent_at.tzinfo is None:
            sent_at = sent_at.replace(tzinfo=timezone.utc)
        elapsed = (now - sent_at).total_seconds()
        if elapsed < RESET_COOLDOWN_SECONDS:
            remaining = int(RESET_COOLDOWN_SECONDS - elapsed)
            raise HTTPException(
                status_code=429,
                detail=f"Please wait {remaining} seconds before requesting another reset email.",
            )

    token = create_password_reset_token(email)
    email_sent = await send_password_reset_email(email, token)

    if not email_sent:
        raise HTTPException(status_code=500, detail="Failed to send email. Please try again.")
    
    user.password_reset_sent_at = now
    db.commit()

    log_auth_event(db, request, AuthEventType.PASSWORD_RESET_REQUESTED, user_id=user.id)

    return {"message": GENERIC_MSG}

# reset password
def reset_password(request_body: ResetPasswordRequest, request: Request, db: Session):

    email = verify_password_reset_token(request_body.token)
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token",
        )
    
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    # Validate new password strength
    try:
        validate_password(request_body.new_password)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))
    
    # password history check 
    check_password_history(user.id, request_body.new_password, db)

    # Update password
    new_hash = hash_password(request_body.new_password)
    user.password = new_hash

    # invalidate all existing access token immediately
    user.invalidate_tokens_before = datetime.now(timezone.utc)

    # Clear lockout so user can log in immediately after reset
    user.failed_login_attempts = 0
    user.locked_until = None

    # Clear password_reset_sent_at so they can request another reset later
    user.password_reset_sent_at = None

    # Revoke all refresh tokens (also log out all devices)
    db.query(RefreshToken).filter(RefreshToken.user_id == user.id).delete()

    db.flush()

    # Update password history
    update_password_history(user.id, new_hash, db)

    log_auth_event(db, request, AuthEventType.PASSWORD_RESET, user_id=user.id)

    return {"message": "Password reset successfully. You can now log in."}