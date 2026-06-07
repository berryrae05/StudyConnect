from datetime import datetime, timezone

from sqlalchemy.orm import Session
from fastapi import HTTPException, Request, status

from app.users.model import User
from app.users.schema import (
    UserCreate,
    ResendVerificationRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,

)
from app.auth.security import hash_password 


from app.auth.utils import (
    create_email_verification_token, verify_email_verification_token,
    create_password_reset_token, verify_password_reset_token,
    validate_email_domain, validate_password,
    
)
from app.auth.email import (send_verification_email, send_password_reset_email)
from app.auth.password_service import check_password_history, update_password_history
from app.auth.token_model import RefreshToken
from app.auth.password_history_model import PasswordHistory
from app.auth.audit import log_auth_event
from app.auth.audit_model import AuthEventType

RESEND_COOLDOWN_SECONDS = 60
RESET_COOLDOWN_SECONDS = 60

# Registers a new user
async def register_user(user_data: UserCreate, request: Request, db: Session):
    normalised_email = user_data.email.strip().lower()
    
    validate_email_domain(normalised_email)

    # Check if email already exists
    existing_user = (db.query(User).filter(User.email == normalised_email).first())
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    hashed_pw = hash_password(user_data.password)
    # Create new user object
    new_user = User(
        full_name=user_data.full_name,
        email=normalised_email,
        password=hashed_pw,
        gender=user_data.gender,
        is_verified=False
    )

    db.add(new_user)
    db.flush() # get new_user.id

    # Seed password history with initial password
    db.add(PasswordHistory(user_id=new_user.id, password=hashed_pw))

    # Generate token
    verification_token = (create_email_verification_token(normalised_email))

    # Send email
    email_sent = await(send_verification_email(normalised_email,verification_token))

    if not email_sent:
        db.rollback()
        raise HTTPException(status_code=500, detail=("Failed to send verification email. Please try again"))

    # Save only if email succeeded
    db.commit()
    db.refresh(new_user)

    log_auth_event(db, request, AuthEventType.SIGNUP, user_id=new_user.id)

    return {
        "message": "Account created successfully. Please verify your email to verify your account. ", 
        "user": new_user
    }

# Verify user's email
def verify_user_email(token: str, request: Request, db: Session):

    # Verify token
    email = (verify_email_verification_token(token))

    # Invalid/expired token
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=("Invalid or expired verification token")
        )
    
    # Find user
    user = (db.query(User).filter(User.email == email).first())

    # User not found
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    # Already verified
    if user.is_verified:
        return {"message": "Email already verified"}
    
    # Verify account
    user.is_verified = True

    db.commit()
    db.refresh(user)

    log_auth_event(db, request, AuthEventType.EMAIL_VERIFIED, user_id=user.id)

    return {"message": "Email verified successfully"}

# Resend verification email
async def resend_verfication_email(request_body: ResendVerificationRequest, request: Request, db:Session):
    GENERIC_MSG = "If that email is registered and unverified, a new link has been sent."
    email = request_body.email.strip().lower()
    user = db.query(User).filter(User.email == email).first()

    # If the user doesn't exist or is already verified we silently return the same success message
    if not user or user.is_verified:
        return{"message": GENERIC_MSG}
    
    # Cooldown check
    now = datetime.now(timezone.utc)
    if user.verification_sent_at is not None:
        sent_at = user.verification_sent_at
        if sent_at.tzinfo is None:
            sent_at = sent_at.replace(tzinfo=timezone.utc)
        elapsed = (now - sent_at).total_seconds()
        if elapsed < RESEND_COOLDOWN_SECONDS:
            remaining = int(RESEND_COOLDOWN_SECONDS - elapsed)
            raise HTTPException(
                status_code=429,
                detail=f"Please wait {remaining} seconds before requesting another email.",
            )
        
    # Generate and send
    token = create_email_verification_token(email)
    email_sent = await send_verification_email(email, token)

    if not email_sent:
        raise HTTPException(status_code=500, detail="Failed to send email. Please try again")
    
    # Stamp the send time for cooldown tracking
    user.verification_sent_at = now
    db.commit()

    log_auth_event(db, request, AuthEventType.VERIFICATION_RESENT, user_id=user.id)

    return {"message": GENERIC_MSG}

# Sends a password reset email
async def forgot_password(request_body: ForgotPasswordRequest, request: Request, db: Session):
    # Always returns the same message regardless of whether the email exists
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

    # Validates the reset token
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
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail=str(e))
    
    # Password history check 
    check_password_history(user.id, request_body.new_password, db)

    # Update password
    new_hash = hash_password(request_body.new_password)
    user.password = new_hash

    # Invalidate all existing access token immediately
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

