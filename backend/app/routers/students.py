from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.database import get_db
from app.models.student import Student
from app.models.user import User
from app.models.academic_section import AcademicSection
from app.schemas.student import StudentCreate, StudentResponse


router = APIRouter(
    prefix="/students",
    tags=["Students"],
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
    response_model=StudentResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_student(
    student_data: StudentCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    user = (
        db.query(User)
        .filter(User.email == student_data.user_email)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    if user.role != "student":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User must have student role",
        )

    existing_profile = (
        db.query(Student)
        .filter(Student.user_email == student_data.user_email)
        .first()
    )

    if existing_profile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Student profile already exists",
        )

    section = (
        db.query(AcademicSection)
        .filter(AcademicSection.id == student_data.section_id)
        .first()
    )

    if not section:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Academic section not found",
        )

    existing_roll = (
        db.query(Student)
        .filter(Student.id == student_data.id)
        .first()
    )

    if existing_roll:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Roll number already exists",
        )

    student = Student(
        user_email=student_data.user_email,
        section_id=student_data.section_id,
        id=student_data.id,
        name=student_data.name,
    )

    db.add(student)
    db.commit()
    db.refresh(student)

    return student

@router.get(
    "",
    response_model=list[StudentResponse],
)
def get_students(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return db.query(Student).all()