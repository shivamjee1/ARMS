# app/schemas/user.py

from pydantic import BaseModel, EmailStr
from typing import Literal


class UserCreate(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    role: str
    is_active: bool

    model_config = {
        "from_attributes": True
    }

class Token(BaseModel):
    access_token: str
    token_type: str

class AdminUserCreate(BaseModel):
    email: EmailStr
    password: str
    role: Literal["student", "teacher", "admin"]