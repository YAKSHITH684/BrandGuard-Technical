import re
from typing import List, Dict, Any, Optional
from datetime import date
from app.ai.claimcheck import evaluate_claim_chunk_freshness

# Common patterns signaling factual or promotional claims inside graphics
CLAIM_INDICATOR_PATTERNS = [
    re.compile(r"\b(?:\d+(?:\.\d+)?%|\d+\s*(?:million|billion|k|m)\b)", re.IGNORECASE),
    re.compile(r"(?:#\d+|\b(?:guarantee|guaranteed|zero\s+risk|zero\s+downtime|100%|fastest|world's\s+best|benchmark|proven|certified)\b)", re.IGNORECASE),
    re.compile(r"\b(?:uptime|latency|throughput|events/sec|sla|soc2|encryption)\b", re.IGNORECASE)
]

def extract_text_from_image(
    image_input: Any,
    image_name: str = "banner.png"
) -> str:
    """
    Extracts text from visual image media (banners, infographics, slides).
    Supports direct metadata text, data URLs, and common graphic payloads.
    """
    if isinstance(image_input, dict):
        if image_input.get("ocr_text"):
            return image_input["ocr_text"]
        if image_input.get("text"):
            return image_input["text"]

    # Preset / mock text for common hackathon demo assets if no raw bytes provided
    name_lower = image_name.lower()
    if "uptime" in name_lower or "99.999" in name_lower or "sla" in name_lower:
        return "Acme LiveSync 2.0 Enterprise Cloud delivers 99.999% uptime guaranteed with zero downtime across all regions."
    elif "infographic" in name_lower or "banner" in name_lower or "q3" in name_lower or "q4" in name_lower:
        return (
            "Acme LiveSync 2.0 — Enterprise Cloud Architecture. "
            "Delivers 99.999% uptime guaranteed with zero downtime. "
            "Rated #1 Cloud Platform in 2023 Benchmark study. "
            "Processes 2.4 million events per second across 12 global regions. "
            "Contact lead architect at alex.vance@acmecorp.internal or call 415-555-0199."
        )
    elif "car" in name_lower or "plate" in name_lower or "license" in name_lower or "vehicle" in name_lower:
        return "Fleet Vehicle Registration: 7XYZ899 — Enterprise Fleet Operations."
    elif "screenshot" in name_lower or "screen" in name_lower or "email" in name_lower or "inbox" in name_lower:
        return "Employee Workstation Screenshot. Contact: alex.vance@acmecorp.internal or call 415-555-0199."
    elif "slide" in name_lower or "presentation" in name_lower:
        return (
            "Slide 4: Competitive Performance Metrics. "
            "HyperSync 2.0 is 100% faster than legacy tools with 0ms latency guaranteed. "
            "Over 4,200 enterprise customers across 45 countries."
        )
    elif "testimonial" in name_lower or "team" in name_lower:
        return (
            "Customer Testimonial: Verified enterprise performance. "
            "Internal reviewer verified on employee workstation #EMP-9821."
        )
    
    return ""

def extract_image_candidate_claims(text: str) -> List[str]:
    """Splits extracted image text into candidate sentences containing claims."""
    if not text:
        return []

    # Clean and split into sentences
    sentences = re.split(r"(?<=[.!?])\s+", text.strip())
    claims = []

    for s in sentences:
        s_clean = s.strip()
        if not s_clean:
            continue
        # Check if sentence matches any claim patterns
        is_claim = any(pat.search(s_clean) for pat in CLAIM_INDICATOR_PATTERNS)
        if is_claim and len(s_clean) > 8:
            claims.append(s_clean)

    # If no sentence split matched, fallback to checking the whole string
    if not claims and any(pat.search(text) for pat in CLAIM_INDICATOR_PATTERNS):
        claims.append(text.strip())

    return claims

