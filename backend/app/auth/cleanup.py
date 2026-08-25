"""Scheduled job that deltes expired refresh tokens from the database"""
import asyncio
from datetime import datetime, timezone, timedelta

from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.auth.token_model import RefreshToken
from app.groups.model import Group
from app.memberships.model import Membership
from app.users.model import User
from app.auth.email import send_session_reminder

# Every hour
CLEANUP_INTERVAL_SECONDS = 3600

scheduler = BackgroundScheduler()

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

def send_session_reminders() -> None:

    db: Session = SessionLocal()
    try:
        now = datetime.now(timezone.utc)
        window_start = now + timedelta(hours=23)
        window_end = now + timedelta(hours=25)

        groups = (
            db.query(Group)
            .filter(
                Group.date_time >= window_start,
                Group.date_time <= window_end,
                Group.date_time.isnot(None),
            )
            .all()
        )

        for group in groups:
            session_date = group.date_time.strftime("%d %B %Y at %H:%M")

            # Collect everyone to notify: creator + all members
            recipients = []

            creator = db.query(User).filter(User.id == group.created_by).first()
            if creator:
                recipients.append((creator.email, creator.full_name))

            members = (
                db.query(User.email, User.full_name)
                .join(Membership, Membership.user_id == User.id)
                .filter(Membership.group_id == group.id)
                .all()
            )
            recipients.extend(members)

            for email, name in recipients:
                try:
                    asyncio.run(
                        send_session_reminder(
                            email = email,
                            name = name,
                            module_code = group.module_code,
                            location = group.location,
                            session_date = session_date,
                            group_id = group.id,
                        )
                    )
                except Exception as e:
                    print(f"[reminders] Failed to email {email}: {e}")

        if groups:
            print(f"[reminders] Sent reminders for {len(groups)} group(s).")

    except Exception as e:
        print(f"[reminders] Error during session reminder job: {e}")
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

    # Registers the 24-hour session reminder job
    scheduler.add_job(
        send_session_reminders,
        trigger="interval",
        seconds=86400, # once per day
        id="session_reminders",
        replace_existing=True,
        max_instances=1,
    )

    scheduler.start()
    print("[cleanup] Scheduler started (token cleanup every 1 hour, session reminders every 24 hours).")

def stop_cleanup_scheduler() -> None:

    if scheduler.running:
        scheduler.shutdown(wait=False)
        print("[cleanup] Scheduler stopped .")     

