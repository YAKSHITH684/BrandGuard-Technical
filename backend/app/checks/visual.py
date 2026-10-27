import re
from typing import List, Dict, Any, Optional

APPROVED_PALETTE_HEX = {
    "#10b981", "#059669", "#047857", "#34d399", "#6ee7b7", # Emeralds
    "#0f172a", "#1e293b", "#334155", "#475569", "#64748b", "#94a3b8", "#cbd5e1", "#f1f5f9", "#f8fafc", "#ffffff", # Slates & Neutrals
    "#3b82f6", "#2563eb", "#60a5fa", "#1d4ed8", # Blues
    "#f59e0b", "#d97706", "#fef3c7", # Ambers
    "#ef4444", "#dc2626", "#fee2e2"  # Roses
}

DEPRECATED_LOGOS = [
    ("2021 Acme Circular Crest", "Deprecated circular crest replaced in 2025 rebrand"),
    ("Acme Legacy 2020 Badge", "Outdated 2020 lockup without trademark clearance"),
    ("circular logo", "Deprecated circular mark; brand guidelines require the 2025 geometric wordmark"),
    ("old crest", "Legacy seal discontinued after Q4 2024")
]

def check_color_palette(hex_colors: List[str], image_name: str = "visual_asset") -> List[Dict[str, Any]]:
    findings = []
    for hex_code in hex_colors:
        clean_hex = hex_code.strip().lower()
        if not clean_hex.startswith("#"):
            clean_hex = f"#{clean_hex}"
        
        if clean_hex not in APPROVED_PALETTE_HEX:
            findings.append({
                "category": "visual",
                "severity": "medium",
                "span_start": 0,
                "span_end": len(clean_hex),
                "span_text": f"[Image: {image_name}] Off-palette color {hex_code.upper()} detected",
                "rule": f"Visual Brand: Off-Palette Color ({hex_code.upper()})",
                "source_chunk_id": None,
                "source_excerpt": "Acme Brand Voice & Tone Guidelines (Section 4: Visual Identity): All marketing collateral, banners, and digital graphics must strictly adhere to the approved core palette (Emerald #10B981, Slate #0F172A, Sky #3B82F6). Unapproved neon or saturated tones are prohibited.",
                "confidence": "high",
                "claim_label": None,
                "suggested_rewrite": f"Replace off-palette tone {hex_code.upper()} with approved Brand Emerald (#10B981) or Neutral Slate (#64748B).",
                "origin": "visual_check",
                "ai_disclosure": {
                    "model": "visual-palette-analyzer",
                    "provider": "BrandGuard Deterministic Vision",
                    "redaction_applied": False,
                    "image_source": image_name
                }
            })
    return findings

def check_logo_integrity(logo_identifier: str, aspect_ratio_skew: float = 0.0, image_name: str = "visual_asset") -> List[Dict[str, Any]]:
    findings = []
    lower_id = (logo_identifier or "").lower()

    # 1. Deprecated logo check
    for dep_name, reason in DEPRECATED_LOGOS:
        if dep_name.lower() in lower_id:
            findings.append({
                "category": "visual",
                "severity": "high",
                "span_start": 0,
                "span_end": len(logo_identifier),
                "span_text": f"[Image: {image_name}] Deprecated logo variant '{logo_identifier}' detected",
                "rule": "Visual Brand: Deprecated Logo Variant",
                "source_chunk_id": None,
                "source_excerpt": "Acme Brand Guidelines: Only the official 2025 Acme Geometric Wordmark (SVG/Vector) is permitted on public-facing materials. Legacy circular crests and retired badges must not be published.",
                "confidence": "high",
                "claim_label": None,
                "suggested_rewrite": "Swap asset with official 'Acme_Wordmark_2025_Primary.svg' from the approved Brand Assets Kit.",
                "origin": "visual_check",
                "ai_disclosure": {
                    "model": "logo-authenticity-verifier",
                    "provider": "BrandGuard Deterministic Vision",
                    "redaction_applied": False,
                    "image_source": image_name
                }
            })
            break

    # 2. Distorted aspect ratio check (skew > 12%)
    if abs(aspect_ratio_skew) > 0.12:
        findings.append({
            "category": "visual",
            "severity": "high",
            "span_start": 0,
            "span_end": len(logo_identifier or "Logo"),
            "span_text": f"[Image: {image_name}] Distorted logo aspect ratio ({round(aspect_ratio_skew * 100, 1)}% distortion)",
            "rule": "Visual Brand: Distorted Logo Aspect Ratio",
            "source_chunk_id": None,
            "source_excerpt": "Acme Brand Guidelines: Never stretch, squash, tilt, or distort the corporate logo lockup. Aspect ratio 1:1 or native vector proportions must be strictly maintained.",
            "confidence": "high",
            "claim_label": None,
            "suggested_rewrite": "Reset logo bounding box to maintain native 1:1 aspect ratio without horizontal or vertical stretching.",
            "origin": "visual_check",
            "ai_disclosure": {
                "model": "logo-authenticity-verifier",
                "provider": "BrandGuard Deterministic Vision",
                "redaction_applied": False,
                "image_source": image_name
            }
        })

    return findings

def check_visual_contrast(ratio: float, image_name: str = "visual_asset") -> List[Dict[str, Any]]:
    findings = []
    if ratio < 4.5:
        severity = "high" if ratio < 3.0 else "medium"
        findings.append({
            "category": "visual",
            "severity": severity,
            "span_start": 0,
            "span_end": 10,
            "span_text": f"[Image: {image_name}] Low contrast overlay ({round(ratio, 1)}:1)",
            "rule": f"WCAG 2.1 AA: Low Graphic Text Contrast ({round(ratio, 1)}:1)",
            "source_chunk_id": None,
            "source_excerpt": "WCAG 2.1 AA: Visual presentation of text and images of text has a contrast ratio of at least 4.5:1 against banner or graphic backgrounds.",
            "confidence": "high",
            "claim_label": None,
            "suggested_rewrite": "Darken banner background or add a semi-opaque backing scrim behind text to achieve at least 4.5:1 contrast.",
            "origin": "visual_check",
            "ai_disclosure": {
                "model": "contrast-evaluator",
                "provider": "BrandGuard Deterministic Vision",
                "redaction_applied": False,
                "image_source": image_name
            }
        })
    return findings

def check_image_alt_text(alt_text: Optional[str], image_name: str = "visual_asset") -> List[Dict[str, Any]]:
    findings = []
    generic_alts = {"image", "photo", "pic", "picture", "img", "screenshot", "icon", "banner", ""}
    raw_alt = alt_text or ""
    clean = raw_alt.strip().lower()

    if not clean or clean in generic_alts:
        findings.append({
            "category": "accessibility",
            "severity": "medium",
            "span_start": 0,
            "span_end": len(raw_alt),
            "span_text": f"[Image: {image_name}] Missing or non-descriptive alt text ('{raw_alt}')",
            "rule": "WCAG 1.1.1: Missing Descriptive Alt Text",
            "source_chunk_id": None,
            "source_excerpt": "WCAG 1.1.1 (Non-text Content): All non-text content that is presented to the user has a text alternative that serves the equivalent purpose.",
            "confidence": "high",
            "claim_label": None,
            "suggested_rewrite": f"Add descriptive alt text summarizing key figures, metrics, and labels shown in {image_name}.",
            "origin": "visual_check",
            "ai_disclosure": {
                "model": "accessibility-evaluator",
                "provider": "BrandGuard Deterministic Vision",
                "redaction_applied": False,
                "image_source": image_name
            }
        })
    return findings
