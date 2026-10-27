import os
import bcrypt
import jwt
from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.config import settings
from app.database import get_db
from app.models.user import User
from app.models.workspace import Workspace
from app.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    ResetPasswordRequest,
    TokenResponse,
    UserOut,
    WorkspaceOut,
    UpdateSettingsRequest
)
from app.services.audit import log_audit_event

router = APIRouter(prefix="/auth", tags=["Authentication"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login", auto_error=False)

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)

def get_current_user(token: Optional[str] = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials not provided",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Could not validate credentials")

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user

def get_optional_user(token: Optional[str] = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> Optional[User]:
    if not token:
        return None
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        if not user_id:
            return None
        return db.query(User).filter(User.id == user_id).first()
    except Exception:
        return None

@router.post("/register", response_model=TokenResponse)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == req.email.lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists")

    # Workspace creation or resolution
    workspace = Workspace(
        name=req.workspace_name or "Acme Corp",
        readability_target=settings.DEFAULT_READABILITY_TARGET,
        confidence_threshold=settings.CONFIDENCE_THRESHOLD
    )
    db.add(workspace)
    db.commit()
    db.refresh(workspace)

    user = User(
        workspace_id=workspace.id,
        name=req.name,
        email=req.email.lower(),
        password_hash=hash_password(req.password),
        role=req.role or "creator"
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    log_audit_event(
        db=db,
        workspace_id=workspace.id,
        actor_id=user.id,
        event_type="user_registered",
        entity_type="user",
        entity_id=user.id,
        metadata={"role": user.role, "workspace": workspace.name}
    )

    token = create_access_token({"sub": user.id, "email": user.email, "role": user.role, "ws": workspace.id})
    return {"access_token": token, "token_type": "bearer"}

@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email.lower()).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Invalid email or password")

    token = create_access_token({"sub": user.id, "email": user.email, "role": user.role, "ws": user.workspace_id})
    return {"access_token": token, "token_type": "bearer"}

@router.post("/reset-password", response_model=TokenResponse)
def reset_password(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email.lower()).first()
    if not user:
        raise HTTPException(status_code=404, detail="No account registered with this email address")

    if not req.new_password or len(req.new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    user.password_hash = hash_password(req.new_password)
    db.commit()
    db.refresh(user)

    log_audit_event(
        db=db,
        workspace_id=user.workspace_id,
        actor_id=user.id,
        event_type="password_reset",
        entity_type="user",
        entity_id=user.id,
        metadata={"email": user.email}
    )

    token = create_access_token({"sub": user.id, "email": user.email, "role": user.role, "ws": user.workspace_id})
    return {"access_token": token, "token_type": "bearer"}

@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.put("/settings", response_model=UserOut)
def update_settings(
    req: UpdateSettingsRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ws = db.query(Workspace).filter(Workspace.id == current_user.workspace_id).first()
    if ws:
        if req.workspace_name is not None:
            ws.name = req.workspace_name
        if req.readability_target is not None:
            ws.readability_target = req.readability_target
        if req.confidence_threshold is not None:
            ws.confidence_threshold = req.confidence_threshold

    if req.name is not None and req.name.strip():
        current_user.name = req.name.strip()

    if req.role is not None and req.role in ["creator", "brand_manager", "reviewer"]:
        current_user.role = req.role

    if req.groq_api_key is not None:
        new_key = req.groq_api_key.strip()
        settings.GROQ_API_KEY = new_key
        os.environ["GROQ_API_KEY"] = new_key
        # Persist to .env
        env_paths = [
            os.path.join(os.getcwd(), ".env"),
            os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env")
        ]
        for ep in env_paths:
            if os.path.exists(ep):
                try:
                    with open(ep, "r", encoding="utf-8") as f:
                        lines = f.readlines()
                    new_lines = []
                    found = False
                    for line in lines:
                        if line.startswith("GROQ_API_KEY="):
                            new_lines.append(f"GROQ_API_KEY={new_key}\n")
                            found = True
                        else:
                            new_lines.append(line)
                    if not found:
                        new_lines.append(f"GROQ_API_KEY={new_key}\n")
                    with open(ep, "w", encoding="utf-8") as f:
                        f.writelines(new_lines)
                except Exception as e:
                    print(f"[Settings] Error writing to .env ({ep}): {e}")

    db.commit()
    db.refresh(current_user)
    return current_user
