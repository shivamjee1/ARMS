from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.result import Result
from app.models.student import Student
from app.models.teacher import Teacher
from app.models.teacher_assignment import TeacherAssignment
from app.models.assessment import Assessment
from app.schemas.result import ResultCreate, ResultUpdate, ResultResponse
from app.models.user import User
from app.models.subject import Subject
from app.core.dependencies import get_current_user


router = APIRouter(
    prefix="/results",
    tags=["Results"],
)


# --------------------------------------------------
# CREATE RESULT
# --------------------------------------------------
@router.post(
    "",
    response_model=ResultResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_result(
    result_data: ResultCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Only admin and teacher can add results
    if current_user.role not in ["admin", "teacher"]:
        raise HTTPException(
            status_code=403,
            detail="Only admin or teacher can add results",
        )

    # Check student
    student = db.get(Student, result_data.student_id)

    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student not found",
        )

    # Check assessment
    assessment = (
        db.query(Assessment)
        .filter(Assessment.name == result_data.assessment_name)
        .first()
    )

    if not assessment:
        raise HTTPException(
            status_code=404,
            detail="Assessment not found",
        )

    # Check subject exists
    from app.models.subject import Subject

    subject = (
        db.query(Subject)
        .filter(Subject.code == result_data.subject_code)
        .first()
    )

    if not subject:
        raise HTTPException(
            status_code=404,
            detail="Subject not found",
        )

    # Marks cannot exceed assessment maximum
    if result_data.marks > assessment.max_marks:
        raise HTTPException(
            status_code=400,
            detail=f"Marks cannot exceed {assessment.max_marks}",
        )

    # --------------------------------------------------
    # TEACHER PERMISSION
    # --------------------------------------------------
    if current_user.role == "teacher":

        teacher = db.scalar(
            select(Teacher).where(
                Teacher.user_email == current_user.email
            )
        )

        if not teacher:
            raise HTTPException(
                status_code=403,
                detail="Teacher profile not found",
            )

        assignment = db.scalar(
            select(TeacherAssignment).where(
                TeacherAssignment.teacher_id == teacher.id,
                TeacherAssignment.subject_code == result_data.subject_code,
                TeacherAssignment.section_id == student.section_id,
            )
        )

        if not assignment:
            raise HTTPException(
                status_code=403,
                detail="You are not assigned to this subject and section",
            )

    # Check duplicate result
    existing_result = db.scalar(
        select(Result).where(
            Result.student_id == result_data.student_id,
            Result.subject_code == result_data.subject_code,
            Result.assessment_name == result_data.assessment_name,
        )
    )

    if existing_result:
        raise HTTPException(
            status_code=400,
            detail="Result already exists for this student, subject and assessment",
        )

    new_result = Result(
        student_id=result_data.student_id,
        subject_code=result_data.subject_code,
        assessment_name=result_data.assessment_name,
        marks=result_data.marks,
    )

    db.add(new_result)
    db.commit()
    db.refresh(new_result)

    return new_result


# --------------------------------------------------
# GET RESULTS
# --------------------------------------------------
@router.get(
    "",
    response_model=list[ResultResponse],
)
def get_results(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # ADMIN → see everything
    if current_user.role == "admin":
        return db.scalars(
            select(Result)
        ).all()

    # STUDENT → only own results
    if current_user.role == "student":

        student = db.scalar(
            select(Student).where(
                Student.user_email == current_user.email
            )
        )

        if not student:
            raise HTTPException(
                status_code=404,
                detail="Student profile not found",
            )

        return db.scalars(
            select(Result).where(
                Result.student_id == student.id
            )
        ).all()

    # TEACHER → only assigned subject/section results
    if current_user.role == "teacher":

        teacher = db.scalar(
            select(Teacher).where(
                Teacher.user_email == current_user.email
            )
        )

        if not teacher:
            raise HTTPException(
                status_code=403,
                detail="Teacher profile not found",
            )

        results = db.scalars(
            select(Result)
            .join(Student, Result.student_id == Student.id)
            .join(
                TeacherAssignment,
                (
                    (TeacherAssignment.subject_code == Result.subject_code)
                    & (TeacherAssignment.section_id == Student.section_id)
                    & (TeacherAssignment.teacher_id == teacher.id)
                ),
            )
        ).all()

        return results

    raise HTTPException(
        status_code=403,
        detail="Access denied",
    )


# --------------------------------------------------
# GET SINGLE RESULT
# --------------------------------------------------

@router.get(
    "/student/{student_id}/subject/{subject_code}",
    response_model=ResultResponse,
)
def get_result(
    student_id: int,
    subject_code: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Find result using student_id + subject_code
    result = db.scalar(
        select(Result).where(
            Result.student_id == student_id,
            Result.subject_code == subject_code,
        )
    )

    if not result:
        raise HTTPException(
            status_code=404,
            detail="Result not found",
        )

    # ADMIN → can view any result
    if current_user.role == "admin":
        return result

    student = db.get(Student, result.student_id)

    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student not found",
        )

    # STUDENT → own result only
    if current_user.role == "student":

        if student.user_email != current_user.email:
            raise HTTPException(
                status_code=403,
                detail="You can only view your own results",
            )

        return result

    # TEACHER → assigned subject + section only
    if current_user.role == "teacher":

        teacher = db.scalar(
            select(Teacher).where(
                Teacher.user_email == current_user.email
            )
        )

        if not teacher:
            raise HTTPException(
                status_code=403,
                detail="Teacher profile not found",
            )

        assignment = db.scalar(
            select(TeacherAssignment).where(
                TeacherAssignment.teacher_id == teacher.id,
                TeacherAssignment.subject_code == result.subject_code,
                TeacherAssignment.section_id == student.section_id,
            )
        )

        if not assignment:
            raise HTTPException(
                status_code=403,
                detail="You are not assigned to this result",
            )

        return result

    raise HTTPException(
        status_code=403,
        detail="Access denied",
    )
#-------------------------------------------------
# get ustudent result by student_id
#--------------------------------------------------

@router.get(
    "/student/{student_id}",
    response_model=list[ResultResponse],
)
def get_student_results(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    results = db.scalars(
        select(Result).where(
            Result.student_id == student_id
        )
    ).all()

    if not results:
        raise HTTPException(
            status_code=404,
            detail="No results found for this student",
        )

    # ADMIN → can view any student's results
    if current_user.role == "admin":
        return results

    student = db.get(Student, student_id)

    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student not found",
        )

    # STUDENT → own results only
    if current_user.role == "student":
        if student.user_email != current_user.email:
            raise HTTPException(
                status_code=403,
                detail="You can only view your own results",
            )

        return results

    # TEACHER → only results of students in assigned subjects
    if current_user.role == "teacher":
        teacher = db.scalar(
            select(Teacher).where(
                Teacher.user_email == current_user.email
            )
        )

        if not teacher:
            raise HTTPException(
                status_code=403,
                detail="Teacher profile not found",
            )

        allowed_results = []

        for result in results:
            assignment = db.scalar(
                select(TeacherAssignment).where(
                    TeacherAssignment.teacher_id == teacher.id,
                    TeacherAssignment.subject_code == result.subject_code,
                    TeacherAssignment.section_id == student.section_id,
                )
            )

            if assignment:
                allowed_results.append(result)

        if not allowed_results:
            raise HTTPException(
                status_code=403,
                detail="You are not assigned to any subject of this student",
            )

        return allowed_results

    raise HTTPException(
        status_code=403,
        detail="Access denied",
    )

# --------------------------------------------------
# UPDATE RESULT
# --------------------------------------------------

@router.get(
    "/subject/{subject_code}",
    response_model=list[ResultResponse],
)
def get_subject_results(
    subject_code: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    results = db.scalars(
        select(Result).where(
            Result.subject_code == subject_code
        )
    ).all()

    if not results:
        raise HTTPException(
            status_code=404,
            detail="No results found for this subject",
        )

    # ADMIN → can view all results
    if current_user.role == "admin":
        return results

    # TEACHER → only if assigned to this subject
    if current_user.role == "teacher":

        teacher = db.scalar(
            select(Teacher).where(
                Teacher.user_email == current_user.email
            )
        )

        if not teacher:
            raise HTTPException(
                status_code=403,
                detail="Teacher profile not found",
            )

        assignment = db.scalar(
            select(TeacherAssignment).where(
                TeacherAssignment.teacher_id == teacher.id,
                TeacherAssignment.subject_code == subject_code,
            )
        )

        if not assignment:
            raise HTTPException(
                status_code=403,
                detail="You are not assigned to this subject",
            )

        # Return only results from the assigned section
        allowed_results = []

        for result in results:
            student = db.get(Student, result.student_id)

            if student and student.section_id == assignment.section_id:
                allowed_results.append(result)

        return allowed_results

    # STUDENT → cannot view all students' results
    if current_user.role == "student":
        raise HTTPException(
            status_code=403,
            detail="Students cannot view all results of a subject",
        )

    raise HTTPException(
        status_code=403,
        detail="Access denied",
    )



# --------------------------------------------------
# UPDATE RESULT
# --------------------------------------------------
@router.put(
    "/{result_id}",
    response_model=ResultResponse,
)
def update_result(
    result_id: int,
    result_data: ResultUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = db.get(Result, result_id)

    if not result:
        raise HTTPException(
            status_code=404,
            detail="Result not found",
        )

    # Check assessment
    assessment = db.get(Assessment, result.assessment_name)

    if not assessment:
        raise HTTPException(
            status_code=404,
            detail="Assessment not found",
        )

    # Check maximum marks
    if result_data.marks > assessment.max_marks:
        raise HTTPException(
            status_code=400,
            detail=f"Marks cannot exceed {assessment.max_marks}",
        )

    # ADMIN → allowed
    if current_user.role == "admin":
        pass

    # TEACHER → assigned subject + section only
    elif current_user.role == "teacher":

        teacher = db.scalar(
            select(Teacher).where(
                Teacher.user_email == current_user.email
            )
        )

        if not teacher:
            raise HTTPException(
                status_code=403,
                detail="Teacher profile not found",
            )

        student = db.get(Student, result.student_id)

        if not student:
            raise HTTPException(
                status_code=404,
                detail="Student not found",
            )

        assignment = db.scalar(
            select(TeacherAssignment).where(
                TeacherAssignment.teacher_id == teacher.id,
                TeacherAssignment.subject_code == result.subject_code,
                TeacherAssignment.section_id == student.section_id,
            )
        )

        if not assignment:
            raise HTTPException(
                status_code=403,
                detail="You are not assigned to this subject and section",
            )

    else:
        raise HTTPException(
            status_code=403,
            detail="Only admin or teacher can update results",
        )

    result.marks = result_data.marks

    db.commit()
    db.refresh(result)

    return result


# --------------------------------------------------
# DELETE RESULT
# --------------------------------------------------
@router.delete(
    "/{result_id}",
)
def delete_result(
    result_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Only admin can delete
    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Only admin can delete results",
        )

    result = db.get(Result, result_id)

    if not result:
        raise HTTPException(
            status_code=404,
            detail="Result not found",
        )

    db.delete(result)
    db.commit()

    return {
        "message": "Result deleted successfully"
    }