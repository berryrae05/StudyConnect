"""HTTP routes for joining and leaving study groups."""

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.memberships.schema import MembersListResponse, MembershipResponse
from app.memberships.service import join_group, leave_group, list_group_members
from app.shared.dependencies import get_current_user, get_db
from app.users.model import User

router = APIRouter(prefix="/groups", tags=["Memberships"])

DBDependency = Annotated[Session, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_user)]


@router.post("/{group_id}/join", response_model=MembershipResponse, status_code=201)
def join_study_group(
    group_id: int,
    db: DBDependency,
    current_user: CurrentUser,
):
    return join_group(group_id, current_user.id, db)


@router.post("/{group_id}/leave", status_code=204)
def leave_study_group(
    group_id: int,
    db: DBDependency,
    current_user: CurrentUser,
):
    leave_group(group_id, current_user.id, db)


@router.get("/{group_id}/members", response_model=MembersListResponse)
def get_group_members(group_id: int, db: DBDependency):
    return MembersListResponse(
        group_id=group_id,
        members=list_group_members(group_id, db),
    )