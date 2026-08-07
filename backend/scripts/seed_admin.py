import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.database import SessionLocal
from app.users.model import User
from app.auth.security import hash_password
from app.auth.password_history_model import PasswordHistory

import os
print("CWD:", os.getcwd())

def seed_admin(email: str, password: str, full_name: str = "Full Name"):
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == email).first()
        if existing:
            print(f"Admin '{email}' already exists (id={existing.id}, role='{existing.role}')")
            return

        hashed = hash_password(password)
        admin = User(
            full_name = full_name,
            email = email,
            password = hashed,
            role = "admin",
            is_verified = True
        )
        db.add(admin)
        db.flush()
        db.add(PasswordHistory(user_id=admin.id, password=hashed))
        db.commit()
        print(f"Created admin {email} (is={admin.id})")

    finally:
        db.close()

if __name__ == "__main__":
    seed_admin(
        full_name="Andisiwe Admin",
        email="4334941@myuwc.ac.za",
        password="TestPassword@28"
    )
