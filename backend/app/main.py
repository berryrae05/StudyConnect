from contextlib import asynccontextmanager

from fastapi import FastAPI
from sqlalchemy import text

from app.auth.routes import router as auth_router
from app.database import engine
from app.groups.routes import router as groups_router
from app.memberships.routes import router as memberships_router
from app.middleware.cors import setup_cors
from app.middleware.security_headers import setup_security_headers
from app.middleware.rate_limit import setup_rate_limiting
from app.auth.cleanup import start_cleanup_scheduler, stop_cleanup_schedular

def test_database_connection():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        print("Database connection successful!")
    except Exception as e:
        print("Database connection failed")
        print(e)

@asynccontextmanager
async def lifespan(app: FastAPI):
    test_database_connection()
    start_cleanup_scheduler
    yield
    stop_cleanup_schedular
    print("Shutting down Study Connect API...")

app = FastAPI(lifespan=lifespan)

# Security headers wrap every response - register first 
setup_security_headers(app)

# Rate limiting - registered second
setup_rate_limiting

# CORS - registered last; innermost layer, runs closest to the route handler
setup_cors(app)

app.include_router(auth_router)
app.include_router(groups_router)
app.include_router(memberships_router)

@app.get("/")
def home():
    return {"message": "Study Connect API Running"}
