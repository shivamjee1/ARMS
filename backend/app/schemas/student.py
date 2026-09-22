from pydantic import BaseModel, Field


class StudentCreate(BaseModel):
    id: int = Field(
        ge=1000000,
        le=9999999,
    )

    user_email: str

    section_id: int

    name: str = Field(
        min_length=1,
        max_length=100,
    )



class StudentResponse(BaseModel):
    id: int
    user_email: str
    section_id: int
    name: str

    model_config = {
        "from_attributes": True
    }

