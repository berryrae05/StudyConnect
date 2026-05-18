"""Pydantic schemas for group membership (request/response models)."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class MembershipCreate(BaseModel):
    """Payload for creating a membership (user joins a group)."""

    model_config = ConfigDict(from_attributes=True)

    user_id: int
    group_id: int
    joined_at: datetime | None = None


class MembershipResponse(BaseModel):
    """One membership row returned from the API."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    group_id: int
    joined_at: datetime


class JoinLeaveRequest(BaseModel):
    """Body for join/leave routes (integer ids match the database)."""

    model_config = ConfigDict(from_attributes=True)

    user_id: int


class MembersListResponse(BaseModel):
    """Member ids for one group."""

    model_config = ConfigDict(from_attributes=True)

    group_id: int
    members: list[int]
