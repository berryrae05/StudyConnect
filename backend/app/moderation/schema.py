
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field

class ReportCreate(BaseModel):

    against_user_id: int | None = None
    against_name: str | None = Field(default=None, max_length=255)
    reason: str | None = Field(..., min_length=10, max_length=1000)

class ReviewRequest(BaseModel):
    status: str
    admin_notes: str | None = Field(default=None, max_length=1000)

class ReportResponse(BaseModel):
    id: int
    reportedBy: str
    against: str
    reason: str
    date: datetime
    status: str
    admin_notes: str | None