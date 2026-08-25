
from typing import Annotated

from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.shared.dependencies import get_db, get_current_user
from app.users.model import User
from app.users.schema import ProfileResponse, ProfileUpdate, MyGroupsResponse, MessageResponse
from app.users.profile_services import (
    get_own_profile,
    get_public_profile, 
    update_profile, 
    enrol_in_module, 
    unenrol_from_module, 
    get_my_groups,
)

router = APIRouter(tags=["Profile"])

DBDependency = Annotated[Session, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_user)]

#Own Profile
@router.get("/me/profile", response_model=ProfileResponse)
def get_profile(db: DBDependency, current_user: CurrentUser):
    return get_own_profile(current_user, db)

@router.patch("/me/profile", response_model=ProfileResponse)
def patch_profile(data: ProfileUpdate, db: DBDependency, current_user: CurrentUser,):
    return update_profile(current_user, data, db)

# My groups
@router.get("/me/groups", response_model=MyGroupsResponse)
def get_my_own_groups_route(db: DBDependency, current_user: CurrentUser):
    return get_my_groups(current_user, db)

# Module Enrolment

@router.post("/me/modules/{module_id}", response_model=ProfileResponse)
def enrol_module(module_id: int, db: DBDependency, current_user: CurrentUser):
    return enrol_in_module(current_user, module_id, db)

@router.delete("/me/modules/{module_id}", response_model=ProfileResponse)
def unenrol_module(module_id: int, db: DBDependency, current_user: CurrentUser):
    return unenrol_from_module(current_user, module_id, db)

# Public Profile

@router.get("/users/{user_id}/profile", response_model=ProfileResponse)
def get_student_profile(user_id: int, db: DBDependency, current_user: CurrentUser):
    return get_public_profile(user_id, db)