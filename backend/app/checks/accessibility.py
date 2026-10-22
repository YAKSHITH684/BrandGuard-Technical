import re
from typing import List, Dict, Any

VAGUE_LINK_PATTERNS = [
    (r"\b(click\s+here)\b", "WCAG 2.4.4: Non-descriptive Link Text ('click here')"),
    (r"\b(read\s+more)\b", "WCAG 2.4.4: Generic Link Text ('read more')"),
    (r"\b(link)\b", "WCAG 2.4.4: Ambiguous Link Text ('link')"),
    (r"\b(click\s+this\s+link)\b", "WCAG 2.4.4: Ambiguous Link Text ('click this link')"),
]

GENERIC_ALT_TEXTS = {"image", "photo", "pic", "picture", "img", "screenshot", "icon", "banner", ""}

def check_accessibility_content(content: str, alt_texts: List[Dict[str, str]] = None) -> List[Dict[str, Any]]:
    findings = []
    
    # 1. Check link text in content
    for pattern_str, rule_name in VAGUE_LINK_PATTERNS:
        pattern = re.compile(pattern_str, re.IGNORECASE)
        for match in pattern.finditer(content):
            span_start, span_end = match.span()
            matched_text = match.group(0)

            findings.append({
                "category": "accessibility",
                "severity": "medium",
                "span_start": span_start,
                "span_end": span_end,
                "span_text": matched_text,
                "rule": rule_name,
                "source_chunk_id": None,
                "source_excerpt": "WCAG 2.4.4 (Link Purpose in Context): The purpose of each link should be clear from the link text alone rather than generic prompts like 'click here'.",
                "confidence": "high",
                "claim_label": None,
                "suggested_rewrite": "Replace generic callout with action-oriented descriptive text (e.g. 'explore our 2025 brand guidelines' or 'download the full benchmark study').",
                "origin": "deterministic",
                "ai_disclosure": {
                    "model": "accessibility-linter",
                    "provider": "BrandGuard Deterministic",
                    "redaction_applied": False
                }
            })

    # 2. Check markdown images: ![alt](url)
    md_image_pattern = re.compile(r"!\[(.*?)\]\((.*?)\)")
    for match in md_image_pattern.finditer(content):
        alt = match.group(1).strip()
        span_start, span_end = match.span()
        matched_text = match.group(0)

        if not alt or alt.lower() in GENERIC_ALT_TEXTS:
            findings.append({
                "category": "accessibility",
                "severity": "high",
                "span_start": span_start,
                "span_end": span_end,
                "span_text": matched_text,
                "rule": "WCAG 1.1.1: Missing or Non-Descriptive Image Alt Text",
                "source_chunk_id": None,
                "source_excerpt": "WCAG 1.1.1 Non-text Content requires concise, meaningful alternative text describing the image's informative purpose for screen reader users.",
                "confidence": "high",
                "claim_label": None,
                "suggested_rewrite": f"![Descriptive text describing image subject and intent]({match.group(2)})",
                "origin": "deterministic",
                "ai_disclosure": {
                    "model": "accessibility-linter",
                    "provider": "BrandGuard Deterministic",
                    "redaction_applied": False
                }
            })

    # 3. Check submitted alt texts list if provided
    if alt_texts:
        for item in alt_texts:
            img_name = item.get("image_name", "Image")
            alt = item.get("alt_text", "").strip()
            if not alt or alt.lower() in GENERIC_ALT_TEXTS:
                findings.append({
                    "category": "accessibility",
                    "severity": "high",
                    "span_start": 0,
                    "span_end": 0,
                    "span_text": f"Image: {img_name} (alt: '{alt}')",
                    "rule": "WCAG 1.1.1: Missing or Generic Alt Text for Asset",
                    "source_chunk_id": None,
                    "source_excerpt": f"Asset '{img_name}' is missing descriptive alternative text.",
                    "confidence": "high",
                    "claim_label": None,
                    "suggested_rewrite": f"Provide meaningful description of {img_name} summarizing its visual data or key visual takeaway.",
                    "origin": "deterministic",
                    "ai_disclosure": {
                        "model": "accessibility-linter",
                        "provider": "BrandGuard Deterministic",
                        "redaction_applied": False
                    }
                })

    return findings
