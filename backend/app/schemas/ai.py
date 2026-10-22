from typing import List, Optional, Dict, Any
from pydantic import BaseModel

class ChatMessage(BaseModel):
    role: str  # user | assistant | system
    content: str

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatMessage]] = []

class CitedSource(BaseModel):
    id: str
    section: Optional[str] = "General"
    content: str
    relevance_score: float

class ChatResponse(BaseModel):
    reply: str
    cited_sources: List[CitedSource] = []
    model_used: str = "llama-3.3-70b-versatile"
    ai_status: str = "available"  # available | offline_fallback
