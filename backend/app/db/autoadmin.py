from sqlalchemy import select

from app.db.database import SessionLocal
from app.models.user import User
from app.core.security import hash_password


def create_default_admin():
    db = SessionLocal()

    try:
        admin_email = "admin@college.com"

        existing_admin = db.scalar(
            select(User).where(User.email == admin_email)
        )

        if existing_admin:
            return

        admin = User(
            email=admin_email,
            password_hash=hash_password("Admin@123"),
            role="admin",
            is_active=True,
        )

        db.add(admin)
        db.commit()

        print("✅ Default admin created.")

    finally:
        db.close()