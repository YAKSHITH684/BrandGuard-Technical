import re
import io
from typing import List, Dict, Any, Optional
from datetime import date, datetime
from sqlalchemy.orm import Session
from app.models.source import SourceDocument, SourceChunk, GlossaryTerm
from app.ai.embeddings import get_embedding
from app.services.audit import log_audit_event

def extract_text_from_file(filename: str, content_bytes: bytes) -> str:
    ext = filename.lower().split(".")[-1]
    
    if ext in ["txt", "md", "markdown"]:
        return content_bytes.decode("utf-8", errors="replace")
    
    elif ext == "pdf":
        try:
            import pdfplumber
            with pdfplumber.open(io.BytesIO(content_bytes)) as pdf:
                pages_text = [p.extract_text() or "" for p in pdf.pages]
                return "\n\n".join(pages_text)
        except Exception:
            return content_bytes.decode("latin1", errors="replace")
            
    elif ext in ["docx"]:
        try:
            import docx
            doc = docx.Document(io.BytesIO(content_bytes))
            return "\n".join([p.text for p in doc.paragraphs if p.text])
        except Exception:
            return content_bytes.decode("latin1", errors="replace")
            
    return content_bytes.decode("utf-8", errors="replace")

def chunk_text(
    text: str,
    source_type: str,
    default_effective_date: Optional[date] = None,
    default_expires_on: Optional[date] = None
) -> List[Dict[str, Any]]:
    """
    Splits text into semantically cohesive chunks with section and date extraction.
    """
    lines = text.split("\n")
    chunks = []
    
    current_section = "General"
    current_buffer = []
    current_eff_date = default_effective_date
    current_exp_date = default_expires_on

    # Date extraction pattern: e.g. "Effective: 2025-01-01", "Expires: 2025-12-31"
    date_regex = re.compile(r"\b(\d{4}-\d{2}-\d{2})\b")

    def flush_chunk(section_name, eff_d, exp_d):
        content_str = "\n".join(current_buffer).strip()
        if content_str and len(content_str) > 20:
            chunks.append({
                "content": content_str,
                "section": section_name,
                "page": 1,
                "effective_date": eff_d,
                "expires_on": exp_d
            })
        current_buffer.clear()

    for line in lines:
        stripped = line.strip()
        
        # Check header
        if stripped.startswith("#"):
            flush_chunk(current_section, current_eff_date, current_exp_date)
            current_section = stripped.lstrip("#").strip()
            continue

        # Look for in-line section headers like [Section: ...] or Section 1.2
        if stripped.startswith("Section ") or stripped.startswith("Policy "):
            flush_chunk(current_section, current_eff_date, current_exp_date)
            current_section = stripped
            continue

        # Check for explicit date stamps in text
        if "effective" in stripped.lower() or "valid from" in stripped.lower():
            m = date_regex.search(stripped)
            if m:
                try:
                    current_eff_date = datetime.strptime(m.group(1), "%Y-%m-%d").date()
                except ValueError:
                    pass

        if "expires" in stripped.lower() or "valid until" in stripped.lower() or "deprecated" in stripped.lower():
            m = date_regex.search(stripped)
            if m:
                try:
                    current_exp_date = datetime.strptime(m.group(1), "%Y-%m-%d").date()
                except ValueError:
                    pass

        if not stripped:
            # Paragraph boundary: flush if buffer is substantial
            if len("\n".join(current_buffer)) > 300:
                flush_chunk(current_section, current_eff_date, current_exp_date)
        else:
            current_buffer.append(stripped)

    # Flush any remaining buffer
    flush_chunk(current_section, current_eff_date, current_exp_date)

    # If no chunk created, create one from entire text
    if not chunks and text.strip():
        chunks.append({
            "content": text.strip()[:1000],
            "section": current_section,
            "page": 1,
            "effective_date": default_effective_date,
            "expires_on": default_expires_on
        })

    return chunks

def ingest_source_document(
    db: Session,
    workspace_id: str,
    title: str,
    source_type: str,
    content: str,
    uploaded_by: Optional[str] = None,
    effective_date: Optional[date] = None,
    expires_on: Optional[date] = None
) -> SourceDocument:
    """
    Ingests, parses, chunks, embeds, and saves a source document with audit logging.
    """
    doc = SourceDocument(
        workspace_id=workspace_id,
        title=title,
        source_type=source_type,
        status="processing",
        uploaded_by=uploaded_by
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    try:
        raw_chunks = chunk_text(content, source_type, effective_date, expires_on)
        chunk_objects = []
        for c in raw_chunks:
            emb = get_embedding(c["content"])
            chunk_obj = SourceChunk(
                document_id=doc.id,
                workspace_id=workspace_id,
                content=c["content"],
                embedding=emb,
                section=c["section"],
                page=c["page"],
                effective_date=c["effective_date"],
                expires_on=c["expires_on"]
            )
            chunk_objects.append(chunk_obj)

        db.add_all(chunk_objects)
        doc.chunk_count = len(chunk_objects)
        doc.status = "ready"
        db.commit()
        db.refresh(doc)

        log_audit_event(
            db=db,
            workspace_id=workspace_id,
            actor_id=uploaded_by,
            event_type="source_imported",
            entity_type="source_document",
            entity_id=doc.id,
            metadata={"title": title, "source_type": source_type, "chunks": len(chunk_objects)}
        )

    except Exception as e:
        doc.status = "failed"
        db.commit()
        raise e

    return doc
