from datetime import date

from sqlalchemy import Date, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Attendance(Base):
    __tablename__ = "attendance"

    # Internal attendance record ID
    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    # Student
    student_id: Mapped[int] = mapped_column(
        ForeignKey("students.id", ondelete="CASCADE"),
        nullable=False,
    )

    # Subject
    # Example: EC0401
    subject_code: Mapped[str] = mapped_column(
        ForeignKey("subjects.code", ondelete="CASCADE"),
        nullable=False,
    )

    # Attendance date
    date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )

    # Attendance status
    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="present",
    )

    # Relationships
    student = relationship(
        "Student",
    )

    subject = relationship(
        "Subject",
    )

    # A student can have only one attendance
    # record for a subject on a particular date.
    __table_args__ = (
        UniqueConstraint(
            "student_id",
            "subject_code",
            "date",
            name="uq_student_subject_date",
        ),
    )