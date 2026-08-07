
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.moderation.model import Report
from app.moderation.schema import ReportCreate, ReviewRequest
from app.users.model import User

def format_report(report: Report, db: Session) -> dict:

    # Reporter name
    reporter_name = "Unknown"
    if report.reported_by_id:
        reporter = db.query(User).filter(User.id == report.reported_by_id).first()
        if reporter:
            reporter_name = reporter.full_name

    # Against name
    against_name = report.against_name or "Unknown User"
    if report.against_user_id:
        against_user = db.query(User).filter(User.id == report.against_user_id).first()
        if against_user:
            against_name = against_user.full_name

    return {
        "id": report.id,
        "reportedBy": reporter_name,
        "against": against_name,
        "reason": report.reason,
        "date": report.created_at,
        "status": report.status,
        "admin_notes": report.admin_notes,
    }

def list_reports(db: Session, status_filter: str | None = None) -> list[dict]:

    if status_filter:
        status_filter = status_filter.strip().lower()

        allowed = {"pending", "reviewed", "dismissed"}

        if status_filter not in allowed:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Status must be pending, reviewed, or dismissed",
            )

    query = db.query(Report)
    if status_filter:
        query = query.filter(Report.status == status_filter)
    reports = query.order_by(Report.created_at.desc()).all()
    return [format_report(r, db) for r in reports]

def create_report(data: ReportCreate, reporter_id: int, db: Session) -> dict:
    report = Report(
        reported_by_id = reporter_id,
        against_user_id = data.against_user_id,
        against_name = data.against_name,
        reason = data.reason,
        status = "pending",
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return format_report(report, db)

def review_report(report_id: int, data: ReviewRequest, db: Session) -> dict:
    status_value = data.status.strip().lower()

    if status_value not in ("reviewed", "dismissed"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Status must be 'reviewed' or 'dismissed'",
        )

    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")
    if report.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Report is already '{report.status}'",
        )

    report.status = status_value
    report.admin_notes = data.admin_notes
    report.reviewed_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(report)
    return format_report(report, db)