from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.database import get_db
from app.models.academic_section import AcademicSection
from app.models.user import User
from app.schemas.academic_section import (
    AcademicSectionCreate,
    AcademicSectionResponse,
)


router = APIRouter(
    prefix="/academic-sections",
    tags=["Academic Sections"],
)


def require_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )

    return current_user


@router.post(
    "",
    response_model=AcademicSectionResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_section(
    section_data: AcademicSectionCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    existing = (
        db.query(AcademicSection)
        .filter(AcademicSection.id == section_data.id)
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Academic section already exists",
        )

    section = AcademicSection(
        id=section_data.id,
        batch=section_data.batch,
        section_code=section_data.section_code,
    )

    db.add(section)
    db.commit()
    db.refresh(section)

    return section


@router.get(
    "",
    response_model=list[AcademicSectionResponse],
)
def get_sections(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return db.query(AcademicSection).all()


@router.get(
    "/{section_id}",
    response_model=AcademicSectionResponse,
)
def get_section(
    section_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    section = (
        db.query(AcademicSection)
        .filter(AcademicSection.id == section_id)
        .first()
    )

    if not section:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Academic section not found",
        )

    return section


@router.put(
    "/{section_id}",
    response_model=AcademicSectionResponse,
)
def update_section(
    section_id: int,
    section_data: AcademicSectionCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    section = (
        db.query(AcademicSection)
        .filter(AcademicSection.id == section_id)
        .first()
    )

    if not section:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Academic section not found",
        )

    # Prevent changing the ID to an ID that already belongs to another section
    if section_data.id != section_id:
        existing = (
            db.query(AcademicSection)
            .filter(AcademicSection.id == section_data.id)
            .first()
        )

        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Academic section ID already exists",
            )

        section.id = section_data.id

    section.batch = section_data.batch
    section.section_code = section_data.section_code

    db.commit()
    db.refresh(section)

    return section


@router.delete(
    "/{section_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_section(
    section_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    section = (
        db.query(AcademicSection)
        .filter(AcademicSection.id == section_id)
        .first()
    )

    if not section:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Academic section not found",
        )

    db.delete(section)
    db.commit()
