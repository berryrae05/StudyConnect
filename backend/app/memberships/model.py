"""SQLAlchemy model: links one user to one group (a membership row)."""


from sqlalchemy import Column, DateTime, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func


from app.database import Base

class Membership(Base):


    __tablename__ = "memberships"

    __table_args__ = (
        UniqueConstraint(
            "user_id", 
            "group_id", 
            name="uq_membership_user_group"
        ),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    group_id = Column(Integer, ForeignKey("groups.id"), nullable=False)
    joined_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(),)

    group = relationship("Group", back_populates="memberships")
    user = relationship("User", back_populates="memberships")
