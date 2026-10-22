import re
from typing import Tuple, Dict, Any, List

# Regular expressions for PII and secrets
EMAIL_REGEX = re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b")
PHONE_REGEX = re.compile(r"\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b")
CARD_REGEX = re.compile(r"\b(?:\d{4}[-\s]?){3}\d{4}\b")
SSN_REGEX = re.compile(r"\b\d{3}-\d{2}-\d{4}\b")

# Secrets and tokens: API keys, AWS keys, JWTs, Groq/OpenAI style keys
SECRET_PATTERNS = [
    (re.compile(r"\b(?:gsk|sk|pk|ghp|gho)_[a-zA-Z0-9_]{16,}\b"), "API_KEY"),
    (re.compile(r"\bAKIA[0-9A-Z]{16}\b"), "AWS_ACCESS_KEY"),
    (re.compile(r"\b(?:api[_-]?key|secret|token|password)\s*[:=]\s*['\"]?([a-zA-Z0-9_\-\.]{8,})['\"]?", re.IGNORECASE), "SECRET_VALUE"),
    (re.compile(r"\bBearer\s+[a-zA-Z0-9_\-\.]{20,}\b", re.IGNORECASE), "BEARER_TOKEN"),
]

def redact_sensitive_data(text: str) -> Tuple[str, bool, List[Dict[str, Any]], Dict[str, str]]:
    """
    Scans text and redacts PII and secrets before sending to external model.
    Returns:
        redacted_text (str): Safe text with tokens
        redaction_applied (bool): True if any items were redacted
        redactions_summary (list): Descriptions of what was redacted without exposing secrets
        token_map (dict): Placeholder -> Original mapping
    """
    redacted_text = text
    token_map = {}
    summary = []
    counter = 0

    # 1. Emails
    for match in list(EMAIL_REGEX.finditer(text)):
        val = match.group(0)
        counter += 1
        placeholder = f"[REDACTED_EMAIL_{counter}]"
        token_map[placeholder] = val
        redacted_text = redacted_text.replace(val, placeholder)
        summary.append({"type": "EMAIL", "placeholder": placeholder})

    # 2. Phone numbers
    for match in list(PHONE_REGEX.finditer(text)):
        val = match.group(0)
        counter += 1
        placeholder = f"[REDACTED_PHONE_{counter}]"
        token_map[placeholder] = val
        redacted_text = redacted_text.replace(val, placeholder)
        summary.append({"type": "PHONE", "placeholder": placeholder})

    # 3. Credit cards
    for match in list(CARD_REGEX.finditer(text)):
        val = match.group(0)
        counter += 1
        placeholder = f"[REDACTED_CARD_{counter}]"
        token_map[placeholder] = val
        redacted_text = redacted_text.replace(val, placeholder)
        summary.append({"type": "CREDIT_CARD", "placeholder": placeholder})

    # 4. SSN
    for match in list(SSN_REGEX.finditer(text)):
        val = match.group(0)
        counter += 1
        placeholder = f"[REDACTED_ID_{counter}]"
        token_map[placeholder] = val
        redacted_text = redacted_text.replace(val, placeholder)
        summary.append({"type": "NATIONAL_ID", "placeholder": placeholder})

    # 5. Secrets and Tokens
    for pattern, label in SECRET_PATTERNS:
        for match in list(pattern.finditer(text)):
            val = match.group(0)
            counter += 1
            placeholder = f"[REDACTED_{label}_{counter}]"
            token_map[placeholder] = val
            redacted_text = redacted_text.replace(val, placeholder)
            summary.append({"type": label, "placeholder": placeholder})

    applied = len(summary) > 0
    return redacted_text, applied, summary, token_map

def restore_redacted_text(text: str, token_map: Dict[str, str]) -> str:
    restored = text
    for placeholder, original in token_map.items():
        restored = restored.replace(placeholder, original)
    return restored
