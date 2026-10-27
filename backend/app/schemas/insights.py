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
    guideline_status: str  # "Needs Clarification", "Moderate Overrides", "Clear & Accepted"

class ClaimLabelStats(BaseModel):
    supported: int
    outdated: int
    unsupported: int
    total_claims: int

class VisualViolationStat(BaseModel):
    violation_type: str
    count: int
    rule_sample: str

class RecurringVisualMistake(BaseModel):
    agency_or_asset: str
    violation_type: str
    frequency: int
    recommendation: str

class VisualBrandInsights(BaseModel):
    total_visual_violations: int
    visual_compliance_score: float
    breakdown: List[VisualViolationStat]
    recurring_mistakes: List[RecurringVisualMistake]

class InsightsSummaryResponse(BaseModel):
    total_drafts: int
    total_findings: int
    acceptance_rate: float
    average_review_time_minutes: float
    violations_by_category: List[CategoryViolation]
    top_rules: List[RuleViolation]
    claim_distribution: ClaimLabelStats
    most_overridden_rules: List[OverriddenRuleItem]
    issues_caught_vs_baseline: Dict[str, Any]
    visual_insights: Optional[VisualBrandInsights] = None
