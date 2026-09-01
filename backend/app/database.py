from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

from app.config import settings

#Database connection
engine = create_engine(settings.DATABASE_URL, echo=True)

#Session for database operations
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()

# Import models so SQLAlchemy registers relationships
from app.users.model import User
from app.users.model import UserModule
from app.groups.model import Group
from app.memberships.model import Membership
from app.auth.token_model import RefreshToken
from app.auth.audit_model import AuthEvent
from app.auth.password_history_model import PasswordHistory
from app.modules.model import Module
from app.venues.model import Venue
from app.moderation.model import Report
from app.admin.audit_model import AdminAction