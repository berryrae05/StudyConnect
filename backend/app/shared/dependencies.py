from typing import Generator

from fastapi import Depends, HTTPException, status
from fastapi.security import (HTTPBearer, HTTPAuthorizationCredentials)
from sqlalchemy.orm import Session
from datetime import timezone

from app.database import SessionLocal
from app.auth.security import verify_token
from app.users.model import User
from app.users.admin_services import is_suspension_active

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
        credentials: HTTPAuthorizationCredentials = Depends(security),
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
    
    # Suspension check
    if is_suspension_active(user, db):
        if user.suspended_until is None:
            detail = f"Your account has been suspended. Reason: {user.suspension_reason or 'Not specified'}."
        else: 
            suspended_until = user.suspended_until
            if suspended_until.tzinfo is None:
                suspended_until = suspended_until.replace(tzinfo=timezone.utc)
            detail = (
                f"Your account is suspended until {suspended_until.strftimr('%d %B %Y')}."
                f"Reason: {user.suspension_reason or 'Not specified'}."
            )
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=detail)
    return user

def get_current_admin(current_user: User = Depends(get_current_user),) -> User:

    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    
    return current_user