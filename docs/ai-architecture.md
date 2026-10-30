# AI Architecture and Groq LLM Integration

## 1. Inference Engine Overview

BrandGuard utilizes **Groq** cloud infrastructure running `llama-3.3-70b-versatile` to provide ultra-fast, deterministic brand and legal reviews. By running inference on Groq's Language Processing Units (LPUs), review generation that traditionally requires 15–30 seconds completes in sub-second latency (typically 400–800ms).

```
+--------------------------------------------------------------------------+
|                       Draft Inspection Pipeline                          |
+------------------------------------+-------------------------------------+
                                     |
                                     v
+--------------------------------------------------------------------------+
|                  Step 1: Deterministic Pre-Filtering                     |
|   Executes local regex & checks (banned terms, readability, WCAG contrast)|
+------------------------------------+-------------------------------------+
                                     |
                                     v
+--------------------------------------------------------------------------+
|                  Step 2: Vector Semantic Retrieval                       |
|   Retrieves top-k guideline & fact-sheet chunks via cosine similarity     |
+------------------------------------+-------------------------------------+
                                     |
                                     v
+--------------------------------------------------------------------------+
|                  Step 3: Groq LPU Structured Inference                   |
|   Model: llama-3.3-70b-versatile                                         |
|   Mode: response_format={"type": "json_object"}                          |
|   Temperature: 0.1 (strict, reproducible output)                         |
+------------------------------------+-------------------------------------+
                                     |
                                     v
+--------------------------------------------------------------------------+
|                  Step 4: Schema Validation & Synthesis                   |
|   Validates chunk citations against database source_chunks table         |
+--------------------------------------------------------------------------+
```

---

## 2. Structured Output Enforcement

LLM hallucination or unpredictable markdown formatting is prevented by forcing structured JSON outputs:
- **API Parameter**: `response_format={"type": "json_object"}`.
- **Pydantic Validation**: Responses are parsed directly into `ReviewResponseSchema` and `FindingSchema` models.
- **Strict Chunk Citation**: The LLM prompt strictly requires every finding to reference an exact `source_chunk_id` supplied in the context. Findings citing non-existent chunks are automatically discarded during synthesis.

### JSON Output Contract
```json
{
  "summary": "Draft contains 1 competitor disparagement and 1 ungrounded superlative.",
  "overall_verdict": "CHANGES_REQUESTED",
  "findings": [
    {
      "rule_name": "Prohibited Superlative",
      "severity": "HIGH",
      "flagged_text": "world's best",
      "suggested_rewrite": "industry-leading",
      "source_chunk_id": "chk_guideline_sec3",
      "explanation": "Claims Policy 3.2 prohibits 'world's best' without independent audit citation.",
      "confidence": 0.96
    }
  ]
}
```

---

## 3. Prompt Engineering and Guardrails (`backend/app/ai/prompts.py`)

1. **System Prompt Isolation**: The system prompt establishes the persona of a senior enterprise compliance officer and corporate legal counsel.
2. **Context Bounding**: Ingested guidelines and fact-sheet excerpts are injected into XML-style delimited tags:
   ```xml
   <approved_guidelines>
     <chunk id="chk_guideline_sec2">...</chunk>
     <chunk id="chk_guideline_sec3">...</chunk>
   </approved_guidelines>
   ```
3. **Negative Constraint Instructions**:
   - *"Do NOT flag subjective stylistic preferences if they do not violate an explicitly provided guideline chunk."*
   - *"Do NOT invent rule citations or chunk identifiers."*
   - *"If the draft fully satisfies all approved guidelines, return an empty findings list."*

---

## 4. Token Optimization and Cost Efficiency

- **Dynamic Chunk Pruning**: Instead of sending entire 50-page brand books with every prompt, BrandGuard queries the vector index to retrieve only the top 3–5 most semantically relevant chunks (typically under 1,200 tokens total context).
- **Deterministic Pre-Screening**: Straightforward keyword matches (e.g., deprecated names like "HyperSync") are resolved locally before LLM dispatch, allowing the LLM to focus on nuanced tone, superlative claims, and date-bounded fact verification.
