from datetime import date, datetime
from typing import Optional, Dict, Any

def evaluate_claim_chunk_freshness(chunk: Dict[str, Any], today: Optional[date] = None) -> str:
    """
    Checks if an approved source chunk is current, outdated, or expired.
    Returns: 'supported' or 'outdated'
    """
    if today is None:
        today = date.today()

    expires_on = chunk.get("expires_on")
    if expires_on:
        if isinstance(expires_on, str):
            try:
                expires_on = datetime.strptime(expires_on, "%Y-%m-%d").date()
            except ValueError:
                expires_on = None

        if expires_on and expires_on < today:
            return "outdated"

    return "supported"
