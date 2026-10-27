import os
import io
import json
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.config import settings
from app.database import get_db
from app.models.user import User
from app.models.workspace import Workspace
from app.models.source import GlossaryTerm
from app.routers.auth import get_optional_user
from app.ai.retrieval import retrieve_relevant_chunks
from app.ai.llm_client import get_best_groq_model
from app.services.audit import log_audit_event

try:
    from groq import Groq
    groq_available = True
except ImportError:
    groq_available = False

router = APIRouter(prefix="/voice", tags=["Voice Agent & Audio Translation"])

class TextTranslateRequest(BaseModel):
    text: str
    source_language: Optional[str] = "auto"
    target_language: Optional[str] = "en"
    check_brand_compliance: Optional[bool] = True

class VoiceAgentChatRequest(BaseModel):
    message: str
    language: Optional[str] = "en-US"
    mode: Optional[str] = "conversation"  # conversation | translation
    target_language: Optional[str] = "en"
    history: Optional[List[Dict[str, str]]] = []

SYSTEM_VOICE_AGENT_PROMPT = """You are the BrandGuard Interactive Voice Agent.
You converse naturally through spoken voice with copywriters, marketers, and creators.
Keep responses concise, clear, and direct so they are natural to listen to aloud (under 3-4 sentences unless detailed metrics are requested).
Always uphold brand voice guidelines: no banned terminology, no unsubstantiated superlatives, and verify facts against approved sources."""

SYSTEM_TRANSLATOR_PROMPT = """You are the BrandGuard Multilingual Audio & Content Translator.
Your job is to translate spoken content accurately from the source language into the target language.
Rules:
1. Produce a natural, fluent translation preserving original nuance and tone.
2. Ensure translated copy complies with brand guidelines (e.g., do not translate brand names like 'Acme LiveSync', replace banned superlatives with approved neutral claims).
3. Output clean translated text without extra conversational filler."""

