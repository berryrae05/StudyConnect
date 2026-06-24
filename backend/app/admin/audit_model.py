from datetime import datetime, timezone
from enum import Enum
from sqlalchemy import Column, BigInteger, Integer, String, DateTime, ForeignKey
from app.database import Base

class AdminActionType(str, Enum):
    STUDENT_SUSPENDED = "student_suspended"
    STUDENT_UNSUSPENDED = "student_suspended"
    GROUP_DELETED = "group_deleted"
    MODULE_CREATED = "module_created"
    MODULE_UPDATED = "module_updated"
    MODULE_DEACTIVATED = "module_deactivated"
    MODULE_DELETED = "module_deleted"
    VENUE_CREATED = "venue_created"
    VENUE_UPDATED = "venue_updated"
    VENUE_DELETED = "venue_deleted"
    REPORT_REVIEWED = "report_reviewed"
    REPORT_DISMISSED = "report_dismissed"

class AdminAction(Base):
    __tablename__="admin_actions"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    admin_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    admin_label = Column(String(255), nullable=True)
    action_type = Column(String(40), nullable=False, index=True)
    target_type = Column(String(40), nullable=False)
    target_id = Column(Integer, nullable=True)
    target_label = Column(String(255), nullable=True)
    detail = Column(String(255), nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        index=True,
    )