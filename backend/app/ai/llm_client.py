import json
import re
from typing import List, Dict, Any, Tuple
from pydantic import BaseModel, ValidationError
from app.config import settings
from app.ai.prompts import REVIEW_SYSTEM_PROMPT, build_review_user_prompt
from app.ai.claimcheck import evaluate_claim_chunk_freshness

try:
    from groq import Groq
    groq_available = True
except ImportError:
    groq_available = False

class RawFindingItem(BaseModel):
    category: str
    severity: str
    span_text: str
    rule: str
    source_chunk_id: Any = None
    source_excerpt: str
    confidence: str
    claim_label: Any = None
    suggested_rewrite: Any = None
    reasoning: Any = None

class RawFindingsResponse(BaseModel):
    findings: List[RawFindingItem] = []

def clean_json_response(raw_text: str) -> str:
    """Strips markdown code fences and whitespace from LLM output."""
    raw = raw_text.strip()
    if raw.startswith("```json"):
        raw = raw[7:]
    elif raw.startswith("```"):
        raw = raw[3:]
    if raw.endswith("```"):
        raw = raw[:-3]
    return raw.strip()

_cached_groq_model = None

def get_best_groq_model(client) -> str:
    global _cached_groq_model
    if _cached_groq_model:
        return _cached_groq_model

    preferred = [
        "llama-3.3-70b-versatile",
        "openai/gpt-oss-120b",
        "openai/gpt-oss-20b",
        "qwen/qwen3.8-27b",
        "llama-3.1-8b-instant"
    ]

    try:
        models = client.models.list()
        available_ids = {m.id for m in models.data}
        for m in preferred:
            if m in available_ids:
                _cached_groq_model = m
                return m

        for m in models.data:
            m_id = m.id.lower()
            if not any(k in m_id for k in ["whisper", "guard", "vision", "embed"]):
                _cached_groq_model = m.id
                return m.id
    except Exception as e:
        print(f"[GROQ MODEL DISCOVERY WARNING] {e}")

    _cached_groq_model = "openai/gpt-oss-120b"
    return _cached_groq_model

def run_llm_review(
    draft_text: str,
    retrieved_chunks: List[Dict[str, Any]],
    redaction_applied: bool = False
) -> Tuple[List[Dict[str, Any]], str]:
    """
    Executes retrieval-augmented LLM review using Groq.
    Returns (findings_list, ai_status: 'available' | 'unavailable')
    """
    if not settings.GROQ_API_KEY or not groq_available:
        return [], "unavailable"

    # Quick preflight check to avoid blocking on DNS timeout when offline or in sandbox
    try:
        import socket
        socket.gethostbyname("api.groq.com")
    except Exception:
        return [], "unavailable"

    client = Groq(api_key=settings.GROQ_API_KEY, timeout=3.0)
    user_prompt = build_review_user_prompt(draft_text, retrieved_chunks)
    model_name = get_best_groq_model(client)

    chunks_by_id = {c.get("id"): c for c in retrieved_chunks}

    # Attempt call with 1 retry for JSON robustness
    parsed_data = None
    last_error = None

    for attempt in range(2):
        try:
            chat_completion = client.chat.completions.create(
                messages=[
                    {"role": "system", "content": REVIEW_SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt}
                ],
                model=model_name,
                temperature=0.1,
                response_format={"type": "json_object"}
            )
            raw_content = chat_completion.choices[0].message.content
            cleaned_json = clean_json_response(raw_content)
            data_dict = json.loads(cleaned_json)
            validated = RawFindingsResponse(**data_dict)
            parsed_data = validated.findings
            break
        except Exception as e:
            last_error = e
            for fb in ["openai/gpt-oss-120b", "openai/gpt-oss-20b", "qwen/qwen3.8-27b"]:
                if fb != model_name:
                    model_name = fb
                    break

    if parsed_data is None:
        # If LLM failed or JSON invalid after retry, return empty or cannot_verify
        return [], "unavailable"

    processed_findings = []
    for item in parsed_data:
        span_text = item.span_text.strip()
        span_start = 0
        span_end = len(span_text)

        # Locate span within draft_text
        if span_text and span_text in draft_text:
            span_start = draft_text.find(span_text)
            span_end = span_start + len(span_text)

        # Confidence verification
        conf = item.confidence.lower()
        if conf not in ["high", "medium", "low", "cannot_verify"]:
            conf = "medium"

        # Claim label freshness verification
        claim_lbl = str(item.claim_label).lower() if item.claim_label else None
        if claim_lbl not in ["supported", "outdated", "unsupported"]:
            claim_lbl = None

        chunk_id = item.source_chunk_id if item.source_chunk_id and item.source_chunk_id != "null" else None
        source_excerpt = item.source_excerpt or ("no approved source found" if not chunk_id else "")

        if chunk_id and chunk_id in chunks_by_id:
            chunk = chunks_by_id[chunk_id]
            freshness = evaluate_claim_chunk_freshness(chunk)
            if claim_lbl == "supported" and freshness == "outdated":
                claim_lbl = "outdated"

        processed_findings.append({
            "category": item.category.lower() if item.category else "fact",
            "severity": item.severity.lower() if item.severity else "medium",
            "span_start": span_start,
            "span_end": span_end,
            "span_text": span_text or draft_text[:50],
            "rule": item.rule or "Brand Guideline Assertion",
            "source_chunk_id": chunk_id,
            "source_excerpt": source_excerpt,
            "confidence": conf,
            "claim_label": claim_lbl,
            "suggested_rewrite": item.suggested_rewrite,
            "origin": "ai",
            "ai_disclosure": {
                "model": model_name,
                "provider": "Groq",
                "redaction_applied": redaction_applied
            }
        })

    return processed_findings, "available"
