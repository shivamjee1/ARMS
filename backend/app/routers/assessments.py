from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.assessment import Assessment
from app.models.user import User
from app.schemas.assessment import (
    AssessmentCreate,
    AssessmentUpdate,
    AssessmentResponse,
)
from app.core.dependencies import get_current_user


router = APIRouter(
    prefix="/assessments",
    tags=["Assessments"],
)


# --------------------------------------------------
# CREATE ASSESSMENT
# --------------------------------------------------
@router.post(
    "",
    response_model=AssessmentResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_assessment(
    assessment_data: AssessmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Only admin can create assessments",
        )

    existing = db.scalar(
        select(Assessment).where(
            Assessment.name == assessment_data.name
        )
    )

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Assessment already exists",
        )

    assessment = Assessment(
        name=assessment_data.name,
        max_marks=assessment_data.max_marks,
    )

    db.add(assessment)
    db.commit()
    db.refresh(assessment)

    return assessment


# --------------------------------------------------
# GET ALL ASSESSMENTS
# --------------------------------------------------
@router.get(
    "",
    response_model=list[AssessmentResponse],
)
def get_assessments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.scalars(
        select(Assessment).order_by(Assessment.id)
    ).all()


# --------------------------------------------------
# GET SINGLE ASSESSMENT
# --------------------------------------------------
@router.get(
    "/{assessment_id}",
    response_model=AssessmentResponse,
)
def get_assessment(
    assessment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    assessment = db.get(Assessment, assessment_id)

    if not assessment:
        raise HTTPException(
            status_code=404,
            detail="Assessment not found",
        )

    return assessment


# --------------------------------------------------
# UPDATE ASSESSMENT
# --------------------------------------------------
@router.put(
    "/{assessment_id}",
    response_model=AssessmentResponse,
)
def update_assessment(
    assessment_id: int,
    assessment_data: AssessmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Only admin can update assessments",
        )

    assessment = db.get(Assessment, assessment_id)

    if not assessment:
        raise HTTPException(
            status_code=404,
            detail="Assessment not found",
        )

    if assessment_data.name is not None:
        assessment.name = assessment_data.name

    if assessment_data.max_marks is not None:
        assessment.max_marks = assessment_data.max_marks

    db.commit()
    db.refresh(assessment)

    return assessment


# --------------------------------------------------
# DELETE ASSESSMENT
# --------------------------------------------------
@router.delete(
    "/{assessment_id}",
)
def delete_assessment(
    assessment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Only admin can delete assessments",
        )

    assessment = db.get(Assessment, assessment_id)

    if not assessment:
        raise HTTPException(
            status_code=404,
            detail="Assessment not found",
        )

    db.delete(assessment)
    db.commit()

    return {
        "message": "Assessment deleted successfully"
    }