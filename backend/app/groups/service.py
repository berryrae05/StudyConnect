"""Business logic for study groups."""

from datetime import date

from fastapi import HTTPException, status
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.groups.model import Group
from app.groups.schema import GroupCreate
from app.modules.model import Module


def create_group(data: GroupCreate, creator_id: int, db: Session) -> dict:
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
        {
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
        for group in groups
    ]


def get_group(group_id: int, db: Session) -> dict:
    """Return one study group with its current member count."""
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


def delete_group(group_id: int, user_id: int, db: Session) -> None:
    """Delete a group if the requesting user is its creator."""
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

    if group.created_by != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the group creator can delete this group",
        )

    db.delete(group)
    db.commit()
