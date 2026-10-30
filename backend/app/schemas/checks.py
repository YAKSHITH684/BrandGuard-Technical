from typing import Optional, List, Dict, Any
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

class MultimodalCheckRequest(BaseModel):
    name: Optional[str] = "visual_asset.png"
    agency: Optional[str] = "Internal Creative Studio"
    url: Optional[str] = None
    alt_text: Optional[str] = None
    colors: Optional[List[str]] = None
    logo_identifier: Optional[str] = None
    aspect_ratio_skew: Optional[float] = 0.0
    contrast_ratio: Optional[float] = None
    has_face: Optional[bool] = False
    has_license_plate: Optional[bool] = False
    ocr_text: Optional[str] = None

class MultimodalCheckResponse(BaseModel):
    image_name: str
    agency: Optional[str] = None
    redacted_url: Optional[str] = None
    redaction_applied: bool
    blurred_elements: List[Dict[str, Any]] = []
    audit_meta: Dict[str, Any] = {}
    ocr_text: str = ""
    extracted_claims: List[str] = []
    claim_verdicts: List[Dict[str, Any]] = []
    visual_findings: List[Dict[str, Any]] = []
    visual_compliance_score: float = 100.0
    summary: Dict[str, Any] = {}

class PredictiveScoreRequest(BaseModel):
    text: str
    target_ease: Optional[float] = 60.0
    color_pairs: Optional[List[Dict[str, Any]]] = None
    images: Optional[List[Dict[str, Any]]] = None

class DimensionScore(BaseModel):
    category: str
    label: str
    score: float
    status: str
    weight: float
    findings_count: int
    summary: str

class PredictiveScoreResponse(BaseModel):
    overall_score: float
    grade: str
    risk_level: str
    approval_probability: float
    estimated_turnaround_minutes: float
    gate_forecast: str
    required_reviewers: List[str]
    dimensions: List[DimensionScore]
    top_positives: List[str]
    top_risks: List[str]
    actionable_recommendations: List[str]
    readability_metrics: Dict[str, Any]
    detected_violations_count: int


