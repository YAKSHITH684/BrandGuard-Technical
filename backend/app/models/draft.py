import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Draft(Base):
    __tablename__ = "drafts"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    author_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    status = Column(String(50), nullable=False, default="DRAFT")  # DRAFT, IN_REVIEW, CHANGES_REQUESTED, DISPUTED, APPROVED, REJECTED
    current_version = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    workspace = relationship("Workspace", back_populates="drafts")
    author = relationship("User", back_populates="drafts")
    versions = relationship("DraftVersion", back_populates="draft", cascade="all, delete-orphan", order_by="DraftVersion.version_no")
    comments = relationship("Comment", back_populates="draft", cascade="all, delete-orphan")
    approvals = relationship("Approval", back_populates="draft", cascade="all, delete-orphan")


class DraftVersion(Base):
    __tablename__ = "draft_versions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    draft_id = Column(String(36), ForeignKey("drafts.id", ondelete="CASCADE"), nullable=False, index=True)
    version_no = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)
    redacted_content = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    draft = relationship("Draft", back_populates="versions")
    findings = relationship("Finding", back_populates="version", cascade="all, delete-orphan")
    approvals = relationship("Approval", back_populates="version", cascade="all, delete-orphan")
