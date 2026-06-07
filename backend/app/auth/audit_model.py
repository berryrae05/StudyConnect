
from datetime import datetime, timezone
from enum import Enum

from sqlalchemy import Column, BigInteger, Integer, String, DateTime
from app.database import Base

class AuthEventType(str, Enum):
    LOGIN_SUCCESS = "login_success"
    LOGIN_FAILED = "login_failed"
    LOGIN_LOCKED = "login_locked"
    ACCOUNT_LOCKED = "account_locked"
    LOGOUT = "logout"
    LOGOUT_ALL = "logout_all"
    SIGNUP = "signup"
    EMAIL_VERIFIED = "email_verified"
    VERIFICATION_RESENT = "verification_resent"
    PASSWORD_RESET_REQUESTED = "password_reset_requested"
    PASSWORD_RESET = "password_reset"
    TOKEN_REFRESH = "refresh_token"
    TOKEN_REUSE_DETECTED = "token_resuse_detected"

class AuthEvent(Base):
    __tablename__ = "auth_events"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(Integer, nullable=True, index=True)
    event_type = Column(String(40), nullable=False, index=True)
    ip_address = Column(String(45), nullable=False, index=True)
    user_agent = Column(String(256), nullable=True)
    detail = Column(String(256), nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        index=True,
    )