"""Business logic for study groups."""

from datetime import date

from fastapi import HTTPException, status, Request
from sqlalchemy import func, or_
from sqlalchemy.orm import Session
import asyncio

from app.groups.model import Group
from app.groups.schema import GroupCreate
from app.modules.model import Module
from app.memberships.model import Membership
from app.users.model import User
from app.auth.email import send_cancellation_notification


def group_to_response(group: Group) -> dict:
    """Convert a Group ORM object into the API response format."""
    return {
        "id": group.id,
        "module_code": group.module_code,
        "description": group.description,
        "location": group.location,
        "date_time": group.date_time,
        "max_members": group.max_members,
        "current_members": len(group.memberships),
        "created_by": group.created_by,
        "created_at": group.created_at,
    }


def create_group(data: GroupCreate, creator_id: int, request: Request, db: Session) -> dict:
    """Create a new study group."""
    group = Group(
        module_code=data.module_code,
        description=data.description,
        location=data.location,
        date_time=data.date_time,
        max_members=data.max_members,
        created_by=creator_id,
    )

    db.add(group)
    db.commit()
    db.refresh(group)

    return group_to_response(group)


def list_groups(
    db: Session,
    module_code: str = None,
    study_date: date = None,
) -> list[dict]:
    """Return study groups, optionally filtered by module and study date."""
    query = (
        db.query(Group)
        .outerjoin(Module, Group.module_code == Module.code)
    )

    if module_code:
        search = module_code.replace(" ", "").lower()
        query = query.filter(
            or_(
                # Search by module code
                func.replace(
                    func.lower(Group.module_code),
                    " ",
                    "",
                ).contains(search),

                # Search by full module name
                func.lower(Module.name).contains(
                    module_code.strip().lower()
                ),
            )
        )

    if study_date:
        query = query.filter(
            func.date(Group.date_time) == study_date
        )

    groups = query.all()

    return [
        group_to_response(group)
        for group in groups
    ]


def get_group(group_id: int, db: Session) -> Group:
    """Return one study group by its ID."""
    group = (
        db.query(Group)
        .filter(Group.id == group_id)
        .first()
    )

    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found",
        )

    return group


async def delete_group(group_id: int, user_id: int, request: Request, db: Session) -> None:
    """Delete a group if the requesting user is its creator."""
    group = get_group(group_id, db)

    if group.created_by != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the group creator can delete this group",
        )

    members_to_notify = (
        db.query(User.email, User.full_name)
        .join(Membership, Membership.user_id == User.id)
        .filter(Membership.group_id == group_id)
        .all()
    )

    #Snapshots the group details we'll need in the email
    module_code = group.module_code
    location = group.location
    session_date = (
        group.date_time.strftime("%d %B %B at %H:%M")
        if group.date_time else None
    )

    #Membership cleanup first
    db.query(Membership).filter(Membership.group_id == group_id).delete()
    db.delete(group)
    db.commit()

    #Send cancellaion email
    for member_email, member_name in members_to_notify:
       
        await send_cancellation_notification(
            member_email=member_email,
            member_name=member_name,
            module_code=module_code,
            location=location,
            session_date=session_date,
            group_id=group_id,
        )
            
