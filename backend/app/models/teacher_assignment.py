from sqlalchemy import ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class TeacherAssignment(Base):
    __tablename__ = "teacher_assignments"

    # Internal assignment record ID
    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    # Teacher
    # Example: 1 -> TCH001
    teacher_id: Mapped[str] = mapped_column(
        ForeignKey("teachers.id", ondelete="CASCADE"),
        nullable=False,
    )

    # Subject
    # Example: EC0401
    subject_code: Mapped[str] = mapped_column(
        ForeignKey("subjects.code", ondelete="CASCADE"),
        nullable=False,
    )

    # Academic section
    # Example: 2301 -> Batch 23, Section 01
    section_id: Mapped[int] = mapped_column(
        ForeignKey("academic_sections.id", ondelete="CASCADE"),
        nullable=False,
    )

    # Relationships
    teacher = relationship(
        "Teacher",
    )

    subject = relationship(
        "Subject",
    )

    section = relationship(
        "AcademicSection",
    )

    # One subject can have only one teacher
    # in one section.
    #
    # Same teacher can teach multiple subjects
    # in the same section.
    __table_args__ = (
        UniqueConstraint(
            "subject_code",
            "section_id",
            name="uq_subject_section",
        ),
    )