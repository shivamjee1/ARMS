
from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.database import get_db
from app.models.attendance import Attendance
from app.models.student import Student
from app.models.subject import Subject
from app.models.teacher import Teacher
from app.models.teacher_assignment import TeacherAssignment
from app.models.user import User
from app.schemas.attendance import (
    AttendanceCreate,
    AttendanceUpdate,
    AttendanceResponse,
)


router = APIRouter(prefix="/attendance", tags=["Attendance"])


# ---------------------------------------------------------
# REQUEST SCHEMAS FOR BULK ATTENDANCE
# ---------------------------------------------------------

class AttendanceRecordInput(BaseModel):
    student_id: str
    status: str


class BulkAttendanceInput(BaseModel):
    section_id: int
    subject_code: str
    date: date
    records: list[AttendanceRecordInput]


# ---------------------------------------------------------
# HELPER FUNCTIONS
# ---------------------------------------------------------

def get_teacher_for_user(db: Session, current_user: User):
    teacher = (
        db.query(Teacher)
        .filter(Teacher.user_email == current_user.email)
        .first()
    )

    if not teacher:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Teacher profile not found",
        )

    return teacher


def check_teacher_assignment(
    db: Session,
    current_user: User,
    section_id: int,
    subject_code: str,
):
    """Admins can access all sections; teachers need an assignment."""

    if current_user.role == "admin":
        return

    if current_user.role != "teacher":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to manage attendance",
        )

    teacher = get_teacher_for_user(db, current_user)

    assignment = (
        db.query(TeacherAssignment)
        .filter(
            TeacherAssignment.teacher_id == teacher.id,
            TeacherAssignment.section_id == section_id,
            TeacherAssignment.subject_code == subject_code,
        )
        .first()
    )

    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not assigned to this subject and section",
        )


def get_student_name(student: Student) -> str:
    """Support common student-name field names."""

    for field in ("name", "full_name", "student_name"):
        value = getattr(student, field, None)
        if value:
            return str(value)

    return str(student.id)


def validate_subject(db: Session, subject_code: str):
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


def get_section_students(db: Session, section_id: int):
    return (
        db.query(Student)
        .filter(Student.section_id == section_id)
        .all()
    )


# ---------------------------------------------------------
# NEW ROUTE 1: ATTENDANCE REGISTER / HISTORY
# GET /attendance/register
# ---------------------------------------------------------

