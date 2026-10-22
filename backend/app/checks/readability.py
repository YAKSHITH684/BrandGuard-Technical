import re
from typing import Dict, Any, List

def count_syllables_in_word(word: str) -> int:
    word = word.lower().strip(".,!?:;\"'()[]{}")
    if not word:
        return 0
    if len(word) <= 3:
        return 1
    # Count vowel sequences
    vowels = "aeiouy"
    count = 0
    prev_is_vowel = False
    for char in word:
        is_vowel = char in vowels
        if is_vowel and not prev_is_vowel:
            count += 1
        prev_is_vowel = is_vowel
    # Adjust for silent e
    if word.endswith("e") and not word.endswith("le") and count > 1:
        count -= 1
    return max(1, count)

def calculate_readability(text: str, target_ease: float = 60.0) -> Dict[str, Any]:
    text_clean = text.strip()
    if not text_clean:
        return {
            "flesch_reading_ease": 100.0,
            "flesch_kincaid_grade": 0.0,
            "word_count": 0,
            "sentence_count": 0,
            "syllable_count": 0,
            "reading_level": "N/A",
            "target_ease": target_ease,
            "passes_target": True
        }

    sentences = re.split(r"[.!?]+(?:\s+|$)", text_clean)
    sentences = [s.strip() for s in sentences if s.strip()]
    sentence_count = max(1, len(sentences))

    words = re.findall(r"\b[a-zA-Z0-9'-]+\b", text_clean)
    word_count = max(1, len(words))

    syllable_count = sum(count_syllables_in_word(w) for w in words)

    # Standard Flesch Reading Ease Formula
    words_per_sentence = word_count / sentence_count
    syllables_per_word = syllable_count / word_count

    reading_ease = 206.835 - (1.015 * words_per_sentence) - (84.6 * syllables_per_word)
    reading_ease = max(0.0, min(100.0, round(reading_ease, 1)))

    # Flesch-Kincaid Grade Level
    grade_level = (0.39 * words_per_sentence) + (11.8 * syllables_per_word) - 15.59
    grade_level = max(0.0, round(grade_level, 1))

    # Level classification
    if reading_ease >= 80:
        level = "Very Easy / Conversational"
    elif reading_ease >= 60:
        level = "Standard / Plain English"
    elif reading_ease >= 50:
        level = "Fairly Difficult"
    elif reading_ease >= 30:
        level = "Difficult / College Level"
    else:
        level = "Very Confusing / Academic"

    return {
        "flesch_reading_ease": reading_ease,
        "flesch_kincaid_grade": grade_level,
        "word_count": word_count,
        "sentence_count": sentence_count,
        "syllable_count": syllable_count,
        "reading_level": level,
        "target_ease": target_ease,
        "passes_target": reading_ease >= target_ease
    }

def check_readability_findings(content: str, target_ease: float = 60.0) -> List[Dict[str, Any]]:
    stats = calculate_readability(content, target_ease)
    findings = []
    
    if not stats["passes_target"] and stats["word_count"] > 20:
        findings.append({
            "category": "tone",
            "severity": "medium",
            "span_start": 0,
            "span_end": min(len(content), 100),
            "span_text": content[:100] + ("..." if len(content) > 100 else ""),
            "rule": f"Tone & Readability Policy: Target Ease {target_ease} (Current: {stats['flesch_reading_ease']})",
            "source_chunk_id": None,
            "source_excerpt": f"Brand tone requires accessible copy (target Flesch Reading Ease >= {target_ease}). Current grade level is {stats['flesch_kincaid_grade']}.",
            "confidence": "high",
            "claim_label": None,
            "suggested_rewrite": "Shorten long sentences, break compound clauses into separate bullet points, and choose plain conversational vocabulary.",
            "origin": "deterministic",
            "ai_disclosure": {
                "model": "flesch-kincaid-calculator",
                "provider": "BrandGuard Deterministic",
                "redaction_applied": False
            }
        })
        
    return findings
