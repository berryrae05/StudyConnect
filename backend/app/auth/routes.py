""" Authentication routes (signup, login, email verification, current user) """

from typing import Annotated

from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.shared.dependencies import get_db, get_current_user
from app.middleware.rate_limit import limiter
from app.users.model import User
from app.users.schema import (
    UserCreate, UserLogin, 
    UserResponse, LoginResponse, RegisterResponse,
    ResendVerificationRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    RefreshTokenRequest,
    LogoutRequest,
    RefreshTokenResponse,
    MessageResponse,
)
from app.auth.registration_service import register_user, verify_user_email, resend_verfication_email
from app.auth.session_service import login_user, logout, logout_all_devices
from app.auth.password_service import forgot_password, reset_password
from app.auth.token_service import refresh_access_token

# Authentication router
router = APIRouter(prefix="/auth", tags=["Authentication"])

# Database dependency
# FastAPI automatically injects DB session
DBDependency = Annotated[Session, Depends(get_db)]
CurrentUser = Annotated[User,Depends(get_current_user)]

# Register a new user
@router.post("/signup", response_model=RegisterResponse, status_code=201)
@limiter.limit("3/minute")
async def signup(request: Request, user_data: UserCreate, db: DBDependency):
    return await register_user(user_data, request, db)

# Login an existing user
@router.post("/login", response_model=LoginResponse)
@limiter.limit("5/minute")
def login(request: Request, user_data: UserLogin, db: DBDependency):
    return login_user(user_data, request, db)

# Get current user logged in
@router.get("/me", response_model=UserResponse)
def get_me(current_user: CurrentUser):
    return current_user

# Verify email
@router.get("/verify-email")
@limiter.limit("10/minute")
def verify_email(request: Request, token: str, db: DBDependency):
    return verify_user_email(token, request, db)

# Resend verification email
@router.post("/resend-verification", response_model=MessageResponse)
@limiter.limit("2/minute")
async def resend_verification(request: Request, body: ResendVerificationRequest, db: DBDependency):

    return await resend_verfication_email(body, request, db)

# Forgot password
@router.post("/forgot-password", response_model=MessageResponse)
@limiter.limit("3/minute")
async def forgot_password_route(request: Request, body: ForgotPasswordRequest, db: DBDependency):
    
    return await forgot_password(body, request, db)

# Reset password
@router.post("/reset-password", response_model=MessageResponse)
@limiter.limit("5/minute")
def reset_password_route(request: Request, body: ResetPasswordRequest, db: DBDependency):

    return reset_password(body,request, db)

# Refresh tokens
@router.post("/refresh", response_model=RefreshTokenResponse)
@limiter.limit("20/minute")
def refresh_token_route(request: Request, body: RefreshTokenRequest, db: DBDependency):

    return refresh_access_token(body, request, db)

# logout
@router.post("/logout", response_model=MessageResponse)
@limiter.limit("20/minute")
def logout_route(request: Request, body: LogoutRequest, current_user: CurrentUser, db: DBDependency):

    return logout(body, request, current_user,  db)

# logout all devices
@router.post("/logout-all", response_model=MessageResponse)
def logout_all_route(request: Request, current_user: CurrentUser, db: DBDependency):

    return logout_all_devices(current_user, request, db) 
