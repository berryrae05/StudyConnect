from datetime import datetime, timezone 
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base

class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, autoincrement=True)
    
    # Who filed the report
    reported_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)

    # Who is being reported 
    against_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)

    against_name = Column(String(255), nullable=True)
    reason = Column(Text, nullable=False)
    status = Column(String(20), nullable=False, default="pending", index=True)

    # Admin notes after review
    admin_notes = Column(Text, nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        index=True,
    )
    reviewd_at = Column(DateTime(timezone=True), nullable=True)

    # The user who filed this report
    reporter = relationship(
        "User",
        foreign_keys=[reported_by_id],
        back_populates="reports_filed",
    )

    # The user being reported
    reported_user = relationship(
        "User",
        foreign_keys=[against_user_id],
        back_populates="reports_against"
    )