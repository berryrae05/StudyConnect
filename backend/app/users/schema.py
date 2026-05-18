from pydantic import BaseModel, EmailStr, ConfigDict, Field
from datetime import datetime
from typing import Optional

# Base schema with common attributes
class UserBase(BaseModel):

    model_config = ConfigDict(from_attribite=True)

    full_name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    gender: str | None = None

# React -> Backend
# Used for creating (registering) a new user
class UserCreate(UserBase):

    password: str = Field(min_length=6, max_length=100)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

# Backend -> React
# Schema for reading/returning an item 
class UserResponse(UserBase):

    model_config = ConfigDict(from_attributes=True)
    
    id: int
    role: str
    is_verified: bool
    created_at: datetime
