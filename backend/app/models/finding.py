import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database import Base

class Finding(Base):
    __tablename__ = "findings"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    version_id = Column(String(36), ForeignKey("draft_versions.id", ondelete="CASCADE"), nullable=False, index=True)
    category = Column(String(50), nullable=False)  # tone | terminology | fact | claim | accessibility | privacy
    severity = Column(String(50), nullable=False)  # low | medium | high
    span_start = Column(Integer, nullable=False, default=0)
    span_end = Column(Integer, nullable=False, default=0)
    span_text = Column(Text, nullable=False)
    rule = Column(String(255), nullable=False)
    source_chunk_id = Column(String(36), ForeignKey("source_chunks.id", ondelete="SET NULL"), nullable=True)
    source_excerpt = Column(Text, nullable=True)
    confidence = Column(String(50), nullable=False)  # high | medium | low | cannot_verify
    claim_label = Column(String(50), nullable=True)  # supported | outdated | unsupported | null
    suggested_rewrite = Column(Text, nullable=True)
    origin = Column(String(50), nullable=False, default="deterministic")  # deterministic | ai
    ai_disclosure = Column(JSON, nullable=True)  # {"model": "...", "provider": "Groq", "redaction_applied": bool}
    created_at = Column(DateTime, default=datetime.utcnow)

    version = relationship("DraftVersion", back_populates="findings")
    actions = relationship("FindingAction", back_populates="finding", cascade="all, delete-orphan", order_by="FindingAction.created_at.desc()")
    comments = relationship("Comment", back_populates="finding", cascade="all, delete-orphan")


class FindingAction(Base):
    __tablename__ = "finding_actions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    finding_id = Column(String(36), ForeignKey("findings.id", ondelete="CASCADE"), nullable=False, index=True)
    actor_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    action = Column(String(50), nullable=False)  # accept | edit | reject | dispute
    reason = Column(Text, nullable=True)
    edited_text = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    finding = relationship("Finding", back_populates="actions")
    actor = relationship("User")