@router.get("/register")
def get_attendance_register(
    section_id: int,
    subject_code: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    check_teacher_assignment(
        db, current_user, section_id, subject_code
    )
    validate_subject(db, subject_code)

    students = get_section_students(db, section_id)

    attendance_rows = (
        db.query(Attendance)
        .join(Student, Attendance.student_id == Student.id)
        .filter(
            Student.section_id == section_id,
            Attendance.subject_code == subject_code,
        )
        .order_by(Attendance.date.asc())
        .all()
    )

    dates = sorted(
        {row.date.isoformat() for row in attendance_rows}
    )

    attendance_by_student = {}

    for row in attendance_rows:
        student_key = str(row.student_id)

        attendance_by_student.setdefault(student_key, []).append(
            {
                "date": row.date.isoformat(),
                "status": row.status,
            }
        )

    result_students = []

    for student in students:
        student_id = str(student.id)
        history = attendance_by_student.get(student_id, [])

        present_count = sum(
            1
            for item in history
            if str(item["status"]).strip().lower()
            in ("present", "p")
        )

        total_count = len(history)

        percentage = (
            round((present_count / total_count) * 100, 2)
            if total_count
            else 0
        )

        result_students.append(
            {
                "student_id": student_id,
                "student_name": get_student_name(student),
                "attendance": history,
                "attendance_percentage": percentage,
            }
        )

    return {
        "section_id": section_id,
        "subject_code": subject_code,
        "dates": dates,
        "students": result_students,
    }


# ---------------------------------------------------------
# NEW ROUTE 2: ATTENDANCE FOR A PARTICULAR DATE
# GET /attendance/date
# ---------------------------------------------------------

@router.get("/date")
def get_attendance_by_date(
    section_id: int,
    subject_code: str,
    date: date,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    check_teacher_assignment(
        db, current_user, section_id, subject_code
    )
    validate_subject(db, subject_code)

    students = get_section_students(db, section_id)

    attendance_rows = (
        db.query(Attendance)
        .join(Student, Attendance.student_id == Student.id)
        .filter(
            Student.section_id == section_id,
            Attendance.subject_code == subject_code,
            Attendance.date == date,
        )
        .all()
    )

    attendance_by_student = {
        str(row.student_id): row.status
        for row in attendance_rows
    }

    return [
        {
            "student_id": str(student.id),
            "student_name": get_student_name(student),
            "status": attendance_by_student.get(str(student.id)),
        }
        for student in students
    ]


# ---------------------------------------------------------
# NEW ROUTE 3: SAVE ATTENDANCE FOR A PARTICULAR DATE
# PUT /attendance/date
# ---------------------------------------------------------

@router.put("/date")
def save_attendance_by_date(
    attendance_data: BulkAttendanceInput,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    section_id = attendance_data.section_id
    subject_code = attendance_data.subject_code
    attendance_date = attendance_data.date

    check_teacher_assignment(
        db, current_user, section_id, subject_code
    )
    validate_subject(db, subject_code)

    students = get_section_students(db, section_id)
    students_by_id = {str(student.id): student for student in students}

    submitted_ids = [
        str(record.student_id)
        for record in attendance_data.records
    ]

    if len(submitted_ids) != len(set(submitted_ids)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Duplicate student IDs in attendance records",
        )

    valid_statuses = {"present", "absent", "late", "p", "a", "l"}

    # Validate all submitted records before writing any changes.
    for record in attendance_data.records:
        student_id = str(record.student_id)
        normalized_status = record.status.strip().lower()

        if student_id not in students_by_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Student {student_id} does not belong "
                    f"to section {section_id}"
                ),
            )

        if normalized_status not in valid_statuses:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Invalid attendance status for student "
                    f"{student_id}. Use Present, Absent, or Late."
                ),
            )

    try:
        saved_records = []

        for record in attendance_data.records:
            student_id = str(record.student_id)
            normalized_status = record.status.strip().lower()

            existing = (
                db.query(Attendance)
                .filter(
                    Attendance.student_id
                    == students_by_id[student_id].id,
                    Attendance.subject_code == subject_code,
                    Attendance.date == attendance_date,
                )
                .first()
            )

            if normalized_status in ("present", "p"):
                saved_status = "Present"
            elif normalized_status in ("absent", "a"):
                saved_status = "Absent"
            else:
                saved_status = "Late"

            if existing:
                existing.status = saved_status
                attendance = existing
            else:
                attendance = Attendance(
                    student_id=students_by_id[student_id].id,
                    subject_code=subject_code,
                    date=attendance_date,
                    status=saved_status,
                )
                db.add(attendance)

            saved_records.append(
                {
                    "student_id": student_id,
                    "status": saved_status,
                }
            )

        db.commit()

        return {
            "message": "Attendance saved successfully",
            "section_id": section_id,
            "subject_code": subject_code,
            "date": attendance_date.isoformat(),
            "records_saved": len(saved_records),
            "records": saved_records,
        }

    except Exception:
        db.rollback()
        raise


# ---------------------------------------------------------
# EXISTING ROUTE: CREATE ONE ATTENDANCE RECORD
# POST /attendance
# ---------------------------------------------------------

