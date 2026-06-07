"""RefreshToken database model"""

from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship

from app.database import Base

class RefreshToken(Base):
    __tablename__= "refresh_tokens"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    token_hash = Column(String(64), unique=True, nullable=False, index=True)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    expires_at = Column(DateTime(timezone=True), nullable=False)

    # Soft "used" flag for reuse detection
    # True: token was already rotated; seeing it again means theft
    # False: token is valid and has not been used yet
    is_used = Column(Boolean, default=False, nullable=False)

    user = relationship("User", back_populates="refresh_tokens")