import re
from typing import List, Dict, Any

SUPERLATIVES_PATTERNS = [
    (r"\b(world['’]?s\s+best|the\s+best\s+in\s+the\s+world)\b", "Claims Policy 3.1: Absolute World's Best Superlative", "world's best"),
    (r"\b(fastest|quickest)\b(?!\s+(?:time|runner|lap))", "Claims Policy 3.2: Unqualified Speed Superlative ('fastest')", "fastest"),
    (r"(?:^|[\s\(\[\{])(#\s*1|number\s+one|no\.\s*1)\b", "Claims Policy 3.3: Unsubstantiated '#1' Ranking Claim", "#1"),
    (r"\b(guaranteed\s+results?|100%\s+guaranteed|guarantee)\b", "Claims Policy 3.4: Prohibited Absolute Guarantee", "guaranteed"),
    (r"\b(unbeatable|flawless|impossible\s+to\s+break|zero\s+risk)\b", "Claims Policy 3.5: Absolute Risk-Free/Unbeatable Assertion", "unbeatable/zero-risk"),
    (r"\b(100%\s+satisfaction|100%\s+uptime)\b", "Claims Policy 3.6: Absolute 100% Metric without SLA Scope", "100% claim"),
    (r"\b(\d{1,3}%\s+(?:faster|increase|reduction|growth))\b", "Claims Policy 3.7: Specific Performance Percentage without Benchmark Date", "unqualified percentage")
]

def check_claim_patterns(content: str) -> List[Dict[str, Any]]:
    findings = []
    
    for pattern_str, rule_name, label in SUPERLATIVES_PATTERNS:
        pattern = re.compile(pattern_str, re.IGNORECASE)
        for match in pattern.finditer(content):
            span_start, span_end = match.span()
            matched_text = match.group(0)
            
            # Context-sensitive suggested rewrite
            suggested = None
            if "best" in matched_text.lower():
                suggested = "leading"
            elif "fastest" in matched_text.lower():
                suggested = "high-performance"
            elif "#1" in matched_text.lower() or "number one" in matched_text.lower():
                suggested = "top-rated according to recent customer satisfaction benchmarks"
            elif "guaranteed" in matched_text.lower():
                suggested = "designed for dependable performance"
            elif "100%" in matched_text:
                suggested = "industry-leading"
            else:
                suggested = f"verified {matched_text} per approved benchmark documentation"

            findings.append({
                "category": "claim",
                "severity": "high",
                "span_start": span_start,
                "span_end": span_end,
                "span_text": matched_text,
                "rule": rule_name,
                "source_chunk_id": None,
                "source_excerpt": f"Brand Claims Guidelines require all superlative and quantitative performance assertions to cite a specific test timeframe, peer group, or audit reference.",
                "confidence": "high",
                "claim_label": "unsupported",
                "suggested_rewrite": suggested,
                "origin": "deterministic",
                "ai_disclosure": {
                    "model": "rule-engine",
                    "provider": "BrandGuard Deterministic",
                    "redaction_applied": False
                }
            })
            
    return findings
