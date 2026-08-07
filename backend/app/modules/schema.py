from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field, field_validator

class ModuleCreate(BaseModel):

    model_config = ConfigDict(from_attributes=True)

    """POST /admin/modules - admin adds a new module"""
    code: str = Field(..., min_length=2, max_length=64)
    name: str = Field(..., min_length=2, max_length=255)

    @field_validator("code")
    @classmethod
    def normalise_code(cls, v: str) -> str:
        return v.strip().upper()
    
    @field_validator("name")
    @classmethod
    def strip_name(cls, v: str) -> str:
        return v.strip()
    
class ModuleUpdate(BaseModel):

    model_config = ConfigDict(from_attributes=True)
    
    """PATCH /admin/modules/{id} - admin edits name or active status"""
    name: str | None = Field(default=None, min_length=2, max_length=255)
    is_active: bool | None = None

    @field_validator("name", mode="before")
    @classmethod
    def strip_name(cls, v: str| None) -> str | None:
        return v.strip() if isinstance(v, str) else v
    
class ModuleResponse(BaseModel):

    model_config = ConfigDict(from_attributes=True)

    id: int
    code: str
    name: str
    groups: int = 0 # derived - count of groups using this module code
    is_active: bool
    created_at: datetime