@router.post("/chat")
def voice_agent_chat(
    req: VoiceAgentChatRequest,
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    user_msg = req.message.strip()
    if not user_msg:
        raise HTTPException(status_code=400, detail="Spoken message cannot be empty")

    ws_id = current_user.workspace_id if current_user else None
    if not ws_id:
        first_ws = db.query(Workspace).first()
        ws_id = first_ws.id if first_ws else None

    # Retrieve relevant brand chunks
    retrieved = retrieve_relevant_chunks(db, ws_id, user_msg, top_k=3, min_similarity=0.15) if ws_id else []

    # Check glossary
    glossary = db.query(GlossaryTerm).filter(GlossaryTerm.workspace_id == ws_id).all() if ws_id else []
    matching_terms = [g for g in glossary if g.term.lower() in user_msg.lower()]

    context_str = ""
    if matching_terms:
        context_str += "GLOSSARY RULES:\n"
        for t in matching_terms:
            context_str += f"- Term '{t.term}' ({t.type.upper()}): Replacement: '{t.replacement or 'N/A'}'. Note: {t.note or ''}\n"

    if retrieved:
        context_str += "\nAPPROVED SOURCES:\n"
        for c in retrieved:
            context_str += f"- [{c.get('section', 'General')}]: {c['content']}\n"

    # Select system prompt based on mode
    if req.mode == "translation":
        target_lang = req.target_language or "en"
        system_prompt = f"{SYSTEM_TRANSLATOR_PROMPT}\nTarget Language: {target_lang}\n\n{context_str}"
        user_prompt = f"Translate the following spoken copy into {target_lang} while preserving brand compliance:\n\n{user_msg}"
    else:
        system_prompt = f"{SYSTEM_VOICE_AGENT_PROMPT}\nSpoken in: {req.language}\n\n{context_str}"
        user_prompt = user_msg

    # Call Groq if configured
    if settings.GROQ_API_KEY and groq_available:
        try:
            client = Groq(api_key=settings.GROQ_API_KEY)
            model_name = get_best_groq_model(client)

            messages = [{"role": "system", "content": system_prompt}]
            for h in (req.history or [])[-4:]:
                messages.append({"role": h.get("role", "user"), "content": h.get("content", "")})
            messages.append({"role": "user", "content": user_prompt})

            completion = None
            try:
                completion = client.chat.completions.create(
                    model=model_name,
                    messages=messages,
                    temperature=0.2,
                    max_tokens=400
                )
            except Exception:
                fallbacks = ["openai/gpt-oss-120b", "openai/gpt-oss-20b", "qwen/qwen3.8-27b"]
                for fb in fallbacks:
                    try:
                        completion = client.chat.completions.create(
                            model=fb,
                            messages=messages,
                            temperature=0.2,
                            max_tokens=400
                        )
                        model_name = fb
                        break
                    except Exception:
                        continue

            if completion:
                reply = completion.choices[0].message.content
                return {
                    "reply": reply,
                    "mode": req.mode,
                    "model_used": model_name,
                    "ai_status": "available",
                    "sources_cited": len(retrieved)
                }
        except Exception as e:
            print(f"[VOICE AGENT GROQ ERROR] {e}")

    # Fallback response
    if req.mode == "translation":
        reply = f"[Translation of spoken copy]: {user_msg}"
    else:
        reply = f"I heard: \"{user_msg}\". I am your BrandGuard Voice Agent. Ask me anything about claims policies, verified SLA uptime, or banned terminology."

    return {
        "reply": reply,
        "mode": req.mode,
        "model_used": "deterministic-voice-agent",
        "ai_status": "offline_fallback",
        "sources_cited": len(retrieved)
    }

@router.post("/translate-audio")
async def translate_uploaded_audio(
    file: UploadFile = File(...),
    target_language: str = Form("en"),
    db: Session = Depends(get_db)
):
    """
    Transcribes and translates an uploaded or recorded audio file using Groq Whisper.
    """
    filename = file.filename or "recording.webm"
    file_bytes = await file.read()
    if len(file_bytes) == 0:
        raise HTTPException(status_code=400, detail="Uploaded audio file is empty.")

    if len(file_bytes) > 25 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Audio file exceeds 25 MB limit.")

    transcript = ""
    translated_text = ""
    audio_model = "whisper-large-v3-turbo"

    if settings.GROQ_API_KEY and groq_available:
        try:
            client = Groq(api_key=settings.GROQ_API_KEY)

            # 1. First get English translation via Whisper Translations API
            try:
                res = client.audio.translations.create(
                    file=(filename, file_bytes, file.content_type or "audio/webm"),
                    model=audio_model,
                    response_format="json"
                )
                translated_text = getattr(res, "text", "") or ""
            except Exception as te:
                print(f"[WHISPER TRANSLATION FALLBACK] {te}")
                # Fall back to transcription
                res = client.audio.transcriptions.create(
                    file=(filename, file_bytes, file.content_type or "audio/webm"),
                    model=audio_model,
                    response_format="json"
                )
                translated_text = getattr(res, "text", "") or ""

            transcript = translated_text

            # If user wanted a target language other than English, translate using Groq LLM
            if target_language and target_language.lower() not in ["en", "english"] and translated_text:
                try:
                    model_name = get_best_groq_model(client)
                    trans_completion = client.chat.completions.create(
                        model=model_name,
                        messages=[
                            {"role": "system", "content": SYSTEM_TRANSLATOR_PROMPT},
                            {"role": "user", "content": f"Translate this text into {target_language}:\n\n{translated_text}"}
                        ],
                        max_tokens=400
                    )
                    translated_text = trans_completion.choices[0].message.content
                except Exception as e:
                    print(f"[LLM TRANSLATE ERROR] {e}")

            return {
                "success": True,
                "transcript": transcript,
                "translated_text": translated_text,
                "target_language": target_language,
                "audio_model": audio_model,
                "status": "completed"
            }
        except Exception as e:
            print(f"[AUDIO TRANSLATION ERROR] {e}")
            raise HTTPException(status_code=500, detail=f"Audio translation failed: {str(e)}")

    raise HTTPException(
        status_code=503,
        detail="Audio translation requires an active GROQ_API_KEY configured in Settings."
    )

@router.post("/translate-text")
def translate_text(
    req: TextTranslateRequest,
    db: Session = Depends(get_db)
):
    """
    Translates text across languages while upholding BrandGuard guidelines.
    """
    text = req.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    target_lang = req.target_language or "en"
    source_lang = req.source_language or "auto"

    if settings.GROQ_API_KEY and groq_available:
        try:
            client = Groq(api_key=settings.GROQ_API_KEY)
            model_name = get_best_groq_model(client)

            prompt = f"Translate the following text from {source_lang} to {target_lang}. Preserve brand names and enforce a professional, compliant tone:\n\n{text}"
            completion = client.chat.completions.create(
                model=model_name,
                messages=[
                    {"role": "system", "content": SYSTEM_TRANSLATOR_PROMPT},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.2,
                max_tokens=500
            )
            return {
                "original_text": text,
                "translated_text": completion.choices[0].message.content.strip(),
                "source_language": source_lang,
                "target_language": target_lang,
                "model_used": model_name
            }
        except Exception as e:
            print(f"[TEXT TRANSLATE ERROR] {e}")

    return {
        "original_text": text,
        "translated_text": f"[{target_lang.upper()} Translation]: {text}",
        "source_language": source_lang,
        "target_language": target_lang,
        "model_used": "deterministic-fallback"
    }
