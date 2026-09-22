from datetime import datetime

from sqlalchemy import DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class AcademicSection(Base):
    __tablename__ = "academic_sections"

    # Section ID: 2301, 2302, 2401, ...
    # 23 = batch, 01 = section
    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    # Batch: 23, 24, 25, ...
    batch: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    # Section code: 01, 02, ... 99
    section_code: Mapped[str] = mapped_column(
        String(2),
        nullable=False,
    )

    students = relationship(
        "Student",
        back_populates="section",
    )