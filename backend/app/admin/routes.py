
from typing import Annotated

from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.shared.dependencies import get_db, get_current_user, get_current_admin
from app.users.model import User

# Module imports
from app.modules.schema import ModuleCreate, ModuleUpdate, ModuleResponse
from app.modules.services import (
    list_modules, create_module, update_module, delete_module
)

# Venue imports
from app.venues.schema import VenueCreate, VenueResponse, VenueUpdate
from app.venues.services import (
    list_venues, create_venue, update_venue, delete_venue
)

# Student admin imports
from app.users.admin_schema import StudentResponse, SuspendRequest, UnsuspendRequest
from app.users.admin_services import list_students, get_admin_stats, get_student, suspend_student, unsuspend_student

# Moderation imports
from app.moderation.schema import ReportCreate, ReportResponse, ReviewRequest
from app.moderation.services import list_reports, create_report, review_report

from app.admin.audit_model import AdminAction

DBDependency = Annotated[Session, Depends(get_db)]
CurrentAdmin = Annotated[User, Depends(get_current_admin)]
CurrentUser = Annotated[User, Depends(get_current_user)]

admin_router = APIRouter(prefix="/admin", tags=["Admin"])
public_router = APIRouter(tags=["Public"])
student_router = APIRouter(tags=["Students"])

def to_student_response(s) -> StudentResponse:
    return StudentResponse(
        id = s.id,
        name = s.full_name,
        email = s.email,
        role = s.role,
        verified = s.is_verified,
        joined = s.created_at,
        is_suspended = s.is_suspended,
        suspended_until = s.suspended_until,
        suspension_reason = s.suspension_reason,
    )

# Overview
@admin_router.get("/stats")
def admin_stats(db: DBDependency, admin: CurrentAdmin):
    return get_admin_stats(db)

# Modules

@admin_router.get("/modules", response_model=list[ModuleResponse])
def admin_list_modules(db: DBDependency, admin: CurrentAdmin):
    return list_modules(db, include_inactive=True)

@admin_router.post("/modules", response_model=ModuleResponse, status_code=201)
def admin_create_module(data: ModuleCreate, db: DBDependency, admin: CurrentAdmin):
    return create_module(data, db)

@admin_router.patch("/modules/{module_id}", response_model=ModuleResponse)
def admin_update_module(module_id: int, data: ModuleUpdate, db: DBDependency, admin: CurrentAdmin):
    return update_module(module_id, data, db)

@admin_router.delete("/modules/{module_id}", status_code=204)
def admin_delete_module(module_id: int, db: DBDependency, admin: CurrentAdmin):
    delete_module(module_id, db)

# Modules - student group creation picker
@public_router.get("/modules", response_model=list[ModuleResponse])
def public_list_modules(db: DBDependency):
    return list_modules(db, include_inactive=False)

# Venues

@admin_router.get("/venues", response_model=list[VenueResponse])
def admin_list_venues(db: DBDependency, admin: CurrentAdmin):
    return list_venues(db, available_only=False)

@admin_router.post("/venues", response_model=VenueResponse, status_code=201)
def admin_create_venues(data: VenueCreate, db: DBDependency, admin: CurrentAdmin):
    return create_venue(data, db)

@admin_router.patch("/venues/{venue_id}", response_model=VenueResponse)
def admin_update_venue(venue_id: int, data: VenueUpdate, db: DBDependency, admin: CurrentAdmin):
    return update_venue(venue_id, data, db)

@admin_router.delete("/venues/{venue_id}", status_code=204)
def admin_delete_venues(venue_id: int, db: DBDependency, admin: CurrentAdmin):

    delete_venue(venue_id, db)

# Venues - student group creation picker
@public_router.get("/venues", response_model=list[VenueResponse])
def public_list_venues(db: DBDependency):
    return list_venues(db, available_only=True)

# Students

@admin_router.get("/students", response_model=list[StudentResponse])
def admin_list_students(db: DBDependency, admin: CurrentAdmin):
    students = list_students(db)
    return [
        StudentResponse(
            id = s.id,
            name = s.full_name,
            email = s.email,
            role = s.role,
            verified = s.is_verified,
            joined = s.created_at,
            is_suspended = s.is_suspended,
            suspended_until = s.suspended_until,
            suspension_reason=s.suspension_reason,
        )
        for s in students
    ] 

@admin_router.patch("/students/{student_id}/suspend", response_model=StudentResponse)
def admin_suspend_student(student_id: int, data: SuspendRequest, db: DBDependency, admin: CurrentAdmin,):
    student = suspend_student(student_id, data, admin, db)
    return to_student_response(student)

@admin_router.patch("/students/{student_id}/unsuspend", response_model=StudentResponse)
def admin_unsuspend_student(student_id: int, data: UnsuspendRequest, db: DBDependency, admin: CurrentAdmin):
    student = unsuspend_student(student_id, data, admin, db)
    return to_student_response(student)

@admin_router.get("/students/{student_id}", response_model=StudentResponse)
def admin_get_student(student_id: int, db: DBDependency, admin: CurrentAdmin,):
    student = get_student(student_id, db)
    return to_student_response(student)

# Moderation

@admin_router.get("/reports", response_model=list[ReportResponse])
def admin_list_reports(db: DBDependency, admin: CurrentAdmin, status: str | None = None):
    return list_reports(db, status_filter=status)

@admin_router.patch("/reports/{report_id}/review", response_model=ReportResponse)
def admin_review_report(
    report_id: int,
    data: ReviewRequest,
    db: DBDependency,
    admin: CurrentAdmin,
):

    return review_report(report_id, data, db)

# Student - Any authenticated student can file a report against another user.
@student_router.post("/reports", response_model=ReportResponse, status_code=201)
def file_report(data: ReportCreate, db: DBDependency, current_user: CurrentUser,):
    return create_report(data, current_user.id, db)

@admin_router.get("/audit-log")
def admin_audit_log(db: DBDependency, admin: CurrentAdmin, limit: int = 50, offset: int = 0):

    # Shows who-did-what-to-what, most recent first
    actions = (
        db.query(AdminAction)
        .order_by(AdminAction.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    return [
        {
            "id": a.id,
            "admin": a.admin_label,
            "action": a.action_type,
            "target_type": a.target_type,
            "target": a.target_label,
            "detail": a.detail,
            "created_at": a.created_at,
        }
        for a in actions
    ]