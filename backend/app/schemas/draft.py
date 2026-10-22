from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel
from app.schemas.finding import FindingOut
from app.schemas.comment import CommentOut
from app.schemas.approval import ApprovalOut

class ColorPair(BaseModel):
    foreground: str  # hex e.g. #000000
    background: str  # hex e.g. #ffffff
    label: Optional[str] = "Primary Text"
    font_size: Optional[str] = "normal"  # normal | large

class DraftCreate(BaseModel):
    title: str
    content: str
    color_pairs: Optional[List[ColorPair]] = None
    alt_texts: Optional[List[Dict[str, str]]] = None  # [{"image_name": "hero.png", "alt_text": "..."}]

class DraftVersionOut(BaseModel):
    id: str
    draft_id: str
    version_no: int
    content: str
    redacted_content: Optional[str] = None
    created_at: datetime
    findings: Optional[List[FindingOut]] = []

    class Config:
        from_attributes = True

class DraftOut(BaseModel):
    id: str
    workspace_id: str
    author_id: str
    author_name: Optional[str] = None
    title: str
    status: str
    current_version: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class DraftDetailOut(DraftOut):
    current_version_data: Optional[DraftVersionOut] = None
    versions: Optional[List[DraftVersionOut]] = []
    comments: Optional[List[CommentOut]] = []
    approvals: Optional[List[ApprovalOut]] = []
    readability_score: Optional[float] = None
    ai_status: Optional[str] = "available"  # available | unavailable

class VersionDiffOut(BaseModel):
    from_version: int
    to_version: int
    from_content: str
    to_content: str
    diff_lines: List[Dict[str, Any]]
