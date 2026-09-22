from datetime import date

from pydantic import BaseModel, ConfigDict, Field


class AttendanceCreate(BaseModel):
    student_id: int
    subject_code: str
    date: date
    status: str = Field(
        default="present",
        pattern="^(present|absent|leave)$",
    )


class AttendanceUpdate(BaseModel):
    status: str = Field(
        pattern="^(present|absent|leave)$",
    )


class AttendanceResponse(BaseModel):
    id: int
    student_id: int
    subject_code: str
    date: date
    status: str

    model_config = ConfigDict(from_attributes=True)