"""Business logic for group memberships."""

from sqlalchemy.orm import Session
from fastapi import HTTPException, status, Request
import asyncio

from app.groups.service import get_group
from app.memberships.model import Membership
from app.users.model import User
from app.auth.email import (
    send_join_notification,
    send_leave_notification,
    send_nearly_full_notification,
)


async def join_group(group_id: int, user_id: int, request: Request, db: Session) -> Membership:
    group = get_group(group_id, db)

    if group.created_by == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You created this group, you are already its administrator"
        )

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

    # Notifications
    creator = db.query(User).filter(User.id == group.created_by).first()
    joiner = db.query(User).filter(User.id == user_id).first()

    new_count = member_count + 1
    spots_remaining = group.max_members - new_count

    if creator and joiner:
        # Notify the creator that someone joined
        
        await send_join_notification(
            creator_email= creator.email,
            creator_name=creator.full_name,
            joiner_name=joiner.full_name,
            module_code=group.module_code,
            spots_remaining=spots_remaining,
            group_id=group.id,
        )
    

        # Notify the creator if the gorup just crossed 80% capacity
        threshold = group.max_members * 0.8
        if new_count >= threshold and not group.nearly_full_notified:
            group.nearly_full_notified = True
            db.commit()
           
            await send_nearly_full_notification(
                creator_email=creator.email,
                creator_name=creator.full_name,
                module_code=group.module_code,
                current_count=new_count,
                max_members=group.max_members,
                group_id=group.id
            )
  
    return membership


async def leave_group(group_id: int, user_id: int, request: Request, db: Session) -> None:
    group = get_group(group_id, db)

    if group.created_by == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You are the group creator. Delete the group instead.",
        )

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

    leaver = db.query(User).filter(User.id == user_id).first()

    db.delete(membership)

    #If count drops backe below 80%, reset the nearly-full flag
    remaining_after_leave = (
        db.query(Membership).filter(Membership.group_id == group_id).count() - 1
    )
    if remaining_after_leave < group.max_members * 0.8:
        group.nearly_full_notified = False

    db.commit()

    #Notification
    creator = db.query(User).filter(User.id == group.created_by).first()

    if creator and leaver:
        try:
            asyncio.create_task(
                send_leave_notification(
                    creator_email=creator.email,
                    creator_name=creator.full_name,
                    leaver_name=leaver.full_name,
                    module_code=group.module_code,
                    group_id=group.id,
                )
            )
        except RuntimeError:
            pass


def list_group_members(group_id: int, db: Session) -> list[int]:
    get_group(group_id, db)
    rows = (
        db.query(Membership.user_id)
        .filter(Membership.group_id == group_id)
        .order_by(Membership.joined_at.asc())
        .all()
    )
    return [row[0] for row in rows]