from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.users.model import User
from app.auth.token_model import RefreshToken
from app.users.admin_schema import SuspendRequest, UnsuspendRequest
from app.admin.audit import log_admin_action
from app.admin.audit_model import AdminActionType

def list_students(db: Session) -> list:

    return (
        db.query(User)
        .filter(User.role == "student")
        .order_by(User.created_at.desc())
        .all()
    )

def get_student(student_id: int, db: Session) -> User:
    user = db.query(User).filter(User.id == student_id, User.role == "student").first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")
    return user

# Prevents admins from suspending other admins or themselves
def self_protection_check(target: User, admin: User) -> None:

    if target.role == "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin accounts cannot be suspended through this endpoint.",
        )
    if target.id == admin.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You cannot suspend your own account.",
        )
# Suspends a student account, either permanently or for duration_days
def suspend_student(student_id: int, data: SuspendRequest, admin: User, db: Session) -> User:

    from datetime import datetime, timezone

    user = get_student(student_id, db)
    self_protection_check(user, admin)

    if user.is_suspended:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Account is already suspended",
        )

    now = datetime.now(timezone.utc)

    user.is_suspended = True
    user.suspension_reason = data.reason
    user.suspended_until = (
        now + timedelta(days=data.duration_days) if data.duration_days else None
    )
    
    # Evict all active sessions immediately
    db.query(RefreshToken).filter(RefreshToken.user_id == user.id).delete()
    user.invalidate_tokens_before = datetime.now(timezone.utc)

    db.commit()
    db.refresh(user)

    log_admin_action(
        db,
        admin_id=admin.id,
        admin_label=f"{admin.full_name} ({admin.email})",
        action_type=(AdminActionType.STUDENT_SUSPENDED),
        target_type="student",
        target_id=user.id,
        target_label=f"{user.full_name} ({user.email})",
        detail=(
            f"reason: {data.reason} | "
            f"{'permanent' if not data.duration_days else f'{data.duration_days} days'}"    
        ),
    )

    return user

def unsuspend_student(student_id: int, data: UnsuspendRequest, admin: User, db: Session) -> User:
    
    user = get_student(student_id, db)
    self_protection_check(user, admin)

    if not user.is_suspended:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account is not suspended",
    )

    user.is_suspended = False
    user.suspended_until = None
    user.suspension_reason = None

    db.commit()
    db.refresh(user)

    log_admin_action(
        db,
        admin_id=admin.id,
        admin_label=f"{admin.full_name} ({admin.email})",
        action_type=AdminActionType.STUDENT_UNSUSPENDED,
        target_type="student",
        target_id=user.id,
        target_label=f"{user.full_name} ({user.email})",
        detail=f"reason: {data.reason}",
    )

    return user

# Auto restores accounts whose timed suspension has passed
def check_and_lift_expired_suspension(db: Session) -> int:

    now = datetime.now(timezone.utc)

    expired = (
        db.query(User)
        .filter(
            User.is_suspended == True,
            User.suspended_until.isnot(None),
            User.suspended_until < now
        )
        .all()
    )

    count = len(expired)
    for user in expired:
        user.is_suspended = False
        user.suspended_until = None
        user.suspension_reason = None

    db.commit()
    return count
    
def is_suspension_active(user: User, db: Session) -> bool:

    if not user.is_suspended:
        return False
    
    # Permanent ban 
    if user.suspended_until is None:
        return True
    
    suspended_until = user.suspended_until
    if suspended_until.tzinfo is None:
        suspended_until = suspended_until.replace(tzinfo=timezone.utc)
    
    now = datetime.now(timezone.utc)
    if now < suspended_until:
        return True
    
    # Suspension has expired
    user.is_suspended = False
    user.suspended_until = None
    user.suspension_reason = None
    db.commit()
    return False

def get_admin_stats(db: Session) -> dict:

    from app.groups.model import Group
    from app.modules.model import Module
    from app.venues.model import Venue
    from sqlalchemy import func

    total_students = db.query(func.count(User.id)).filter(User.role == "student").scalar()
    active_groups = db.query(func.count(Group.id)).scalar()
    total_modules = db.query(func.count(Module.id)).filter(Module.is_active == True).scalar()
    total_venues = db.query(func.count(Venue.id)).scalar()

    return {
        "total_students": total_students or 0,
        "active_groups": active_groups or 0,
        "modules": total_modules or 0,
        "venues": total_venues or 0,
    }