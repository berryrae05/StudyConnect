"""Single helper function that every service class to write an audit row"""
import traceback

from fastapi import Request
from sqlalchemy.orm import Session

from app.auth.audit_model import AuthEvent, AuthEventType

def extract_ip(request: Request) -> str:

    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        
        return forwarded_for.split(",")[0].strip()
    if request.client:
        return request.client.host # Returns the real client IP
    return "unknown"

def log_auth_event(
        db: Session,
        request: Request, # The FastAPI Request object (for IP + User Agent)
        event_type: AuthEventType,
        user_id: int | None = None, # The authenticated/target user's id, None if unknown
        detail: str | None = None,
) -> None:
    
    try:
        ip = extract_ip(request)
        ua = (request.headers.get("User-Agent") or "")[:256]
        detail_s = (detail or "")[:256] or None

        event = AuthEvent(
            user_id = user_id,
            event_type = event_type.value,
            ip_address = ip,
            user_agent = ua or None,
            detail = detail_s,
        )
        db.add(event)
        db.commit()

    except Exception:

        traceback.print_exc