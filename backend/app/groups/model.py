"""SQLAlchemy model for a study group."""

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base

class Group(Base):

    __tablename__ = "groups"

    id = Column(Integer, primary_key=True, autoincrement=True)

    module_code = Column(String(64), nullable=False)
    description = Column(Text, nullable=True)
    location = Column(String(255), nullable=True)
    date_time = Column(DateTime(timezone=True), nullable=True)
    max_members = Column(Integer, nullable=False, default=10)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(),)

    # One user can create many groups
    creator = relationship(
        "User", 
        foreign_keys=[created_by], 
        back_populates="created_groups"
    )

    memberships = relationship(
        "Membership",
        back_populates="group",
        cascade="all, delete-orphan",
    )
