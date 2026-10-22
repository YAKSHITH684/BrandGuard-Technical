from typing import Optional, List
from pydantic import BaseModel

class ContrastCheckRequest(BaseModel):
    foreground: str
    background: str
    font_size: Optional[str] = "normal"  # normal | large

class ContrastCheckResponse(BaseModel):
    foreground: str
    background: str
    contrast_ratio: float
    passes_aa: bool
    passes_aaa: bool
    recommended_ratio: float
    message: str

class ReadabilityCheckRequest(BaseModel):
    text: str
    target_ease: Optional[float] = 60.0

class ReadabilityCheckResponse(BaseModel):
    flesch_reading_ease: float
    flesch_kincaid_grade: float
    word_count: int
    sentence_count: int
    syllable_count: int
    reading_level: str
    target_ease: float
    passes_target: bool
