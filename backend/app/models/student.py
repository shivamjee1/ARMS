from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Student(Base):
    __tablename__ = "students"

    # Student ID:
    # 2301001 -> STU2301001
    # 23 = batch
    # 01 = section
    # 001 = roll number
    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    # Linked login/user account
    user_email: Mapped[str] = mapped_column(
        ForeignKey("users.email", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )

    # Academic section
    # Example: 2301 = Batch 23, Section 01
    section_id: Mapped[int] = mapped_column(
        ForeignKey("academic_sections.id", ondelete="RESTRICT"),
        nullable=False,
    )

    # Student's name
    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    # Relationships
    user = relationship(
        "User",
        back_populates="student",
    )

    section = relationship(
        "AcademicSection",
        back_populates="students",
    )

    