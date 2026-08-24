"""Business logic for study groups."""

from datetime import date

from fastapi import HTTPException, status
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.groups.model import Group
from app.groups.schema import GroupCreate
from app.modules.model import Module
from app.venues.model import Venue


def group_to_response(group: Group) -> dict:
    """Convert a Group ORM object into the API response format."""

    return {
        "id": group.id,
        "module_code": group.module_code,
        "description": group.description,
        "venue_id": group.venue_id,
        "start_time": group.start_time,
        "end_time": group.end_time,
        "max_members": group.max_members,
        "current_members": len(group.memberships),
        "created_by": group.created_by,
        "created_at": group.created_at,
    }


def create_group(
    data: GroupCreate,
    creator_id: int,
    db: Session,
) -> dict:
    """Create a new study group."""

    # If a venue was selected, validate it.
    if data.venue_id is not None:

        venue = (
            db.query(Venue)
            .filter(Venue.id == data.venue_id)
            .first()
        )

        if not venue:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Venue not found",
            )

        if not venue.is_available:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This venue is currently unavailable",
            )

        # Start and end times are required when booking a venue.
        if data.start_time is None or data.end_time is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Start time and end time are required when booking a venue",
            )

        # End time must be after start time.
        if data.end_time <= data.start_time:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="End time must be after start time",
            )

        # Check whether another group has already booked
        # this venue during the requested time.
        conflicting_group = (
            db.query(Group)
            .filter(
                Group.venue_id == data.venue_id,
                Group.start_time < data.end_time,
                Group.end_time > data.start_time,
            )
            .first()
        )

        if conflicting_group:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This venue is already booked during the selected time",
            )

        # Optional but useful: make sure the venue can fit the group.
        if data.max_members > venue.capacity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Group size cannot exceed the venue capacity "
                    f"of {venue.capacity}"
                ),
            )

    group = Group(
        module_code=data.module_code,
        description=data.description,
        venue_id=data.venue_id,
        start_time=data.start_time,
        end_time=data.end_time,
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
            func.date(Group.start_time) == study_date
        )

    groups = query.all()

    return [
        group_to_response(group)
        for group in groups
    ]


def get_group(
    group_id: int,
    db: Session,
) -> Group:
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


def delete_group(
    group_id: int,
    user_id: int,
    db: Session,
) -> None:
    """Delete a group if the requesting user is its creator."""

    group = get_group(group_id, db)

    if group.created_by != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the group creator can delete this group",
        )

    db.delete(group)
    db.commit()