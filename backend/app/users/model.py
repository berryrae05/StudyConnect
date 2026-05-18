from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database import Base

class User(Base):
    __tablename__="users"
    id = Column(Integer, primary_key=True, autoincrement=True)
    full_name = Column(String(100), nullable=False)
    email = Column(String(255),unique=True, nullable=False,)
    password = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, default="student")
    gender = Column(String(30), nullable=True,)
    is_verified= Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

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