from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database import Base

class UserModule(Base):
        __tablename__="user_modules"
        id = Column(Integer, primary_key=True, autoincrement=True)
        user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True,)
        module_id = Column(Integer, ForeignKey("modules.id", ondelete="CASCADE"), nullable=False, index=True)
        __table_args__= (UniqueConstraint("user_id", "module_id", name="uq_user_module"),)
        user = relationship("User", back_populates="enrolled_modules")
        module = relationship("Module", back_populates="enrolled_by")

class User(Base):
    __tablename__="users"
    id = Column(Integer, primary_key=True, autoincrement=True)
    full_name = Column(String(100), nullable=False)
    email = Column(String(255),unique=True, nullable=False,)
    password = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, default="student")
    gender = Column(String(30), nullable=True,)
    is_verified= Column(Boolean, nullable=False, default=False)

     # Profile fields
    programme = Column(String(255), nullable=True, default=None)
    bio = Column(String(300), nullable=True, default=None)

    #Suspension
    is_suspended = Column(Boolean, nullable=False, default=False)
    suspended_until = Column(DateTime(timezone=True), nullable=True)
    suspension_reason = Column(String(500), nullable=True, default=None)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    verification_sent_at = Column(DateTime(timezone=True), nullable=True, default=None)

    # Forgot-password cooldown
    password_reset_sent_at = Column(DateTime(timezone=True), nullable=True, default=None)
    
    # Incremented on every wrong password; reset to 0 on successful login
    failed_login_attempt = Column(Integer, nullable=False, default=0)

    # When set, the account is locked until this UTC timestamp
    # NULL means the account is not locked
    locked_until = Column(DateTime(timezone=True), nullable=True, default=None)

    # Feature 7: token blacklisting
    invalidate_tokens_before = Column(DateTime(timezone=True), nullable=True, default=None,)

    #One user can join many groups
    memberships = relationship(
        "Membership", 
        back_populates="user", 
        cascade="all, delete-orphan"
    )

    #One user can create many groups
    created_groups = relationship(
        "Group", 
        back_populates="creator"
    )

    refresh_tokens = relationship(
        "RefreshToken",
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    password_history = relationship(
        "PasswordHistory",
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="PasswordHistory.created_at.desc()", 
    )

    reports_filed = relationship(
        "Report",
        foreign_keys="Report.reported_by_id",
        back_populates="reporter",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    reports_against = relationship(
        "Report",
        foreign_keys="Report.against_user_id",
        back_populates="reported_user",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    enrolled_modules = relationship(
        "UserModule",
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True
    )