from pydantic import BaseModel


class TeacherAssignmentCreate(BaseModel):
    teacher_id: str
    subject_code: str
    section_id: int


class TeacherAssignmentResponse(BaseModel):
    id: int
    teacher_id: str
    subject_code: str
    section_id: int

    model_config = {
        "from_attributes": True
    }