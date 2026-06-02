"""Password validation logic"""
from datetime import (datetime, timedelta, timezone)

from fastapi import (HTTPException, status)

from jose import (
     jwt, JWTError
)

from app.config import settings

def validate_email_domain(email: str):

    #Extract domain
    email_domain = (email.split("@")[-1].lower())

    # Allowed domains
    allowed_domains = [
        domain.strip().lower()
        for domain in settings.ALLOWED_EMAIL_DOMAINS
    ]

    # Validate
    if(email_domain not in allowed_domains):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail=("Email domain" "is not allowed")
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
         payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM
    )

# Verify emial verification token
def verify_email_verification_token(token: str) -> str | None:
     
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
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