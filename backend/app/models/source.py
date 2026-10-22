import uuid
from datetime import datetime, date
from sqlalchemy import Column, String, Integer, Text, Date, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector
from app.database import Base

class SourceDocument(Base):
    __tablename__ = "source_documents"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    source_type = Column(String(50), nullable=False)  # guideline | fact_sheet | glossary
    status = Column(String(50), nullable=False, default="ready")  # processing | ready | failed
    chunk_count = Column(Integer, default=0)
    uploaded_by = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    workspace = relationship("Workspace", back_populates="source_documents")
    chunks = relationship("SourceChunk", back_populates="document", cascade="all, delete-orphan")


class SourceChunk(Base):
    __tablename__ = "source_chunks"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    document_id = Column(String(36), ForeignKey("source_documents.id", ondelete="CASCADE"), nullable=False, index=True)
    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    content = Column(Text, nullable=False)
    embedding = Column(Vector(384), nullable=True)
    section = Column(String(255), nullable=True)
    page = Column(Integer, nullable=True)
    effective_date = Column(Date, nullable=True)
    expires_on = Column(Date, nullable=True)

    document = relationship("SourceDocument", back_populates="chunks")


class GlossaryTerm(Base):
    __tablename__ = "glossary_terms"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    term = Column(String(255), nullable=False, index=True)
    type = Column(String(50), nullable=False)  # banned | preferred | required
    replacement = Column(String(255), nullable=True)
    note = Column(Text, nullable=True)

    workspace = relationship("Workspace", back_populates="glossary_terms")
