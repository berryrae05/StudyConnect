""" Authentication logic (signup, login, verification) """

from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.users.model import User
from app.users.schema import UserCreate, UserLogin
from app.auth.security import (hash_password, verify_password, create_access_token)
from app.auth.utils import (verify_email_verification_token, create_email_verification_token)
from app.auth.email import (send_verification_email)

# Registers a new user
async def register_user(user_data: UserCreate, db: Session):

    # Normalise email
    normalised_email = (user_data.email.strip().lower())

    # Check if email already exists
    existing_user = (
        db.query(User)
        .filter(User.email == normalised_email)
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user object
    new_user = User(
        full_name=user_data.full_name,
        email=normalised_email,
        password=hash_password(user_data.password),
        gender=user_data.gender,

        is_verified=False
    )

    # Save to database
    db.add(new_user)

    # Generate token
    verification_token = (
        create_email_verification_token(normalised_email)
    )

    # Send email
    email_sent = await(send_verification_email(
        normalised_email,
        verification_token
        )
    )

    if not email_sent:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=("Failed to send verification email. Please try again")
        )

    # Save only if email succeeded
    db.commit()
    db.refresh(new_user)

    return {
        "message": (
            "Account created successfully. "
            "Please verify your email to verify your account. "
        ), 
        "user": new_user
    }

# Logs a user into the system.
def login_user(user_data: UserLogin, db: Session):

    # Find user by email
    user = (
        db.query(User)
        .filter(User.email == user_data.email)
        .first()
    )

    # Email not found
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Wrong password
    if not verify_password(user_data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Email not verified
    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please verify your email first"
        )
    
    # Create JWT token
    access_token = create_access_token(
        data={
            "sub": str(user.id),
            "email": user.email,
            "role": user.role,
            "type": "access"
        }
    )
    
    # Login success
    return {
        "message": "Login successful",
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

# Verify user's email
def verify_user_email(token: str, db: Session):

    # Verify token
    email = ( verify_email_verification_token(token))

    # Invalid/expired token
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Invalid or expired"
                "verification token"
            )
        )
    
    # Find user
    user = (
        db.query(User)
        .filter(User.email == email)
        .first()
    )

    # User not found
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Already verified
    if user.is_verified:
        return {
            "message": "Email already verified"
        }
    
    # Verify account
    user.is_verified = True

    db.commit()
    db.refresh(user)

    return {
        "message": "Email verified successfully"
    }