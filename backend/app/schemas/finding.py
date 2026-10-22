from typing import Optional, Any, Dict, List
from datetime import datetime
from pydantic import BaseModel

class SpanModel(BaseModel):
    start: int
    end: int
    text: str

class AIDisclosure(BaseModel):
    model: str
    provider: str
    redaction_applied: bool = False
    raw_prompt_tokens: Optional[int] = None

class FindingActionCreate(BaseModel):
    action: str  # accept | edit | reject | dispute
    reason: Optional[str] = None
    edited_text: Optional[str] = None

class FindingActionOut(BaseModel):
    id: str
    finding_id: str
    actor_id: str
    action: str
    reason: Optional[str] = None
    edited_text: Optional[str] = None
    actor_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class FindingOut(BaseModel):
    id: str
    version_id: str
    category: str  # tone | terminology | fact | claim | accessibility | privacy
    severity: str  # low | medium | high
    span_start: int
    span_end: int
    span_text: str
    rule: str
    source_chunk_id: Optional[str] = None
    source_excerpt: Optional[str] = None
    confidence: str  # high | medium | low | cannot_verify
    claim_label: Optional[str] = None  # supported | outdated | unsupported | None
    suggested_rewrite: Optional[str] = None
    origin: str  # deterministic | ai
    ai_disclosure: Optional[Dict[str, Any]] = None
    created_at: datetime
    actions: Optional[List[FindingActionOut]] = []

    class Config:
        from_attributes = True
