from contextlib import asynccontextmanager

from fastapi import FastAPI
from sqlalchemy import text

from app.auth.routes import router as auth_router
from app.config import mask_database_url, settings
from app.database import engine
from app.groups.routes import router as groups_router
from app.memberships.routes import router as memberships_router
from app.middleware.cors import setup_cors


def test_database_connection() -> None:
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        print("Database connection successful!")
    except Exception as e:
        print("Database connection failed")
        print(f"URL: {mask_database_url(settings.DATABASE_URL)}")
        print(e)


@asynccontextmanager
async def lifespan(app: FastAPI):
    test_database_connection()
    yield
    print("Shutting down Study Connect API...")


app = FastAPI(lifespan=lifespan)

setup_cors(app)

app.include_router(auth_router)
app.include_router(groups_router)
app.include_router(memberships_router)


@app.get("/")
def home():
    return {"message": "Study Connect API Running"}
