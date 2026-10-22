import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime
from sqlalchemy.orm import relationship
from app.database import Base

class Workspace(Base):
    __tablename__ = "workspaces"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    readability_target = Column(Float, default=60.0)
    confidence_threshold = Column(Float, default=0.65)
    created_at = Column(DateTime, default=datetime.utcnow)

    users = relationship("User", back_populates="workspace", cascade="all, delete-orphan")
    source_documents = relationship("SourceDocument", back_populates="workspace", cascade="all, delete-orphan")
    glossary_terms = relationship("GlossaryTerm", back_populates="workspace", cascade="all, delete-orphan")
    drafts = relationship("Draft", back_populates="workspace", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="workspace", cascade="all, delete-orphan")
