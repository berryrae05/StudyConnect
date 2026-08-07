import traceback
from sqlalchemy.orm import Session

from app.admin.audit_model import AdminAction, AdminActionType

def log_admin_action(
        db: Session,
        admin_id: int,
        admin_label: str,
        action_type: AdminActionType,
        target_type: str,
        target_id: int | None = None,
        target_label: str | None = None,
        detail: str | None = None,
) -> None:
    try:
        db.add(AdminAction(
                admin_id = admin_id,
                admin_label = admin_label,
                action_type = action_type,
                target_id = target_id,
                target_label = target_label,
                target_type = target_type,
                detail = (detail or "")[:256] or None,
            )
        )
        db.commit()
    except Exception:
        traceback.print_exc()
