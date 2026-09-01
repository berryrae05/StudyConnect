from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException, status

from app.users.model import User, UserModule
from app.users.schema import ProfileUpdate, ProfileResponse, EnrolledModuleInfo, MyGroupsResponse
from app.modules.model import Module
from app.groups.model import Group
from app.memberships.model import Membership

def build_profile_response(user:User, db: Session) -> ProfileResponse:

    enrolled = (
        db.query(Module)
        .join(UserModule, UserModule.module_id == Module.id)
        .filter(UserModule.user_id == user.id)
        .order_by(Module.code)
        .all()
    )

    enrolled_modules = [
        EnrolledModuleInfo(
            id = m.id,
            code = m.code,
            name = m.name,
            is_active = m.is_active,
        )
        for m in enrolled
    ]

    #Derived counts
    groups_created = (
        db.query(func.count(Group.id))
        .filter(Group.created_by == user.id)
        .scalar() or 0
    )
    groups_joined = (
        db.query(func.count(Membership.id))
        .filter(Membership.user_id == user.id)
        .scalar() or 0
    )

    return ProfileResponse(
        id = user.id,
        full_name = user.full_name,
        gender = user.gender,
        programme = user.programme,
        bio = user.bio,
        created_at = user.created_at,
        enrolled_modules = enrolled_modules,
        groups_created = groups_created,
        groups_joined = groups_joined,
    )

def get_own_profile(current_user: User, db: Session) -> ProfileResponse:
    # returns the authenticated user's full profile
    return build_profile_response(current_user, db)

#GET /users/{id}/profile returns any students's public profile
def get_public_profile(user_id: int, db: Session) -> ProfileResponse:

    user = (
        db.query(User)
        .filter(User.id == user_id, User.role == "student")
        .first()
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    return build_profile_response(user, db)

def update_profile(current_user: User, data: ProfileUpdate, db: Session) -> ProfileResponse:

    if "programme" in data.model_fields_set:
        current_user.programme = data.programme
    if "bio" in data.model_fields_set:
        current_user.bio = data.bio

    db.commit()
    db.refresh(current_user)

    return build_profile_response(current_user, db)

def enrol_in_module(current_user: User, module_id: int, db: Session) -> ProfileResponse:

    #Confirm the module exists and is active
    module = db.query(Module).filter(Module.id == module_id).first()
    if not module:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Module not found",
        )
    if not module.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This module is no longer active",
        )

    #Check not already enrolled 
    existing = (
        db.query(UserModule)
        .filter(
            UserModule.user_id == current_user.id,
            UserModule.module_id == module_id,
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You are already enrolled in this module",
        )
    db.add(UserModule(user_id=current_user.id, module_id=module_id))
    db.commit()

    return build_profile_response(current_user, db)

def unenrol_from_module(current_user: User, module_id: int, db: Session) -> ProfileResponse:

    enrolment = (
        db.query(UserModule)
        .filter(
            UserModule.user_id == current_user.id,
            UserModule.module_id == module_id,
        )
        .first()
    )
    if not enrolment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="You are not enrolled in this module",
        )
    db.delete(enrolment)
    db.commit()

    return build_profile_response(current_user, db)

def get_my_groups(current_user: User, db: Session) -> MyGroupsResponse:

    groups_created = (
        db.query(Group)
        .filter(Group.created_by == current_user.id)
        .order_by(Group.created_at.desc())
        .all()
    )

    groups_joined = (
        db.query(Group)
        .join(Membership, Membership.group_id == Group.id)
        .filter(
            Membership.user_id == current_user.id,
            Group.created_by != current_user.id #exclude own groups
        )
        .order_by(Membership.joined_at.desc())
        .all()
    )

    return MyGroupsResponse(
        groups_created = groups_created,
        groups_joined = groups_joined,
    )
