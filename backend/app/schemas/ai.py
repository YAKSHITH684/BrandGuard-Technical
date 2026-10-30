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

class FixItem(BaseModel):
    rule: str
    before: str
    after: str
    explanation: str

class AutoRewriteRequest(BaseModel):
    text: str
    preset: Optional[str] = "balanced"  # balanced | punchy | executive | accessible | concise
    custom_instruction: Optional[str] = None
    target_finding_id: Optional[str] = None
    target_ease: Optional[float] = 60.0

class AutoRewriteResponse(BaseModel):
    original_text: str
    rewritten_text: str
    preset: str
    model_used: str
    ai_status: str  # groq | offline_fallback
    original_score: float
    projected_score: float
    score_boost: float
    original_grade: str
    projected_grade: str
    fixes_applied: List[FixItem] = []
    diff_summary: Dict[str, Any] = {}
    predictive_breakdown: Optional[Dict[str, Any]] = None

