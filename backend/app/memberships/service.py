"""Business logic for group memberships."""

from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.groups.service import get_group
from app.memberships.model import Membership


def join_group(group_id: int, user_id: int, db: Session) -> Membership:
    group = get_group(group_id, db)

    existing = (
        db.query(Membership)
        .filter(
            Membership.user_id == user_id,
            Membership.group_id == group_id,
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You are already a member of this group",
        )

    member_count = (
        db.query(Membership).filter(Membership.group_id == group_id).count()
    )
    if member_count >= group.max_members:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This group is full",
        )

    membership = Membership(user_id=user_id, group_id=group_id)
    db.add(membership)
    db.commit()
    db.refresh(membership)
    return membership


def leave_group(group_id: int, user_id: int, db: Session) -> None:
    get_group(group_id, db)

    membership = (
        db.query(Membership)
        .filter(
            Membership.user_id == user_id,
            Membership.group_id == group_id,
        )
        .first()
    )
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="You are not a member of this group",
        )

    db.delete(membership)
    db.commit()


def list_group_members(group_id: int, db: Session) -> list[int]:
    get_group(group_id, db)
    rows = (
        db.query(Membership.user_id)
        .filter(Membership.group_id == group_id)
        .order_by(Membership.joined_at.asc())
        .all()
    )
    return [row[0] for row in rows]