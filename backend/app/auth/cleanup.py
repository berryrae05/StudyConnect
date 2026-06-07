"""Scheduled job that deltes expired refresh tokens from the database"""
from datetime import datetime, timezone

from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.auth.token_model import RefreshToken

# Every hour
CLEANUP_INTERVAL_SECONDS = 3600

scheduler = BackgroundScheduler

def cleanup_expired_tokens() -> None:

    db: Session = SessionLocal()

    try:
        now = datetime.now(timezone.utc)
        deleted = (
            db.query(RefreshToken)
            .filter(RefreshToken.expires_at < now)
            .delete(synchronize_session=False)
        ) # Deletes all RefreshToken rows whose expires_at is in the past
        db.commit()
        if deleted:
            print(f"[cleanup] Deleted {deleted} expired refresh token(s).")
    except Exception as e:
        db.rollback()
        print(f"[cleanup] Error during token cleanup: {e}")
    finally:
        db.close()

def start_cleanup_scheduler() -> None:

    # Registers the cleanup job and starts the background scheduler
    scheduler.add_job(
        cleanup_expired_tokens,
        trigger="interval",
        seconds=CLEANUP_INTERVAL_SECONDS,
        id="cleanup_expired_tokens",
        replace_existing=True,
        max_instances=1
    )
    scheduler.start()
    print("[cleanup] Token cleanup scheduler started (every 1 hour).")

def stop_cleanup_schedular() -> None:

    if scheduler.running:
        scheduler.shutdown(wait=False)
        print("[cleanup] Token cleanup stopped.")            