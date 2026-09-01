from contextlib import asynccontextmanager
import logging
import traceback

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from sqlalchemy import text

from app.database import engine
from app.config import settings

from app.auth.routes import router as auth_router
from app.groups.routes import router as groups_router
from app.memberships.routes import router as memberships_router
from app.admin.routes import admin_router, public_router, student_router
from app.users.profile_routes import router as profile_router

from app.middleware.cors import setup_cors
from app.middleware.security_headers import setup_security_headers
from app.middleware.rate_limit import setup_rate_limiting
from app.auth.cleanup import start_cleanup_scheduler, stop_cleanup_scheduler

logging.basicConfig(
    level=logging.INFO,
    format=("%(asctime)s %(levelname)s %(name)s: %(message)s")
)
logger = logging.getLogger("study_connect")

def test_database_connection():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        logger.info("Database connection successful!")
    except Exception as e:
        logger.error(f"Database connection failed: {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    test_database_connection()
    start_cleanup_scheduler()
    logger.info(f"Study Connect API starting - environment: {settings.ENVIRONMENT}")
    yield
    stop_cleanup_scheduler()
    logger.info("Shutting down Study Connect API...")

app = FastAPI(
    title="Study Connect API",
    version="1.0.0",
    docs_url= "/docs" if settings.ENVIRONMENT == "development" else None,
    redoc_url= "/redoc" if settings.ENVIRONMENT == "development" else None,
    lifespan=lifespan,
)

# Security headers wrap every response - register first 
setup_security_headers(app)

if settings.ENVIRONMENT == "production":
    setup_rate_limiting(app)

# CORS - registered last; innermost layer, runs closest to the route handler
setup_cors(app)

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(
        f"{type(exc).__name__}: {exc}\n"
        f"Path: {request.url.path}\n"
        f"{traceback.format_exc()}"
    )
    return JSONResponse(
        status_code=500,
        content={"detail": "An unexpected error occured. "}
    )

# Routers - all under api/v1
V1 = "/api/v1"

app.include_router(auth_router, prefix=V1)
app.include_router(groups_router, prefix=V1)
app.include_router(memberships_router, prefix=V1)
app.include_router(admin_router, prefix=V1)
app.include_router(public_router, prefix=V1)
app.include_router(student_router, prefix=V1)
app.include_router(profile_router, prefix=V1)

@app.get("/")
def home():
    return {"message": "Study Connect API Running", "version": "1.0.0"}
