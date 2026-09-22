from pydantic import BaseModel, Field


class TeacherCreate(BaseModel):
    id: str
    user_email: str
    name: str = Field(min_length=1, max_length=100)


class TeacherResponse(BaseModel):
    id: str
    user_email: str
    name: str

    model_config = {
        "from_attributes": True
    }