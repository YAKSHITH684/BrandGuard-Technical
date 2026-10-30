import json
import re
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.config import settings
from app.models.source import GlossaryTerm, SourceChunk
from app.models.workspace import Workspace
from app.ai.retrieval import retrieve_relevant_chunks
from app.ai.llm_client import get_best_groq_model
from app.services.predictive_scoring import calculate_predictive_compliance_score

try:
    from groq import Groq
    groq_available = True
except ImportError:
    groq_available = False

PRESET_INSTRUCTIONS = {
    "balanced": (
        "Rewrite copy to be 100% brand compliant while retaining natural, friendly, and persuasive engagement. "
        "Eliminate banned terminology and unverified superlatives, replacing them with accurate approved phrasing."
    ),
    "punchy": (
        "Transform this into high-impact marketing copy with dynamic active verbs, crisp hooks, and compelling momentum. "
        "Strictly eliminate policy violations and ground claims with verified metric qualifiers."
    ),
    "executive": (
        "Elevate this to an authoritative, enterprise B2B executive tone. "
        "Focus on business value, SLA performance, enterprise scalability, and security posture. Sophisticated and confident."
    ),
    "accessible": (
        "Rewrite in plain, accessible English (WCAG AA readability, grade level 6-8). "
        "Keep sentences under 15 words, avoid dense technical jargon, and ensure clear, effortless comprehension."
    ),
    "concise": (
        "Streamline into razor-sharp microcopy. Cut filler words, passive structures, and redundancy by 30-50% "
        "while preserving the core value proposition, CTA, and complete regulatory compliance."
    )
}

