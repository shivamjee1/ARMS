from app.core.security import hash_password
from app.db.database import SessionLocal
from app.models.user import User


def create_admin():
    db = SessionLocal()

    try:
        email = "shivam8621116@gmail.com"
        password = "PASS"

        existing_user = (
            db.query(User)
            .filter(User.email == email)
            .first()
        )

        if existing_user:
            print("Admin already exists.")
            return

        admin = User(
            email=email,
            password_hash=hash_password(password),
            role="admin",
        )

        db.add(admin)
        db.commit()

        print("Admin created successfully.")
        print(f"Email: {email}")

    finally:
        db.close()


if __name__ == "__main__":
    create_admin()