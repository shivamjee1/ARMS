from pydantic import BaseModel, ConfigDict, Field


class AssessmentCreate(BaseModel):
    name: str
    max_marks: int = Field(gt=0)


class AssessmentUpdate(BaseModel):
    name: str | None = None
    max_marks: int | None = Field(default=None, gt=0)


class AssessmentResponse(BaseModel):
    id: int
    name: str
    max_marks: int

    model_config = ConfigDict(from_attributes=True)