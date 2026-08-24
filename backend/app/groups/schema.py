"""Pydantic schemas for study groups (request/response models)."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class GroupCreate(BaseModel):
    """Fields the client sends when creating a group."""

    model_config = ConfigDict(from_attributes=True)

    module_code: str = Field(..., max_length=64)

    description: str | None = None

    venue_id: int | None = None

    start_time: datetime | None = None

    end_time: datetime | None = None

    max_members: int = Field(
        default=10,
        ge=1,
        le=500,
    )


class GroupResponse(BaseModel):
    """Fields returned from the API."""

    model_config = ConfigDict(from_attributes=True)

    id: int

    module_code: str

    description: str | None = None

    venue_id: int | None = None

    start_time: datetime | None = None

    end_time: datetime | None = None

    max_members: int

    current_members: int

    created_by: int

    created_at: datetime