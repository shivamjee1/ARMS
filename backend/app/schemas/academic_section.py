from pydantic import BaseModel, Field


class AcademicSectionCreate(BaseModel):
    id: int = Field(
        ge=1000,
        le=9999,
    )

    batch: int = Field(
        ge=0,
        le=99,
    )

    section_code: int = Field(
        ge=00,
        le=99,
    )


class AcademicSectionResponse(BaseModel):
    id: int
    batch: int
    section_code: int 

    model_config = {
        "from_attributes": True
    }
