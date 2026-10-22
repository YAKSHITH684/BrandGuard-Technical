import re
from typing import List, Dict, Any

def check_banned_terms(content: str, glossary_terms: List[Any]) -> List[Dict[str, Any]]:
    findings = []
    
    for item in glossary_terms:
        term = item.term.strip()
        term_type = getattr(item, "type", "banned").lower()
        replacement = getattr(item, "replacement", None)
        note = getattr(item, "note", "")
        
        if term_type == "banned":
            pattern = re.compile(rf"\b{re.escape(term)}\b", re.IGNORECASE)
            for match in pattern.finditer(content):
                span_start, span_end = match.span()
                span_text = match.group(0)
                
                rewrite = replacement if replacement else None
                rule_desc = f"Glossary Policy: Banned Term '{term}'"
                if note:
                    rule_desc += f" ({note})"

                findings.append({
                    "category": "terminology",
                    "severity": "high",
                    "span_start": span_start,
                    "span_end": span_end,
                    "span_text": span_text,
                    "rule": rule_desc,
                    "source_chunk_id": None,
                    "source_excerpt": f"Banned terminology rule: Replace '{term}' with '{replacement or 'approved terminology'}'. {note or ''}",
                    "confidence": "high",
                    "claim_label": None,
                    "suggested_rewrite": rewrite,
                    "origin": "deterministic",
                    "ai_disclosure": {
                        "model": "rule-engine",
                        "provider": "BrandGuard Deterministic",
                        "redaction_applied": False
                    }
                })
        
        elif term_type == "required":
            pattern = re.compile(rf"\b{re.escape(term)}\b", re.IGNORECASE)
            if not pattern.search(content):
                findings.append({
                    "category": "terminology",
                    "severity": "medium",
                    "span_start": 0,
                    "span_end": min(len(content), 30),
                    "span_text": content[:30] if content else "",
                    "rule": f"Glossary Policy: Required Term Missing ('{term}')",
                    "source_chunk_id": None,
                    "source_excerpt": f"Mandatory terminology rule: Document must include '{term}'. {note or ''}",
                    "confidence": "high",
                    "claim_label": None,
                    "suggested_rewrite": f"Ensure '{term}' is explicitly included in the draft.",
                    "origin": "deterministic",
                    "ai_disclosure": {
                        "model": "rule-engine",
                        "provider": "BrandGuard Deterministic",
                        "redaction_applied": False
                    }
                })
                
    return findings