# Offline deterministic substitution rules
DEFAULT_GLOSSARY_RULES = [
    {"rule": "Banned Superlative", "pattern": r"(?:(?<=\s)|^)#[0-9]+(?=\b|\s|$)", "replacement": "industry-leading", "explanation": "Replaced unverified '#1' superlative with compliant 'industry-leading'"},
    {"rule": "Banned Superlative", "pattern": r"\bworld'?s\s+best\b", "replacement": "award-winning", "explanation": "Softened absolute 'world's best' to verified standard"},
    {"rule": "Banned Superlative", "pattern": r"\bbest[- ]in[- ]class\b", "replacement": "high-performance", "explanation": "Replaced unsubstantiated superlative with descriptive performance qualifier"},
    {"rule": "Unbacked Guarantee", "pattern": r"\b100%\s+guaranteed?\b", "replacement": "backed by our enterprise SLA", "explanation": "Replaced legally binding guarantee with SLA commitment"},
    {"rule": "Unbacked Guarantee", "pattern": r"\bguarantee(d)?\b", "replacement": "designed to deliver", "explanation": "Replaced absolute guarantee with compliant design expectation"},
    {"rule": "Hyperbole Alert", "pattern": r"\brevolutionary\b", "replacement": "innovative", "explanation": "Replaced excessive hyperbole with grounded technical description"},
    {"rule": "Hyperbole Alert", "pattern": r"\binsane(ly)?\b", "replacement": "exceptionally", "explanation": "Replaced hyperbole with professional tone descriptor"},
    {"rule": "Hyperbole Alert", "pattern": r"\bmiracle\b", "replacement": "breakthrough solution", "explanation": "Softened hyperbolic claim into standard product achievement"},
    {"rule": "Hyperbole Alert", "pattern": r"\bunbelievable\b", "replacement": "extraordinary", "explanation": "Substituted informal exclamation with credible term"},
    {"rule": "Security Redaction", "pattern": r"\b(sk_live_[a-zA-Z0-9]{12,}|ghp_[a-zA-Z0-9]{12,}|AKIA[0-9A-Z]{16})\b", "replacement": "[REDACTED_SECRET]", "explanation": "Masked exposed API credential token"},
    {"rule": "Privacy Redaction", "pattern": r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b", "replacement": "contact@brandguard.internal", "explanation": "Masked personal email to prevent PII exposure"}
]

CONCISE_PHRASE_SIMPLIFICATIONS = [
    (r"\bin order to\b", "to"),
    (r"\bat the present time\b", "now"),
    (r"\bdue to the fact that\b", "because"),
    (r"\bhas the capability to\b", "can"),
    (r"\bfor the purpose of\b", "for"),
    (r"\ba wide variety of\b", "multiple"),
    (r"\bin the event that\b", "if"),
    (r"\btake into consideration\b", "consider"),
    (r"\bis able to\b", "can"),
    (r"\bat this point in time\b", "currently")
]

def deterministic_rewrite(
    text: str,
    preset: str = "balanced",
    glossary_terms: Optional[List[Any]] = None
) -> Dict[str, Any]:
    """
    High-quality offline rule engine that applies glossary substitutions,
    claims grounding, sentence simplification, and preset tone adjustments.
    """
    rewritten = text
    fixes_applied: List[Dict[str, str]] = []

    # 1. Apply workspace glossary substitutions first
    if glossary_terms:
        for gt in glossary_terms:
            term_str = getattr(gt, "term", "")
            replacement = getattr(gt, "replacement", "")
            term_type = getattr(gt, "type", "banned")
            if term_str and replacement and term_type in ["banned", "avoid"]:
                pattern = rf"\b{re.escape(term_str)}\b"
                if re.search(pattern, rewritten, flags=re.IGNORECASE):
                    rewritten = re.sub(pattern, replacement, rewritten, flags=re.IGNORECASE)
                    fixes_applied.append({
                        "rule": f"Workspace Glossary ({term_type.capitalize()})",
                        "before": term_str,
                        "after": replacement,
                        "explanation": f"Replaced banned workspace term '{term_str}' with approved '{replacement}'"
                    })

    # 2. Apply default governance pattern replacements
    for item in DEFAULT_GLOSSARY_RULES:
        pattern = item["pattern"]
        repl = item["replacement"]
        if re.search(pattern, rewritten, flags=re.IGNORECASE):
            matches = list(re.finditer(pattern, rewritten, flags=re.IGNORECASE))
            matched_text = matches[0].group(0) if matches else ""
            rewritten = re.sub(pattern, repl, rewritten, flags=re.IGNORECASE)
            fixes_applied.append({
                "rule": item["rule"],
                "before": matched_text or "violation",
                "after": repl,
                "explanation": item["explanation"]
            })

    # 3. Apply style preset rules
    if preset == "concise":
        for pat, repl in CONCISE_PHRASE_SIMPLIFICATIONS:
            if re.search(pat, rewritten, flags=re.IGNORECASE):
                rewritten = re.sub(pat, repl, rewritten, flags=re.IGNORECASE)
                fixes_applied.append({
                    "rule": "Conciseness & Microcopy",
                    "before": pat.replace(r"\b", "").replace(r"\s+", " "),
                    "after": repl,
                    "explanation": f"Trimmed wordy phrase to '{repl}'"
                })

    elif preset == "accessible":
        # Split sentences with semicolons into crisp standalone sentences
        if ";" in rewritten:
            rewritten = rewritten.replace(";", ".")
            fixes_applied.append({
                "rule": "WCAG Plain English",
                "before": ";",
                "after": ".",
                "explanation": "Divided complex compound sentence with semicolon into simple statements"
            })
        for pat, repl in CONCISE_PHRASE_SIMPLIFICATIONS:
            if re.search(pat, rewritten, flags=re.IGNORECASE):
                rewritten = re.sub(pat, repl, rewritten, flags=re.IGNORECASE)

    elif preset == "punchy":
        # Enhance CTA openings if passive
        if re.search(r"\bWe help users\b", rewritten, flags=re.IGNORECASE):
            rewritten = re.sub(r"\bWe help users\b", "Empower your team to", rewritten, flags=re.IGNORECASE)
            fixes_applied.append({
                "rule": "Punchy Marketing Hook",
                "before": "We help users",
                "after": "Empower your team to",
                "explanation": "Replaced passive statement with dynamic action hook"
            })
        if re.search(r"\bYou can try\b", rewritten, flags=re.IGNORECASE):
            rewritten = re.sub(r"\bYou can try\b", "Get started with", rewritten, flags=re.IGNORECASE)
            fixes_applied.append({
                "rule": "Action-Oriented CTA",
                "before": "You can try",
                "after": "Get started with",
                "explanation": "Strengthened call to action verb"
            })

    elif preset == "executive":
        rewritten = re.sub(r"\bgood\b", "robust", rewritten, flags=re.IGNORECASE)
        rewritten = re.sub(r"\bfast\b", "high-throughput", rewritten, flags=re.IGNORECASE)
        rewritten = re.sub(r"\beasy\b", "seamless", rewritten, flags=re.IGNORECASE)

    # Clean up whitespace
    rewritten = re.sub(r" +", " ", rewritten).strip()

    return {
        "rewritten_text": rewritten,
        "fixes_applied": fixes_applied,
        "model_used": "deterministic-policy-engine-v2",
        "ai_status": "offline_fallback"
    }

def generate_auto_rewrite(
    text: str,
    preset: str = "balanced",
    custom_instruction: Optional[str] = None,
    db: Optional[Session] = None,
    workspace_id: Optional[str] = None,
    target_ease: Optional[float] = 60.0
) -> Dict[str, Any]:
    """
    Generates a compliant, tone-adapted rewrite using Groq Llama 3.3
    or the deterministic fallback engine, then evaluates compliance boost.
    """
    clean_text = (text or "").strip()
    if not clean_text:
        return {
            "original_text": "",
            "rewritten_text": "",
            "preset": preset,
            "model_used": "none",
            "ai_status": "empty",
            "original_score": 100.0,
            "projected_score": 100.0,
            "score_boost": 0.0,
            "original_grade": "A+",
            "projected_grade": "A+",
            "fixes_applied": [],
            "diff_summary": {},
            "predictive_breakdown": None
        }

    # Resolve workspace ID if not provided
    ws_id = workspace_id
    if not ws_id and db:
        first_ws = db.query(Workspace).first()
        if first_ws:
            ws_id = first_ws.id

    # Retrieve workspace glossary & relevant chunks
    glossary_terms = []
    retrieved_chunks = []
    if db and ws_id:
        glossary_terms = db.query(GlossaryTerm).filter(GlossaryTerm.workspace_id == ws_id).all()
        try:
            retrieved_chunks = retrieve_relevant_chunks(db, ws_id, clean_text, top_k=4)
        except Exception:
            retrieved_chunks = []

    # 1. Run baseline predictive compliance score on original copy
    original_predictive = calculate_predictive_compliance_score(
        clean_text,
        db=db,
        workspace_id=ws_id,
        target_ease=target_ease
    )

    preset_guide = PRESET_INSTRUCTIONS.get(preset, PRESET_INSTRUCTIONS["balanced"])
    rewritten_text = ""
    fixes_applied: List[Dict[str, str]] = []
    model_used = "deterministic-rule-engine"
    ai_status = "offline_fallback"

    # 2. Attempt Groq AI generation if available
    if settings.GROQ_API_KEY and groq_available:
        try:
            client = Groq(api_key=settings.GROQ_API_KEY)
            selected_model = get_best_groq_model(client)

            # Build rich prompt context
            context_glossary = ""
            if glossary_terms:
                context_glossary = "APPROVED WORKSPACE GLOSSARY POLICIES:\n"
                for g in glossary_terms:
                    context_glossary += f"- '{g.term}' ({g.type.upper()}): Replacement -> '{g.replacement or 'N/A'}'. Note: {g.note or ''}\n"

            context_guidelines = ""
            if retrieved_chunks:
                context_guidelines = "\nVERIFIED BRAND GUIDELINES & FACT CITATIONS:\n"
                for c in retrieved_chunks:
                    context_guidelines += f"- [{c.get('section', 'General')}] {c.get('content', '')}\n"

            system_prompt = f"""You are BrandGuard AI Auto-Rewrite Assistant, the authoritative copy re-writer for enterprise brand compliance.
Your job is to rewrite the user's copy according to the selected tone preset while fixing all compliance violations.

TONE PRESET: {preset.upper()}
PRESET GOAL: {preset_guide}
{f'USER CUSTOM INSTRUCTION: {custom_instruction}' if custom_instruction else ''}

{context_glossary}
{context_guidelines}

STRICT COMPLIANCE MANDATES:
1. Replace all banned terms with their approved equivalents.
2. Soften and qualify unbacked superlatives ('#1', 'world's best', '100% guaranteed') with grounded or SLA phrasing.
3. Remove or mask any API keys, secret credentials, or personal email addresses.
4. Adhere strictly to the chosen tone preset ({preset}).
5. Return ONLY a valid JSON object matching this schema:
{{
  "rewritten_text": "Complete rewritten copy here...",
  "fixes": [
    {{
      "rule": "Category name (e.g. Terminology, Claims, WCAG, Tone)",
      "before": "Offending phrase from original text",
      "after": "Compliant replacement in rewritten text",
      "explanation": "Why this change makes the copy compliant"
    }}
  ]
}}
DO NOT include markdown code blocks around the JSON if possible, just raw valid JSON.
"""

            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Rewrite this draft copy:\n\n{clean_text}"}
            ]

            completion = client.chat.completions.create(
                model=selected_model,
                messages=messages,
                temperature=0.2,
                max_tokens=900
            )

            raw_response = completion.choices[0].message.content.strip()
            # Clean possible markdown wrapping ```json ... ```
            clean_json_str = raw_response
            if clean_json_str.startswith("```"):
                clean_json_str = re.sub(r"^```(?:json)?\s*", "", clean_json_str)
                clean_json_str = re.sub(r"\s*```$", "", clean_json_str)

            parsed = json.loads(clean_json_str)
            rewritten_text = parsed.get("rewritten_text", "").strip()
            raw_fixes = parsed.get("fixes", [])
            for rf in raw_fixes:
                fixes_applied.append({
                    "rule": rf.get("rule", "Policy Alignment"),
                    "before": rf.get("before", ""),
                    "after": rf.get("after", ""),
                    "explanation": rf.get("explanation", "")
                })

            model_used = selected_model
            ai_status = "groq"

        except Exception as e:
            print(f"[AUTO-REWRITE GROQ ERROR] {e}, using deterministic fallback...")
            pass

    # 3. Fallback if Groq unavailable or returned empty text
    if not rewritten_text:
        fallback_res = deterministic_rewrite(clean_text, preset=preset, glossary_terms=glossary_terms)
        rewritten_text = fallback_res["rewritten_text"]
        fixes_applied = fallback_res["fixes_applied"]
        model_used = fallback_res["model_used"]
        ai_status = fallback_res["ai_status"]

    # 4. Run projected predictive compliance score on rewritten copy
    projected_predictive = calculate_predictive_compliance_score(
        rewritten_text,
        db=db,
        workspace_id=ws_id,
        target_ease=target_ease
    )

    orig_score = original_predictive["overall_score"]
    proj_score = projected_predictive["overall_score"]
    score_boost = round(proj_score - orig_score, 1)

    # Word count and readability diff
    orig_words = len(clean_text.split())
    proj_words = len(rewritten_text.split())
    orig_ease = original_predictive["readability_metrics"].get("flesch_reading_ease", 60.0)
    proj_ease = projected_predictive["readability_metrics"].get("flesch_reading_ease", 60.0)

    diff_summary = {
        "original_words": orig_words,
        "rewritten_words": proj_words,
        "word_delta": proj_words - orig_words,
        "original_ease": orig_ease,
        "projected_ease": proj_ease,
        "ease_boost": round(proj_ease - orig_ease, 1),
        "violations_resolved": max(0, original_predictive["detected_violations_count"] - projected_predictive["detected_violations_count"])
    }

    return {
        "original_text": clean_text,
        "rewritten_text": rewritten_text,
        "preset": preset,
        "model_used": model_used,
        "ai_status": ai_status,
        "original_score": orig_score,
        "projected_score": proj_score,
        "score_boost": score_boost,
        "original_grade": original_predictive["grade"],
        "projected_grade": projected_predictive["grade"],
        "fixes_applied": fixes_applied,
        "diff_summary": diff_summary,
        "predictive_breakdown": projected_predictive
    }
