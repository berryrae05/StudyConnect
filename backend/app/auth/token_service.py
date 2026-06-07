from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session
from fastapi import HTTPException, Request, status

from app.users.model import User
from app.users.schema import  RefreshTokenRequest
from app.auth.security import create_access_token, create_refresh_token, hash_token

from app.auth.token_model import RefreshToken
from app.auth.audit import log_auth_event
from app.auth.audit_model import AuthEventType
from app.config import settings

# helper
def create_and_store_refresh_token(user_id: int, db:Session) -> str:

    raw_token = create_refresh_token() # Generate a new refresh token
    token_hash = hash_token(raw_token)
    expires_at = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    db.add(RefreshToken(
            user_id=user_id,
            token_hash=token_hash,
            expires_at=expires_at,
            is_used=False,
    ))
    db.commit() # Stores the hash token in DB
    return raw_token # Sent to the client

# Refresh access token
def refresh_access_token(request_body: RefreshTokenRequest, request: Request, db: Session):
    
    token_hash = hash_token(request_body.refresh_token)

    db_token = db.query(RefreshToken).filter(RefreshToken.token_hash == token_hash).first()

    if db_token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )

    # Reuse detection - token was already rotated
    if db_token.is_used:
        user_id = db_token.user_id
        db.query(RefreshToken).filter(RefreshToken.user_id == db_token.user_id).delete()
        db.commit()
        log_auth_event(db, request, AuthEventType.TOKEN_REUSE_DETECTED, user_id=user_id)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token already used. All sessions have been revoked"
        )
    
    # Expiry check
    now = datetime.now(timezone.utc)
    expires_at = db_token.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if now > expires_at:
        db.delete(db_token)
        db.commit()
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token expired")
    
    # Fetch user after all token checks pass
    user = db.query(User).filter(User.id == db_token.user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    
    # Mark old token as used (rotation - cannot be reused)
    db_token.is_used = True
    db.commit()

    # Issue a new access token
    new_access_token = create_access_token(
        data={"sub": str(user.id), "email": user.email, "role": user.role, "type": "access"}
    )

    # Issue new refresh token
    new_raw_refresh_token = create_and_store_refresh_token(user.id, db)

    log_auth_event(db, request, AuthEventType.TOKEN_REFRESH, user_id=user.id)

    return {
        "access_token": new_access_token,
        "token_type": "bearer",
        "refresh_token": new_raw_refresh_token
    }