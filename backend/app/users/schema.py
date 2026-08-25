from pydantic import (
    BaseModel, 
    EmailStr, 
    ConfigDict, 
    Field, 
    field_validator)
from datetime import datetime
from typing import Literal

from app.auth.utils import validate_password

# Base schema with common attributes
class UserBase(BaseModel):

    model_config = ConfigDict(from_attributes=True)

    full_name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    gender: (
        Literal["Male", "Female", "Nonbinary", "Prefer not to say"]| None
    ) = None

# request schemas
# Used for creating (registering) a new user
class UserCreate(UserBase):

    password: str = Field(min_length=8, max_length=72)

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str):
        return validate_password(value)
    
    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        return value.strip().lower()

class UserLogin(BaseModel):
    email: EmailStr
    password: str

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        return value.strip().lower()

class ResendVerificationRequest(BaseModel):
    email: EmailStr

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(min_length=8, max_length=72)

    @field_validator("new_password")
    @classmethod
    def validate_pwd(cls, value: str) -> str:
        return validate_password(value)
    
class RefreshTokenRequest(BaseModel):
    refresh_token: str

class LogoutRequest(BaseModel):
    refresh_token: str

class ProfileUpdate(BaseModel):
    programme: str | None = Field(default=..., max_length=255)
    bio: str | None = Field(default=..., max_length=300)

    @field_validator("programme", "bio", mode="before")
    @classmethod
    def strip_strings(cls, v: str | None) -> str | None:
        return v.strip() if isinstance(v, str) else v

    model_config = ConfigDict(
        extra="ignore"
    )

# response schemas
class UserResponse(UserBase):

    model_config = ConfigDict(from_attributes=True)
    
    id: int
    role: Literal["student", "admin"] = "student"
    is_verified: bool
    created_at: datetime

class MessageResponse(BaseModel):
    message: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str

class RefreshTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    refresh_token: str

class LoginResponse(BaseModel):
    message: str
    access_token: str
    token_type: str
    refresh_token: str
    user: UserResponse

class RegisterResponse(BaseModel):
    message: str
    user: UserResponse

class EnrolledModuleInfo(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    code: str
    name: str
    is_active: bool

class ProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    gender: str | None
    programme: str | None
    bio: str | None
    created_at: datetime
    enrolled_modules: list[EnrolledModuleInfo] = []
    groups_created: int = 0
    groups_joined: int = 0

class GroupSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    module_code: str
    description: str | None
    location: str | None
    date_time: datetime | None
    max_members: int

class MyGroupsResponse(BaseModel):
    groups_created: list[GroupSummary] = []
    groups_joined: list[GroupSummary] = []
