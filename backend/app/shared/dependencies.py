from typing import Generator

from fastapi import Depends, HTTPException, status, Security
from fastapi.security import (HTTPBearer, HTTPAuthorizationCredentials)
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.auth.security import verify_token
from app.users.model import User

# JWT Bearer authentication
security = HTTPBearer()

def get_db() -> Generator:

    # Creates a database session and closes it after request ends
    db = SessionLocal()
    try:
        yield db

    finally:
        db.close()

# Get currently authenticated user
def get_current_user(
        credentials: HTTPAuthorizationCredentials = Security(security),
        db: Session = Depends(get_db)
)-> User:
    token = credentials.credentials
    payload = verify_token(token, invalidate_before=None)

    user_id: str | None = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )
    
    user = (db.query(User).filter(User.id == int(user_id)).first())
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    if user.invalidate_tokens_before is not None:
        verify_token(token, invalidate_before=user.invalidate_tokens_before)
    
    return user