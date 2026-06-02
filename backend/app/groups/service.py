"""Business logic for study groups."""

from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from datetime import date

from app.groups.model import Group
from app.groups.schema import GroupCreate
from app.memberships.model import Membership
from sqlalchemy import func


def create_group(data: GroupCreate, creator_id: int, db: Session) -> Group:
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
    return group


def list_groups(db: Session, module_code: str = None, study_date: date = None):
    query = db.query(Group)
    if module_code:
        query = query.filter(Group.module_code == module_code)
    
    if study_date:
        from sqlalchemy import func
        query = query.filter(func.date(Group.date_time) == study_date)
    result = query.all()
    return result


def get_group(group_id: int, db: Session) -> Group:
    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found",
        )
    return group


def delete_group(group_id: int, user_id: int, db: Session) -> None:
    group = get_group(group_id, db)
    if group.created_by != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the group creator can delete this group",
        )
    db.delete(group)
    db.commit()