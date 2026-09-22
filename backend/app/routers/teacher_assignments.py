from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.database import get_db
from app.models.teacher import Teacher
from app.models.subject import Subject
from app.models.academic_section import AcademicSection
from app.models.teacher_assignment import TeacherAssignment
from app.models.user import User
from app.schemas.teacher_assignment import (
    TeacherAssignmentCreate,
    TeacherAssignmentResponse,
)


router = APIRouter(
    prefix="/teacher-assignments",
    tags=["Teacher Assignments"],
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
    response_model=TeacherAssignmentResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_assignment(
    assignment_data: TeacherAssignmentCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    teacher = (
        db.query(Teacher)
        .filter(Teacher.id == assignment_data.teacher_id)
        .first()
    )

    if not teacher:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Teacher not found",
        )

    subject = (
        db.query(Subject)
        .filter(Subject.code == assignment_data.subject_code)
        .first()
    )

    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subject not found",
        )

    section = (
        db.query(AcademicSection)
        .filter(AcademicSection.id == assignment_data.section_id)
        .first()
    )

    if not section:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Academic section not found",
        )

    existing = (
        db.query(TeacherAssignment)
        .filter(
            TeacherAssignment.teacher_id
            == assignment_data.teacher_id,
            TeacherAssignment.subject_code
            == assignment_data.subject_code,
            TeacherAssignment.section_id
            == assignment_data.section_id,
        )
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This teacher assignment already exists",
        )

    assignment = TeacherAssignment(
        teacher_id=assignment_data.teacher_id,
        subject_code=assignment_data.subject_code,
        section_id=assignment_data.section_id,
    )

    db.add(assignment)
    db.commit()
    db.refresh(assignment)

    return assignment

@router.get(
    "",
    response_model=list[TeacherAssignmentResponse],
)
def get_assignments(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return db.query(TeacherAssignment).all()

@router.get(
    "/{assignment_id}",
    response_model=TeacherAssignmentResponse,
)
def get_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    assignment = (
        db.query(TeacherAssignment)
        .filter(TeacherAssignment.id == assignment_id)
        .first()
    )

    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found",
        )

    return assignment

@router.delete(
    "/{assignment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    assignment = (
        db.query(TeacherAssignment)
        .filter(TeacherAssignment.id == assignment_id)
        .first()
    )

    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found",
        )

    db.delete(assignment)
    db.commit()