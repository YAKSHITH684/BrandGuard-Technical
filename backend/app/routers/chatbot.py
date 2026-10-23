from typing import List, Dict, Any, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.config import settings
from app.database import get_db
from app.models.user import User
from app.models.workspace import Workspace
from app.models.source import GlossaryTerm
from app.schemas.ai import ChatRequest, ChatResponse, CitedSource
from app.routers.auth import get_optional_user
from app.ai.retrieval import retrieve_relevant_chunks
from app.ai.llm_client import get_best_groq_model
from app.services.audit import log_audit_event

try:
    from groq import Groq
    groq_available = True
except ImportError:
    groq_available = False

router = APIRouter(prefix="/ai", tags=["Groq AI Brand Assistant"])

SYSTEM_CHAT_PROMPT = """You are BrandGuard AI Copilot, the official brand governance advisor for the workspace.
Your mission is to help creators, copywriters, and marketers write 100% compliant, approved, and grounded content.

RULES & INSTRUCTIONS:
1. Always ground your advice in the provided APPROVED WORKSPACE SOURCES below.
2. If asked about terminology, specify whether terms are preferred, banned, or required, and state their official replacements.
3. If asked about performance metrics (e.g. throughput, SLA uptime, compliance certifications), cite the exact figures and dates from the fact sheet.
4. If a user asks to rewrite copy, preserve their core intent and conversational voice while eliminating banned terms and unsubstantiated superlatives.
5. Be concise, professional, helpful, and reference the specific policy sections (e.g. 'Claims Policy 3.2' or 'Section 1: Voice & Tone').
"""

