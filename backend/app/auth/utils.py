"""Password validation logic"""
from datetime import (datetime, timedelta, timezone)

from fastapi import (HTTPException, status)

from jose import (
     jwt, JWTError
)

from app.config import settings

# email-domain validation
def validate_email_domain(email: str):

    #Extract domain
    email_domain = (email.split("@")[-1].lower())

    # Allowed domains
    allowed_domains = settings.allowed_email_domains
    
    if not allowed_domains:
        return
    if email_domain not in allowed_domains:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email domain is not allowed. Please use your university email address.",
        )

# Create email verification token
def create_email_verification_token(email: str) -> str:
    expire = (
        datetime.now(timezone.utc)
        + timedelta(minutes=settings.EMAIL_VERIFICATION_EXPIRE_MINUTES)
    )

    payload = {
         "sub": email,
         "type": "email_verification",
         "exp": int(expire.timestamp())
    }

    return jwt.encode(
         payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM
    )

# Verify emial verification token
def verify_email_verification_token(token: str) -> str | None:
     
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )

        # Prevents login JWT
        # from being used here
        if(payload.get("type") != "email_verification"):
            print("Wrong token type")
            return None
        
        return payload.get("sub")
        
    except JWTError as e:
        print(e)
        return None

# Password reset token
def create_password_reset_token(email: str) -> str:

    expire = (
        datetime.now(timezone.utc)
        + timedelta(minutes=settings.PASSWORD_RESET_EXPIRE_MINUTES)
    )
    payload = {
        "sub": email,
        "type": "password_reset", # Cannot be confused with access or email-verification token
        "exp": int(expire.timestamp())
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def verify_password_reset_token(token: str) -> str | None:

    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        if payload.get("type") != "password_reset":
            print("Wrong token type for password reset")
            return None
        return payload.get("sub")
    except JWTError as e:
        print(e)
        return None

# password strength validator
def validate_password(password: str) -> str:

        errors = []

        # Minimum length
        if len(password) < 8:
            errors.append("at least 8 characters")

        # Check uppercase
        if not any(char.isupper() for char in password):
            errors.append("at least one uppercase letter")
        
        # Check lowercase
        if not any(char.islower() for char in password):
            errors.append("at least one lowercase letter")
        
        # Cheack number
        if not any(char.isdigit() for char in password):
            errors.append("at least one number")
        
        # Special character check
        special_characters = "!@#$%^&*()_-+=<>?/{}[]|\\//:;'.~`"
        if not any(char in special_characters for char in password):
            errors.append("at least one special character")

        if errors:
            raise ValueError(
                "Password must contain: " + ", ".join(errors))
        
        return password