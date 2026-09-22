from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.database import get_db
from app.models.teacher import Teacher
from app.models.user import User
from app.schemas.teacher import TeacherCreate, TeacherResponse


router = APIRouter(
    prefix="/teachers",
    tags=["Teachers"],
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
    response_model=TeacherResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_teacher(
    teacher_data: TeacherCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    user = (
        db.query(User)
        .filter(User.email == teacher_data.user_email)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    if user.role != "teacher":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User must have teacher role",
        )

    existing_id = (
            db.query(Teacher)
            .filter(Teacher.id == teacher_data.id)
            .first()
        )
    
    if existing_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Teacher id already exists",
        )
    

    existing_profile = (
        db.query(Teacher)
        .filter(Teacher.user_email == teacher_data.user_email)
        .first()
    )

    if existing_profile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Teacher profile already exists",
        )


    teacher = Teacher(
        id=teacher_data.id,
        user_email=teacher_data.user_email,
        name=teacher_data.name,
    )

    db.add(teacher)
    db.commit()
    db.refresh(teacher)

    return teacher

@router.get(
    "",
    response_model=list[TeacherResponse],
)
def get_teachers(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return db.query(Teacher).all()