@router.post(
    "",
    response_model=AttendanceResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_attendance(
    attendance_data: AttendanceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    student = (
        db.query(Student)
        .filter(Student.id == attendance_data.student_id)
        .first()
    )

    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found",
        )

    check_teacher_assignment(
        db,
        current_user,
        student.section_id,
        attendance_data.subject_code,
    )
    validate_subject(db, attendance_data.subject_code)

    existing = (
        db.query(Attendance)
        .filter(
            Attendance.student_id == attendance_data.student_id,
            Attendance.subject_code == attendance_data.subject_code,
            Attendance.date == attendance_data.date,
        )
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Attendance already exists for this student, subject and date",
        )

    attendance = Attendance(
        student_id=attendance_data.student_id,
        subject_code=attendance_data.subject_code,
        date=attendance_data.date,
        status=attendance_data.status,
    )

    db.add(attendance)
    db.commit()
    db.refresh(attendance)

    return attendance


# ---------------------------------------------------------
# EXISTING ROUTE: GET ALL ATTENDANCE
# GET /attendance
# ---------------------------------------------------------

@router.get(
    "",
    response_model=list[AttendanceResponse],
)
def get_attendance(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin can view all attendance records",
        )

    return db.query(Attendance).all()



# ---------------------------------------------------------
# STUDENT ROUTE: VIEW OWN ATTENDANCE, GROUPED BY SUBJECT
# GET /attendance/student
# ---------------------------------------------------------

@router.get("/student")
def get_student_attendance(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if str(current_user.role).lower() != "student":
        raise HTTPException(
            status_code=403,
            detail="Only students can view their own attendance",
        )

    student = (
        db.query(Student)
        .filter(Student.user_email == current_user.email)
        .first()
    )

    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student profile not found for this account",
        )

    attendance_rows = (
        db.query(Attendance)
        .filter(Attendance.student_id == student.id)
        .order_by(
            Attendance.subject_code.asc(),
            Attendance.date.asc(),
        )
        .all()
    )

    subjects_by_code = {}

    for row in attendance_rows:
        code = row.subject_code

        if code not in subjects_by_code:
            subject = (
                db.query(Subject)
                .filter(Subject.code == code)
                .first()
            )

            subject_name = code
            if subject:
                for field in ("name", "subject_name", "title"):
                    value = getattr(subject, field, None)
                    if value:
                        subject_name = str(value)
                        break

            subjects_by_code[code] = {
                "subject_code": code,
                "subject_name": subject_name,
                "records": [],
            }

        subjects_by_code[code]["records"].append({
            "date": row.date.isoformat(),
            "status": row.status,
        })

    subjects = []

    for group in subjects_by_code.values():
        records = group["records"]

        present = sum(
            1 for record in records
            if str(record["status"]).strip().lower()
            in ("present", "p")
        )
        absent = sum(
            1 for record in records
            if str(record["status"]).strip().lower()
            in ("absent", "a")
        )
        late = sum(
            1 for record in records
            if str(record["status"]).strip().lower()
            in ("late", "l")
        )

        total = len(records)

        subjects.append({
            **group,
            "present_count": present,
            "absent_count": absent,
            "late_count": late,
            "total_classes": total,
            "attendance_percentage": (
                round(present / total * 100, 2) if total else 0
            ),
        })

    return {
        "student_id": str(student.id),
        "student_name": get_student_name(student),
        "subjects": subjects,
    }



# ---------------------------------------------------------
# EXISTING ROUTE: GET ONE ATTENDANCE RECORD
# GET /attendance/{attendance_id}
# Keep dynamic routes after the static routes above.
# ---------------------------------------------------------


@router.get(
    "/{attendance_id}",
    response_model=AttendanceResponse,
)
def get_attendance_by_id(
    attendance_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    attendance = (
        db.query(Attendance)
        .filter(Attendance.id == attendance_id)
        .first()
    )

    if not attendance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attendance record not found",
        )

    if current_user.role != "admin":
        if current_user.role != "teacher":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to view this record",
            )

        student = (
            db.query(Student)
            .filter(Student.id == attendance.student_id)
            .first()
        )

        if not student:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Student not found",
            )

        check_teacher_assignment(
            db,
            current_user,
            student.section_id,
            attendance.subject_code,
        )

    return attendance


# ---------------------------------------------------------
# EXISTING ROUTE: UPDATE ONE ATTENDANCE RECORD
# PUT /attendance/{attendance_id}
# ---------------------------------------------------------

@router.put(
    "/{attendance_id}",
    response_model=AttendanceResponse,
)
def update_attendance(
    attendance_id: int,
    attendance_data: AttendanceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    attendance = (
        db.query(Attendance)
        .filter(Attendance.id == attendance_id)
        .first()
    )

    if not attendance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attendance record not found",
        )

    student = (
        db.query(Student)
        .filter(Student.id == attendance.student_id)
        .first()
    )

    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found",
        )

    check_teacher_assignment(
        db,
        current_user,
        student.section_id,
        attendance.subject_code,
    )

    attendance.status = attendance_data.status

    db.commit()
    db.refresh(attendance)

    return attendance


# ---------------------------------------------------------
# EXISTING ROUTE: DELETE ONE ATTENDANCE RECORD
# DELETE /attendance/{attendance_id}
# ---------------------------------------------------------

@router.delete(
    "/{attendance_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_attendance(
    attendance_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin can delete attendance",
        )

    attendance = (
        db.query(Attendance)
        .filter(Attendance.id == attendance_id)
        .first()
    )

    if not attendance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attendance record not found",
        )

    db.delete(attendance)
    db.commit()


