from datetime import datetime, timezone

from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship

from app.database import Base


class Venue(Base):

    __tablename__ = "venues"

    id = Column(Integer, primary_key=True, autoincrement=True)

    name = Column(
        String(255),
        nullable=False,
        unique=True,
        index=True,
    )

    capacity = Column(
        Integer,
        nullable=False,
        default=10,
    )

    # Admin can temporarily disable a venue
    is_available = Column(
        Boolean,
        nullable=False,
        default=True,
    )

    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # One venue can have many groups at different times
    groups = relationship(
        "Group",
        back_populates="venue",
    )