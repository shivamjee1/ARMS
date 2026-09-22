from pydantic import BaseModel, Field


class SubjectCreate(BaseModel):
    code: str = Field(min_length=1, max_length=20)
    name: str = Field(min_length=1, max_length=100)
    credits: int = Field(default=3, ge=1, le=10)


class SubjectResponse(BaseModel):
    code: str
    name: str
    credits: int

    model_config = {
        "from_attributes": True
    }