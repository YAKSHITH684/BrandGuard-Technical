import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Approval(Base):
    __tablename__ = "approvals"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    draft_id = Column(String(36), ForeignKey("drafts.id", ondelete="CASCADE"), nullable=False, index=True)
    version_id = Column(String(36), ForeignKey("draft_versions.id", ondelete="CASCADE"), nullable=False, index=True)
    approver_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    decision = Column(String(50), nullable=False)  # approved | changes_requested | rejected
    note = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    draft = relationship("Draft", back_populates="approvals")
    version = relationship("DraftVersion", back_populates="approvals")
    approver = relationship("User")
