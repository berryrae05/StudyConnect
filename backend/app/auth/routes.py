from typing import Annotated
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.shared.dependencies import get_db
from app.users.schema import (UserCreate, UserLogin, UserResponse)
from app.auth.services import (register_user, login_user)

# Authentication router
# All routes here start with /auth
router = APIRouter(
    prefix="/auth", #/groups
    tags=["Authentication"]
)

# Database dependency
# FastAPI automatically injects DB session
DBDependency = Annotated[Session, Depends(get_db)]

# Register a new user
# Endpoint: POST /auth/signup
@router.post("/signup", response_model=UserResponse, status_code=201)
def signup(user_data: UserCreate, db: DBDependency):
    return register_user(user_data, db)

# Login an existing user
# Endpoint: POST /auth/login
@router.post("/login")
def login(user_data: UserLogin, db: DBDependency):
    return login_user(user_data, db)
