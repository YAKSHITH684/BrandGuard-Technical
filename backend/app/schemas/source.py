from typing import Optional, List
from datetime import datetime, date
from pydantic import BaseModel

class GlossaryTermCreate(BaseModel):
    term: str
    type: str  # banned | preferred | required
    replacement: Optional[str] = None
    note: Optional[str] = None

class GlossaryTermOut(BaseModel):
    id: str
    workspace_id: str
    term: str
    type: str
    replacement: Optional[str] = None
    note: Optional[str] = None

    class Config:
        from_attributes = True

class SourceChunkOut(BaseModel):
    id: str
    document_id: str
    workspace_id: str
    content: str
    section: Optional[str] = None
    page: Optional[int] = None
    effective_date: Optional[date] = None
    expires_on: Optional[date] = None

    class Config:
        from_attributes = True

class SourceDocumentOut(BaseModel):
    id: str
    workspace_id: str
    title: str
    source_type: str  # guideline | fact_sheet | glossary
    status: str
    chunk_count: int
    uploaded_by: Optional[str] = None
    uploaded_at: datetime
    chunks: Optional[List[SourceChunkOut]] = None

    class Config:
        from_attributes = True

class IngestSourcePasteRequest(BaseModel):
    title: str
    source_type: str  # guideline | fact_sheet | glossary
    content: str
    effective_date: Optional[date] = None
    expires_on: Optional[date] = None
