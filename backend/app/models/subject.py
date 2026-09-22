from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Subject(Base):
    __tablename__ = "subjects"

    # Subject ID / Code
    #
    # Format:
    # EC0401
    # ││││└└── Subject number: 01
    # ││└└──── Semester: 04
    # └└────── Department: EC
    #
    # Examples:
    # EC0401 -> EC, Semester 04, Subject 01
    # EC0402 -> EC, Semester 04, Subject 02
    # EC0501 -> EC, Semester 05, Subject 01
    code: Mapped[str] = mapped_column(
        String(6),
        primary_key=True,
        index=True,
    )

    # Subject name
    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    # Subject credits
    credits: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=3,
    )