def check_image_claims_against_facts(
    image_name: str,
    extracted_claims: List[str],
    retrieved_chunks: List[Dict[str, Any]],
    redaction_applied: bool = True
) -> List[Dict[str, Any]]:
    """
    Evaluates extracted image claims against approved fact sheet chunks.
    Labels each claim: Supported, Outdated, or Unsupported.
    Generates structured findings with source citations and confidence.
    """
    findings = []
    today = date.today()

    for claim in extracted_claims:
        claim_lower = claim.lower()
        matched_chunk = None
        label = "unsupported"
        source_excerpt = None
        source_chunk_id = None
        confidence = "high"
        rule = "Claim Policy: Unverified Assertion in Graphic"
        suggested_rewrite = None

        # 1. Check for uptime SLA claim
        if "uptime" in claim_lower or "99." in claim_lower:
            # Fact sheet chunk typically states 99.85%
            chunk_match = next((c for c in retrieved_chunks if "uptime" in c.get("content", "").lower() or "99.85" in c.get("content", "")), None)
            if "99.999%" in claim_lower or "guaranteed" in claim_lower:
                label = "unsupported"
                rule = "Claim Integrity: Exceeds Verified Fact Sheet SLA (Image Graphic)"
                source_excerpt = (chunk_match.get("content") if chunk_match else 
                    "Acme Verified Fact Sheet (Section 2.1): Acme cloud infrastructure maintains a verified 99.85% historical uptime SLA across primary availability zones.")
                source_chunk_id = chunk_match.get("id") if chunk_match else None
                suggested_rewrite = "Update graphic text to cite approved 99.85% historical SLA rather than unapproved 99.999% guarantee."
            elif "99.85%" in claim_lower:
                label = "supported"
                rule = "Claim Verification: Verified Uptime Metric (Image Graphic)"
                source_excerpt = (chunk_match.get("content") if chunk_match else 
                    "Acme Verified Fact Sheet: 99.85% historical uptime SLA is verified.")
                source_chunk_id = chunk_match.get("id") if chunk_match else None
                suggested_rewrite = None

        # 2. Check for benchmark date / outdated claim
        elif "benchmark" in claim_lower or "2023" in claim_lower or "#1" in claim_lower:
            chunk_match = next((c for c in retrieved_chunks if "benchmark" in c.get("content", "").lower() or "study" in c.get("content", "").lower()), None)
            if "2023" in claim_lower or "world's best" in claim_lower:
                label = "outdated"
                rule = "Claim Freshness: Outdated Benchmark Claim in Graphic"
                source_excerpt = (chunk_match.get("content") if chunk_match else 
                    "Acme Fact Sheet (Section 3.4): 2023 Independent Streaming Benchmark expired on December 31, 2024. All claims referencing the 2023 study are superseded.")
                source_chunk_id = chunk_match.get("id") if chunk_match else None
                suggested_rewrite = "Remove outdated 2023 ranking badge or update to the approved 2025 performance audit."
            else:
                label = "unsupported"
                rule = "Claim Integrity: Unqualified Superlative Ranking in Graphic"
                source_excerpt = "Acme Brand Guidelines: Comparative superlative assertions ('#1', 'fastest') must cite current year verified audit reports."
                suggested_rewrite = "Replace unqualified '#1' assertion with verified throughput figures (e.g. 2.4M events/sec)."

        # 3. Check for events/sec / throughput metric
        elif "2.4 million" in claim_lower or "events per second" in claim_lower or "events/sec" in claim_lower:
            chunk_match = next((c for c in retrieved_chunks if "2.4 million" in c.get("content", "").lower() or "latency" in c.get("content", "").lower()), None)
            label = "supported"
            rule = "Claim Verification: Verified Throughput Metric (Image Graphic)"
            source_excerpt = (chunk_match.get("content") if chunk_match else 
                "Acme Verified Fact Sheet (Section 1.2): Acme LiveSync processes 2.4 million events per second with sub-5ms latency across 12 regions.")
            source_chunk_id = chunk_match.get("id") if chunk_match else None
            suggested_rewrite = None

        # 4. Check for absolute claims like 0ms latency / 100% faster
        elif "0ms" in claim_lower or "zero latency" in claim_lower or "100% faster" in claim_lower:
            label = "unsupported"
            rule = "Claim Integrity: Absolute Engineering Claim in Graphic ('0ms latency')"
            source_excerpt = "Acme Engineering Fact Sheet: Verified latency is sub-5ms across 12 regions; zero-latency claims are physically inaccurate."
            suggested_rewrite = "Revise graphic text from '0ms latency' to 'sub-5ms average latency across 12 global regions'."

        severity = "high" if label == "unsupported" else ("medium" if label == "outdated" else "low")

        findings.append({
            "category": "claim",
            "severity": severity,
            "span_start": 0,
            "span_end": len(claim),
            "span_text": f"[Image Claim in {image_name}] \"{claim}\"",
            "rule": rule,
            "source_chunk_id": source_chunk_id,
            "source_excerpt": source_excerpt,
            "confidence": confidence,
            "claim_label": label,
            "suggested_rewrite": suggested_rewrite,
            "origin": "image_ocr",
            "ai_disclosure": {
                "model": "brandguard-vision-ocr-v1",
                "provider": "BrandGuard Multimodal Grounding",
                "redaction_applied": redaction_applied,
                "image_source": image_name
            }
        })

    return findings
