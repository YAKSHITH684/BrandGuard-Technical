from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class ApprovalCreate(BaseModel):
    decision: Optional[str] = "approved"  # approved | changes_requested | rejected
    note: Optional[str] = None

class ApprovalOut(BaseModel):
    id: str
    draft_id: str
    version_id: str
    approver_id: str
    approver_name: Optional[str] = None
    approver_role: Optional[str] = None
    decision: str
    note: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ReviewQueueItem(BaseModel):
    draft_id: str
    title: str
    author_id: str
    author_name: str
    status: str
    current_version: int
    has_sensitive_claims: bool
    unsupported_claims_count: int
    high_severity_count: int
    findings_count: int
    created_at: datetime
    updated_at: datetime
