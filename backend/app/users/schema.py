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
        Literal[
            "Male",
            "Female",
            "Nonbinary",
            "Prefer not to say"
        ]
        | None
    ) = None

# React -> Backend
# Used for creating (registering) a new user
class UserCreate(UserBase):

    password: str = Field(
        min_length=8, 
        max_length=72
    )

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

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

# Backend -> React
# Schema for reading/returning an item 
class UserResponse(UserBase):

    model_config = ConfigDict(from_attributes=True)
    
    id: int
    role: Literal["student", "admin"] = "student"
    is_verified: bool
    created_at: datetime

class TokenResponse(BaseModel):
    access_token: str
    token_type: str

class LoginResponse(TokenResponse):
    message: str
    user: UserResponse

class RegisterResponse(BaseModel):
    message: str
    user: UserResponse
