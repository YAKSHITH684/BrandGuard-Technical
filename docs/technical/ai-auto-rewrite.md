# Technical Specification: AI Auto-Rewrite Engine

## 1. Architectural Purpose

In traditional content review systems, automated scanners flag violations but leave creators with vague rejection notes, forcing tedious manual revision cycles.

BrandGuard's **AI Auto-Rewrite Engine** (`backend/app/services/auto_rewrite.py`) automatically synthesizes intent-preserving, compliant revisions of flagged drafts. The engine resolves every cited guideline violation while maintaining the author's original voice, marketing angle, and narrative flow.

```
+--------------------------------------------------------------------------+
|                       Original Draft & Active Findings                   |
+------------------------------------+-------------------------------------+
                                     |
                                     v
+--------------------------------------------------------------------------+
|                  AutoRewrite Service (Constraint Synthesizer)            |
|   1. Extracts all pending findings, flagged spans, and rule citations    |
|   2. Formulates guided rewrite prompt with negative constraints          |
|   3. Passes prompt to Groq (llama-3.3-70b-versatile)                     |
+------------------------------------+-------------------------------------+
                                     |
                                     v
+--------------------------------------------------------------------------+
|                  Dual-Path Generation & Fallback Heuristics              |
|   - Primary: LLM structured rewrite with tone preservation               |
|   - Fallback: Local deterministic regex substitution                     |
+------------------------------------+-------------------------------------+
                                     |
                                     v
+--------------------------------------------------------------------------+
|                  Diff Synthesis & Side-by-Side Presentation              |
|   Computes character/word-level diff for AutoRewriteModal in Next.js UI  |
+--------------------------------------------------------------------------+
```

---

## 2. Prompt Engineering and Tone Preservation

The prompt instructs the LLM to act as a **Precision Brand Copywriter**:

### 2.1 Constraint Instructions
- **Intent Preservation**: Retain the original draft's technical intent, product features, and target audience tone.
- **Surgical Substitution**: Resolve only the specific violations cited in the findings list without unnecessary rewrites of compliant sentences.
- **No Hallucinated Claims**: Never introduce new performance figures, unverified benchmark claims, or additional superlatives.
- **Factual Alignment**: Replace outdated claims (e.g. legacy SLAs) with verified figures from the active fact-sheet chunk.

### 2.2 System Prompt Excerpt
```
You are BrandGuard's Precision Copywriting Assistant.
Rewrite the provided draft to eliminate all listed brand and legal violations while:
1. Retaining the creator's voice, key points, and audience style.
2. Replacing banned terms with approved alternatives.
3. Grounding unverified claims in approved fact-sheet excerpts.
4. Strictly avoiding new superlatives or ungrounded absolute guarantees.
Return a structured JSON object containing 'rewritten_text' and 'changes_summary'.
```

---

## 3. Fallback Heuristic Replacement Engine

If cloud LLM access is unavailable or offline, `auto_rewrite.py` automatically activates a **deterministic regex replacement fallback**:
1. Traverses all active findings ordered by text span offset.
2. For findings with a predefined `suggested_rewrite` (e.g. from `glossary.json` or rule patterns):
   - Replaces occurrences of `flagged_text` with `suggested_rewrite`.
3. Preserves remaining draft copy identically.
4. Generates an informational note indicating that deterministic replacement was applied.

---

## 4. Frontend Diff Viewer Integration

The rewritten text is delivered to `frontend/src/components/AutoRewriteModal/AutoRewriteModal.jsx`:
- Computes inline additions (green highlights) and deletions (red strikethroughs).
- Provides creators with one-click actions:
  - **Apply Revision**: Updates the draft and creates a new historical `DraftVersion`.
  - **Edit Manually**: Transfers the revision to the draft editor for further refinement.
  - **Decline**: Keeps the existing draft unchanged.
