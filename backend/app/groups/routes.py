"""HTTP routes for study groups."""

from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session

from app.groups.schema import GroupCreate, GroupResponse
from app.groups.service import (
    create_group,
    delete_group,
    get_group,
    group_to_response,
    list_groups,
)
from app.shared.dependencies import get_current_user, get_db
from app.users.model import User


router = APIRouter(
    prefix="/groups",
    tags=["Groups"],
)


DBDependency = Annotated[
    Session,
    Depends(get_db),
]

CurrentUser = Annotated[
    User,
    Depends(get_current_user),
]


@router.post(
    "",
    response_model=GroupResponse,
    status_code=201,
)
def create_study_group(
    data: GroupCreate,
    db: DBDependency,
    current_user: CurrentUser,
    request: Request,
):
    return create_group(
        data,
        current_user.id, 
        request,
        db,
    )


@router.get(
    "",
    response_model=list[GroupResponse],
)
def get_groups(
    db: DBDependency,
    module_code: str | None = Query(
        default=None,
        max_length=64,
    ),
    study_date: date | None = Query(
        default=None,
    ),
):
    result = list_groups(
        db,
        module_code=module_code,
        study_date=study_date,
    )

    return result


@router.get(
    "/{group_id}",
    response_model=GroupResponse,
)
def get_study_group(
    group_id: int,
    db: DBDependency,
):
    group = get_group(
        group_id,
        db,
    )

    return group_to_response(group)


@router.delete(
    "/{group_id}",
    status_code=204,
)
async def delete_study_group(
    group_id: int,
    db: DBDependency,
    current_user: CurrentUser,
    request: Request,
):
    return await delete_group(
        group_id,
        current_user.id, 
        request,
        db,
    )