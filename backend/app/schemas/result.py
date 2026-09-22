from pydantic import BaseModel, ConfigDict, Field


class ResultCreate(BaseModel):
    student_id: int
    subject_code: str
    assessment_name: str
    marks: int = Field(ge=0)


class ResultUpdate(BaseModel):
    marks: int = Field(ge=0)


class ResultResponse(BaseModel):
    id: int
    student_id: int
    subject_code: str
    assessment_name: str
    marks: int

    model_config = ConfigDict(from_attributes=True)