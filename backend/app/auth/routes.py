""" Authentication routes (signup, login, email verification, current user) """

from typing import Annotated
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.shared.dependencies import get_db, get_current_user
from app.users.model import User
from app.users.schema import (UserCreate, UserLogin, UserResponse, LoginResponse, RegisterResponse)
from app.auth.services import (register_user, login_user, verify_user_email)

# Authentication router
# All routes here start with /auth
router = APIRouter(
    prefix="/auth", #/groups
    tags=["Authentication"]
)

# Database dependency
# FastAPI automatically injects DB session
DBDependency = Annotated[Session, Depends(get_db)]

CurrentUser = Annotated[
    User,
    Depends(get_current_user)
]

# Register a new user
# Endpoint: POST /auth/signup
@router.post("/signup", response_model=RegisterResponse, status_code=201)
async def signup(user_data: UserCreate, db: DBDependency):
    return await register_user(user_data, db)

# Login an existing user
# Endpoint: POST /auth/login
@router.post("/login", response_model=LoginResponse)
def login(user_data: UserLogin, db: DBDependency):
    return login_user(user_data, db)

# Get current user logged in
@router.get("/me", response_model=UserResponse)
def get_me(current_user: CurrentUser):
    return current_user

# Verify email
# Enpoint: GET /auth/verify-email
@router.get("/verify-email")
def verify_email(token: str, db: DBDependency):
    return verify_user_email(token, db)
