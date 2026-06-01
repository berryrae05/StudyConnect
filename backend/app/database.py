from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app.config import settings

engine = create_engine(settings.DATABASE_URL, echo=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Register models so SQLAlchemy knows about relationships and Alembic sees metadata.
from app.users.model import User  # noqa: E402, F401
from app.groups.model import Group  # noqa: E402, F401
from app.memberships.model import Membership  # noqa: E402, F401
