from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field, field_validator

class StudentResponse(BaseModel):

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: int
    name: str
    email: str
    role: str
    verified: bool
    joined: datetime
    is_suspended: bool
    suspended_until: datetime | None = None
    suspension_reason: str | None = None

class SuspendRequest(BaseModel):

    duration_days: int | None = Field(default=None, ge=1, le=365)
    reason: str = Field(..., min_length=5, max_length=500)

    @field_validator("reason")
    @classmethod
    def strip_reason(cls, v: str) -> str:
        return v.strip()

class UnsuspendRequest(BaseModel):

    reason: str = Field(..., min_length=5, max_length=500)

    @field_validator("reason")
    @classmethod
    def strip_reason(cls, v: str) -> str:
        return v.strip()