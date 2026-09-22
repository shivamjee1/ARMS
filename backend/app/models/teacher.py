from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Teacher(Base):
    __tablename__ = "teachers"

    # Teacher ID:
    # 1   -> TCH001
    # 25  -> TCH025
    # 900 -> TCH900
    id: Mapped[str] = mapped_column(
        String(10),
        primary_key=True,
        index=True,
    )

    # Linked login/user account
    user_email: Mapped[str] = mapped_column(
        ForeignKey("users.email", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )

    # Teacher's name
    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    user = relationship(
        "User",
        back_populates="teacher",
    )
    