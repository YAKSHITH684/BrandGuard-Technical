from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel

class AuditLogOut(BaseModel):
    id: str
    workspace_id: str
    actor_id: Optional[str] = None
    actor_name: Optional[str] = None
    actor_email: Optional[str] = None
    event_type: str
    entity_type: str
    entity_id: str
    log_metadata: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True
