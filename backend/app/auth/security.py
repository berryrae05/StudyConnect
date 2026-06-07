""" JWT security, password hashing, and token verification utilities"""

import hashlib
import secrets

from datetime import datetime, timedelta, timezone
from fastapi import HTTPException, status
from jose import jwt, JWTError
from passlib.context import CryptContext

from app.config import settings

# Password hashing configuration
# bcrypt hashes passwords securely before storing them in the database
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)

# Converts a plain text password into a secure hashed password.
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

# Compares a plain text password with the hashed password stored in the database.
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

# Access Token
def create_access_token(data: dict) -> str:
    to_encode = data.copy()

    expire = (
        datetime.now(timezone.utc) 
        + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    )

    to_encode.update(
        {"exp": expire}
    )

    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )

    return encoded_jwt

# Verify JWT token
def verify_token(token: str, invalidate_before: datetime | None = None) -> dict:
    
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )

        # Prevents email_verification token
        # from being used here
        if payload.get("type") != "access":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type",
            )
        
        # blacklisting check
        if invalidate_before is not None:
            iat = payload.get("iat")
            if iat is not None:
                token_issued_at = datetime.fromtimestamp(iat, tz=timezone.utc)
                if token_issued_at < invalidate_before:
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Token has been invalidated. Please log in again"
                    )

        return payload
    
    except JWTError:

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    
# Refresh tokens
def create_refresh_token() -> str:
    return secrets.token_hex(32)

def hash_token(raw_token: str) -> str:
    return hashlib.sha256(raw_token.encode()).hexdigest()   