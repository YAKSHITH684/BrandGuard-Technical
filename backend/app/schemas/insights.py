from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class CategoryViolation(BaseModel):
    category: str
    count: int

class RuleViolation(BaseModel):
    rule: str
    category: str
    count: int

class OverriddenRuleItem(BaseModel):
    rule: str
    category: str
    total_findings: int
    overridden_count: int  # rejected or disputed
    override_rate: float  # percentage
    dispute_count: int
    reject_count: int
    sample_reasons: List[str]
    guideline_status: str  # "Needs Clarification", "Moderate Overrides", "Clear"

class ClaimLabelStats(BaseModel):
    supported: int
    outdated: int
    unsupported: int
    total_claims: int

class InsightsSummaryResponse(BaseModel):
    total_drafts: int
    total_findings: int
    acceptance_rate: float  # suggestions accepted / total acted
    average_review_time_minutes: float
    violations_by_category: List[CategoryViolation]
    top_rules: List[RuleViolation]
    claim_distribution: ClaimLabelStats
    most_overridden_rules: List[OverriddenRuleItem]
    issues_caught_vs_baseline: Dict[str, Any]
