from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.insights import InsightsSummaryResponse, OverriddenRuleItem
from app.routers.auth import get_current_user
from app.services.insights import get_insights_summary

router = APIRouter(prefix="/insights", tags=["Insights & Governance Feedback"])

@router.get("/summary", response_model=InsightsSummaryResponse)
def get_insights(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return get_insights_summary(db, current_user.workspace_id)

@router.get("/overridden-rules", response_model=List[OverriddenRuleItem])
def get_overridden_rules(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    summary = get_insights_summary(db, current_user.workspace_id)
    return summary["most_overridden_rules"]
