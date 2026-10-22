from fastapi import APIRouter, Depends
from app.schemas.checks import (
    ContrastCheckRequest,
    ContrastCheckResponse,
    ReadabilityCheckRequest,
    ReadabilityCheckResponse
)
from app.checks.contrast import evaluate_contrast_ratio
from app.checks.readability import calculate_readability

router = APIRouter(prefix="/checks", tags=["Standalone Deterministic Checks"])

@router.post("/contrast", response_model=ContrastCheckResponse)
def check_contrast(req: ContrastCheckRequest):
    result = evaluate_contrast_ratio(req.foreground, req.background, req.font_size or "normal")
    return ContrastCheckResponse(**result)

@router.post("/readability", response_model=ReadabilityCheckResponse)
def check_readability(req: ReadabilityCheckRequest):
    result = calculate_readability(req.text, req.target_ease or 60.0)
    return ReadabilityCheckResponse(**result)