@router.post("/chat", response_model=ChatResponse)
def chat_with_brandguard_copilot(
    req: ChatRequest,
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    user_msg = req.message.strip()
    if not user_msg:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    # 1. Resolve workspace
    if current_user:
        ws_id = current_user.workspace_id
        actor_id = current_user.id
    else:
        # Default/demo workspace for guest exploratory chat
        first_ws = db.query(Workspace).first()
        ws_id = first_ws.id if first_ws else None
        actor_id = "guest_user"

    # Retrieve relevant source chunks for workspace
    retrieved = retrieve_relevant_chunks(db, ws_id, user_msg, top_k=4, min_similarity=0.15) if ws_id else []
    
    # Retrieve glossary items that match terms in message
    glossary = db.query(GlossaryTerm).filter(GlossaryTerm.workspace_id == ws_id).all() if ws_id else []
    matching_terms = [g for g in glossary if g.term.lower() in user_msg.lower()]

    cited_sources = [
        CitedSource(
            id=c["id"],
            section=c.get("section", "General"),
            content=c["content"],
            relevance_score=c["relevance_score"]
        )
        for c in retrieved
    ]

    # Context block for prompt
    context_str = ""
    if matching_terms:
        context_str += "--- RELEVANT GLOSSARY RULES ---\n"
        for t in matching_terms:
            context_str += f"* Term '{t.term}' ({t.type.upper()}): Replacement: '{t.replacement or 'N/A'}'. Note: {t.note or ''}\n"

    if retrieved:
        context_str += "\n--- RETRIEVED APPROVED GUIDELINES & FACTS ---\n"
        for idx, c in enumerate(retrieved, 1):
            context_str += f"[{idx}] Section: {c.get('section', 'General')}\n{c['content']}\n\n"

    # 3. Call Groq if configured
    if settings.GROQ_API_KEY and groq_available:
        try:
            client = Groq(api_key=settings.GROQ_API_KEY)
            model_name = get_best_groq_model(client)

            today_str = datetime.now().strftime("%A, %B %d, %Y")
            messages = [
                {
                    "role": "system",
                    "content": f"{SYSTEM_CHAT_PROMPT}\n\nToday's Date: {today_str}\n\nCURRENT APPROVED WORKSPACE CONTEXT:\n{context_str}"
                }
            ]

            # Add previous conversation history (limit to last 6 messages)
            for h in req.history[-6:]:
                messages.append({"role": h.role, "content": h.content})

            messages.append({"role": "user", "content": user_msg})

            completion = client.chat.completions.create(
                model=model_name,
                messages=messages,
                temperature=0.2,
                max_tokens=800
            )

            reply = completion.choices[0].message.content

            if current_user and ws_id:
                try:
                    log_audit_event(
                        db=db,
                        workspace_id=ws_id,
                        actor_id=actor_id,
                        event_type="ai_assistant_chat",
                        entity_type="chat_session",
                        entity_id=actor_id,
                        metadata={"model": model_name, "sources_cited": len(cited_sources)}
                    )
                except Exception:
                    pass

            return ChatResponse(
                reply=reply,
                cited_sources=cited_sources,
                model_used=model_name,
                ai_status="available"
            )
        except Exception as e:
            # Fall through to offline fallback if Groq call encounters network/key error
            print(f"[CHATBOT GROQ ERROR] {type(e).__name__}: {e}")
            pass

    # 4. Fallback when GROQ_API_KEY is not set or network fails
    fallback_reply = generate_offline_governance_reply(user_msg, matching_terms, retrieved)

    return ChatResponse(
        reply=fallback_reply,
        cited_sources=cited_sources,
        model_used="deterministic-copilot",
        ai_status="offline_fallback"
    )

def generate_offline_governance_reply(msg: str, terms: List[GlossaryTerm], chunks: List[Dict[str, Any]]) -> str:
    msg_lower = msg.lower()

    if terms:
        t = terms[0]
        if t.type == "banned":
            return (
                f"**Brand Policy Alert:** The term **'{t.term}'** is strictly **banned** per workspace terminology rules.\n\n"
                f"* **Approved Replacement:** **{t.replacement}**\n"
                f"* **Policy Note:** {t.note or 'Use official trademarked product lines.'}\n\n"
                f"*(Tip: Set `GROQ_API_KEY` in `.env` or Settings to enable dynamic AI rewrites with Llama 3.3)*"
            )
        elif t.type == "required":
            return (
                f"**Mandatory Compliance Rule:** **'{t.term}'** is required when mentioning this topic. {t.note or ''}"
            )

    if any(k in msg_lower for k in ["sla", "uptime", "availability"]):
        return (
            "**Verified Brand Fact:** The production Acme Enterprise Hub SLA guarantees **99.95% monthly uptime** (Effective 2025).\n\n"
            "*Note: Historical 2023 99.85% figures are outdated and must not be used.* (Ref: Section 3: Availability & SLAs)"
        )

    if any(k in msg_lower for k in ["throughput", "events", "speed", "latency"]):
        return (
            "**Approved Performance Figures (2025 Fact Sheet):**\n"
            "* **Throughput:** 2.4 million events per second across 12 distributed regions.\n"
            "* **P99 Latency:** 4.2 milliseconds under peak multi-tenant load.\n"
            "* **Efficiency:** 28% CPU reduction vs standard open-source clusters (Report #BM-2025-04)."
        )

    if any(k in msg_lower for k in ["superlative", "fastest", "world's best", "#1", "best"]):
        return (
            "**Claims Policy 3.2 Violation Warning:**\n"
            "Superlatives like *'fastest'*, *'world's best'*, and *'#1'* are prohibited unless citing an approved third-party benchmark study with publication date.\n\n"
            "**Recommended compliant phrasing:** *'demonstrated leading throughput'* or *'high-performance streaming engine'*."
        )

    if chunks:
        c = chunks[0]
        return (
            f"**Approved Source Excerpt (Section: {c.get('section', 'General')}):**\n\n"
            f"> {c['content']}\n\n"
            f"*(Connect a Groq API key in Settings to chat interactively with Llama 3.3)*"
        )

    return (
        "I am the **BrandGuard Copilot**. Ask me anything about your brand voice, claims policy, approved SLA numbers, or banned terminology!\n\n"
        "*(To enable generative Llama 3.3 completions, add your free key to `GROQ_API_KEY` in Settings)*"
    )
