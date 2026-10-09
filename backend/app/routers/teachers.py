from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.database import get_db
from app.models.teacher import Teacher
from app.models.user import User
from app.schemas.teacher import TeacherCreate, TeacherResponse

from sqlalchemy import select

from app.models.teacher_assignment import TeacherAssignment
from app.models.subject import Subject
from app.models.academic_section import AcademicSection

from app.models.student import Student





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


# Create Teacher
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


# Get All Teachers
@router.get(
    "",
    response_model=list[TeacherResponse],
)
def get_teachers(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return db.query(Teacher).all()


# Delete Teacher
@router.delete(
    "/{teacher_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_teacher(
    teacher_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    teacher = (
        db.query(Teacher)
        .filter(Teacher.id == teacher_id)
        .first()
    )

    if not teacher:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Teacher not found",
        )

    db.delete(teacher)
    db.commit()

    return None

@router.get("/subjects")
def get_teacher_subjects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Only teachers can access this endpoint
    if current_user.role != "teacher":
        raise HTTPException(
            status_code=403,
            detail="Only teachers can view assigned subjects",
        )

    # Find the teacher record linked to the logged-in account
    teacher = db.scalar(
        select(Teacher).where(
            Teacher.user_email == current_user.email
        )
    )

    if not teacher:
        raise HTTPException(
            status_code=404,
            detail="Teacher profile not found",
        )

    # Find subjects and sections assigned to this teacher
    statement = (
        select(TeacherAssignment, Subject, AcademicSection)
        .join(
            Subject,
            TeacherAssignment.subject_code == Subject.code,
        )
        .join(
            AcademicSection,
            TeacherAssignment.section_id == AcademicSection.id,
        )
        .where(TeacherAssignment.teacher_id == teacher.id)
    )

    rows = db.execute(statement).all()

    return [
        {
            "subject_code": assignment.subject_code,
            "subject_name": subject.name,
            "section_id": assignment.section_id,
            "section_code": section.section_code,
            "semester": getattr(section, "semester", None),
            "batch": section.batch,
        }
        for assignment, subject, section in rows
    ]



@router.get("/sections/{section_id}/students")
def get_teacher_section_students(
    section_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Only teachers can access this endpoint
    if current_user.role != "teacher":
        raise HTTPException(
            status_code=403,
            detail="Only teachers can view section students",
        )

    # Find the teacher linked to the logged-in account
    teacher = db.scalar(
        select(Teacher).where(
            Teacher.user_email == current_user.email
        )
    )

    if not teacher:
        raise HTTPException(
            status_code=404,
            detail="Teacher profile not found",
        )

    # Verify the teacher is assigned to at least one subject
    # in the requested section
    assignment = db.scalar(
        select(TeacherAssignment).where(
            TeacherAssignment.teacher_id == teacher.id,
            TeacherAssignment.section_id == section_id,
        )
    )

    if not assignment:
        raise HTTPException(
            status_code=403,
            detail="You are not assigned to this section",
        )

    # Fetch students in the assigned section
    students = db.scalars(
        select(Student)
        .where(Student.section_id == section_id)
        .order_by(Student.id)
    ).all()

    return [
        {
            "student_id": student.id,
            "name": student.name,
            "user_email": student.user_email,
            "section_id": student.section_id,
        }
        for student in students
    ]