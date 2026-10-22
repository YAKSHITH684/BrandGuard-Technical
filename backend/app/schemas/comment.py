from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class CommentCreate(BaseModel):
    body: str
    finding_id: Optional[str] = None

class CommentOut(BaseModel):
    id: str
    draft_id: str
    finding_id: Optional[str] = None
    author_id: str
    author_name: Optional[str] = None
    author_role: Optional[str] = None
    body: str
    created_at: datetime

    class Config:
        from_attributes = True
