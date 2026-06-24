
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field, field_validator

class VenueCreate(BaseModel):

    model_config = ConfigDict(from_attributes=True)

    name: str = Field(..., min_length=2, max_length=255)
    capacity: int = Field(..., ge=1, le=1000)
    is_available: bool = True

    @field_validator("name")
    @classmethod
    def strip_name(cls, v: str) -> str:
        return v.strip()

class VenueUpdate(BaseModel):

    model_config = ConfigDict(from_attributes=True)

    name: str | None = Field(default=None, min_length=2, max_length=255)
    capacity: int | None = Field(default=None, ge=1, le=1000)
    is_available: bool | None = None

    @field_validator("name", mode="before")
    @classmethod
    def strip_name(cls, v: str | None) -> str | None:
        return v.strip() if isinstance(v, str) else v

class VenueResponse(BaseModel):

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: int 
    name: str
    capacity: int
    available: bool = Field(alias="is_available")
    created_at: datetime