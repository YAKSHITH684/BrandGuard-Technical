from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.models.source import SourceChunk
from app.ai.embeddings import get_embedding, cosine_similarity
from app.database import is_sqlite

def retrieve_relevant_chunks(
    db: Session,
    workspace_id: str,
    query_text: str,
    top_k: int = 4,
    min_similarity: float = 0.25
) -> List[Dict[str, Any]]:
    """
    Retrieves the top-k most relevant source chunks for a given query text.
    Supports both native PostgreSQL pgvector cosine similarity and SQLite in-memory ranking.
    """
    if not query_text.strip():
        return []

    query_emb = get_embedding(query_text)

    results = []

    if not is_sqlite:
        # Native pgvector cosine distance: (<=> is cosine distance, 1 - distance = similarity)
        stmt = text("""
            SELECT id, document_id, content, section, page, effective_date, expires_on,
                   (1 - (embedding <=> :query_emb::vector)) as similarity
            FROM source_chunks
            WHERE workspace_id = :ws_id AND embedding IS NOT NULL
            ORDER BY embedding <=> :query_emb::vector ASC
            LIMIT :top_k
        """)
        raw_res = db.execute(stmt, {
            "query_emb": str(query_emb),
            "ws_id": workspace_id,
            "top_k": top_k
        }).fetchall()

        for row in raw_res:
            sim = float(row.similarity) if row.similarity is not None else 0.0
            if sim >= min_similarity:
                results.append({
                    "id": row.id,
                    "document_id": row.document_id,
                    "content": row.content,
                    "section": row.section,
                    "page": row.page,
                    "effective_date": row.effective_date,
                    "expires_on": row.expires_on,
                    "relevance_score": round(sim, 3)
                })
    else:
        # SQLite fallback: fetch chunks for workspace and calculate cosine similarity in Python
        chunks = db.query(SourceChunk).filter(SourceChunk.workspace_id == workspace_id).all()
        scored_chunks = []
        for c in chunks:
            if c.embedding is not None:
                sim = cosine_similarity(query_emb, c.embedding)
                if sim >= min_similarity:
                    scored_chunks.append((sim, c))

        scored_chunks.sort(key=lambda x: x[0], reverse=True)
        for sim, c in scored_chunks[:top_k]:
            results.append({
                "id": c.id,
                "document_id": c.document_id,
                "content": c.content,
                "section": c.section,
                "page": c.page,
                "effective_date": c.effective_date,
                "expires_on": c.expires_on,
                "relevance_score": round(sim, 3)
            })

    return results
