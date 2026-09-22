from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.database import get_db
from app.models.subject import Subject
from app.models.user import User
from app.schemas.subject import SubjectCreate, SubjectResponse


router = APIRouter(
    prefix="/subjects",
    tags=["Subjects"],
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
    response_model=SubjectResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_subject(
    subject_data: SubjectCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    existing = (
        db.query(Subject)
        .filter(Subject.code == subject_data.code)
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Subject code already exists",
        )

    subject = Subject(
        code=subject_data.code,
        name=subject_data.name,
        credits=subject_data.credits,
    )

    db.add(subject)
    db.commit()
    db.refresh(subject)

    return subject

@router.get(
    "",
    response_model=list[SubjectResponse],
)
def get_subjects(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return db.query(Subject).all()

@router.get(
    "/{subject_code}",
    response_model=SubjectResponse,
)
def get_subject(
    subject_code: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    subject = (
        db.query(Subject)
        .filter(Subject.code == subject_code)
        .first()
    )

    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subject not found",
        )

    return subject

@router.put(
    "/{subject_code}",
    response_model=SubjectResponse,
)
def update_subject(
    subject_code: str,
    subject_data: SubjectCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    subject = (
        db.query(Subject)
        .filter(Subject.code == subject_code)
        .first()
    )

    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subject not found",
        )

    subject.code = subject_data.code
    subject.name = subject_data.name
    subject.credits = subject_data.credits

    db.commit()
    db.refresh(subject)

    return subject

@router.delete(
    "/{subject_code}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_subject(
    subject_code: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    subject = (
        db.query(Subject)
        .filter(Subject.code == subject_code)
        .first()
    )

    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subject not found",
        )

    db.delete(subject)
    db.commit()