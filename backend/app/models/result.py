from sqlalchemy import ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Result(Base):
    __tablename__ = "results"

    # Internal result record ID
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

    # Assessment
    assessment_name: Mapped[str] = mapped_column(
        ForeignKey("assessments.name", ondelete="CASCADE"),
        nullable=False,
    )

    # Marks obtained
    marks: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    # Relationships
    student = relationship(
        "Student",
    )

    subject = relationship(
        "Subject",
    )

    assessment = relationship(
        "Assessment",
    )

    # One result per student + subject + assessment
    __table_args__ = (
        UniqueConstraint(
            "student_id",
            "subject_code",
            "assessment_name",
            name="uq_student_subject_assessment",
        ),
    )