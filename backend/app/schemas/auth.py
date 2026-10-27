from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr

class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    workspace_name: Optional[str] = "Acme Corp"
    role: Optional[str] = "creator"  # creator | brand_manager | reviewer

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    new_password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

class WorkspaceOut(BaseModel):
    id: str
    name: str
    readability_target: float
    confidence_threshold: float
    created_at: datetime

    class Config:
        from_attributes = True

class UserOut(BaseModel):
    id: str
    name: str
    email: str
    role: str
    workspace_id: str
    workspace: Optional[WorkspaceOut] = None
    created_at: datetime

    class Config:
        from_attributes = True

class UpdateSettingsRequest(BaseModel):
    name: Optional[str] = None
    workspace_name: Optional[str] = None
    readability_target: Optional[float] = None
    confidence_threshold: Optional[float] = None
    groq_api_key: Optional[str] = None
    role: Optional[str] = None
