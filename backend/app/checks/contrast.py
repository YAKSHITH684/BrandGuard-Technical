import re
from typing import Dict, Any, List

def hex_to_rgb(hex_code: str):
    hex_code = hex_code.strip().lstrip("#")
    if len(hex_code) == 3:
        hex_code = "".join([c * 2 for c in hex_code])
    if len(hex_code) != 6:
        return 0, 0, 0
    return int(hex_code[0:2], 16), int(hex_code[2:4], 16), int(hex_code[4:6], 16)

def channel_luminance(c_255: int) -> float:
    c = c_255 / 255.0
    if c <= 0.04045:
        return c / 12.92
    return ((c + 0.055) / 1.055) ** 2.4

def calculate_relative_luminance(r: int, g: int, b: int) -> float:
    r_lum = channel_luminance(r)
    g_lum = channel_luminance(g)
    b_lum = channel_luminance(b)
    return 0.2126 * r_lum + 0.7152 * g_lum + 0.0722 * b_lum

def evaluate_contrast_ratio(foreground: str, background: str, font_size: str = "normal") -> Dict[str, Any]:
    fg_r, fg_g, fg_b = hex_to_rgb(foreground)
    bg_r, bg_g, bg_b = hex_to_rgb(background)
    
    l1 = calculate_relative_luminance(fg_r, fg_g, fg_b)
    l2 = calculate_relative_luminance(bg_r, bg_g, bg_b)
    
    lighter = max(l1, l2)
    darker = min(l1, l2)
    
    ratio = round((lighter + 0.05) / (darker + 0.05), 2)
    
    is_large = (font_size == "large")
    aa_threshold = 3.0 if is_large else 4.5
    aaa_threshold = 4.5 if is_large else 7.0
    
    passes_aa = ratio >= aa_threshold
    passes_aaa = ratio >= aaa_threshold
    
    if passes_aa:
        msg = f"Passes WCAG AA standard ({ratio}:1 >= {aa_threshold}:1 required for {font_size} text)."
    else:
        msg = f"Fails WCAG AA standard! Contrast ratio {ratio}:1 is below the required {aa_threshold}:1 for {font_size} text."

    return {
        "foreground": foreground,
        "background": background,
        "contrast_ratio": ratio,
        "passes_aa": passes_aa,
        "passes_aaa": passes_aaa,
        "recommended_ratio": aa_threshold,
        "message": msg
    }

def check_color_pairs_findings(color_pairs: List[Any]) -> List[Dict[str, Any]]:
    findings = []
    if not color_pairs:
        return findings

    for pair in color_pairs:
        fg = getattr(pair, "foreground", None) or (pair.get("foreground") if isinstance(pair, dict) else "")
        bg = getattr(pair, "background", None) or (pair.get("background") if isinstance(pair, dict) else "")
        label = getattr(pair, "label", "Submitted Color Pair") or (pair.get("label", "Submitted Color Pair") if isinstance(pair, dict) else "")
        font_size = getattr(pair, "font_size", "normal") or (pair.get("font_size", "normal") if isinstance(pair, dict) else "normal")
        
        if not fg or not bg:
            continue

        result = evaluate_contrast_ratio(fg, bg, font_size)
        if not result["passes_aa"]:
            findings.append({
                "category": "accessibility",
                "severity": "high",
                "span_start": 0,
                "span_end": 0,
                "span_text": f"Colors: {fg} on {bg} ({label})",
                "rule": f"WCAG 2.1 AA Contrast Ratio (Minimum {result['recommended_ratio']}:1)",
                "source_chunk_id": None,
                "source_excerpt": f"WCAG 2.1 Guideline 1.4.3 requires a visual contrast ratio of at least 4.5:1 for normal text and 3:1 for large text. The evaluated pair '{label}' ({fg} on {bg}) achieved only {result['contrast_ratio']}:1.",
                "confidence": "high",
                "claim_label": None,
                "suggested_rewrite": f"Darken foreground or lighten background to achieve at least {result['recommended_ratio']}:1 contrast ratio.",
                "origin": "deterministic",
                "ai_disclosure": {
                    "model": "wcag-contrast-evaluator",
                    "provider": "BrandGuard Deterministic",
                    "redaction_applied": False
                }
            })
            
    return findings
