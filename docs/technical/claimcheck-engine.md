# Technical Specification: ClaimCheck Engine

## 1. Engine Purpose and Pipeline

The **ClaimCheck Engine** (`backend/app/ai/claimcheck.py`) automates the detection, semantic alignment, and temporal validation of quantitative claims, performance benchmarks, and corporate assertions.

```
[Draft Copy / OCR Extracted Text]
               │
               ▼
┌─────────────────────────────────┐
│ Claim Pattern Extractor         │  ── (Regex for numbers, %, SLAs, throughput, benchmarks)
└──────────────┬──────────────────┘
               ▼
┌─────────────────────────────────┐
│ Vector Embedding of Candidate   │  ── (Transforms claim into 384-dim dense representation)
└──────────────┬──────────────────┘
               ▼
┌─────────────────────────────────┐
│ Fact-Sheet Cosine Search        │  ── (Retrieves candidate chunks from active knowledge base)
└──────────────┬──────────────────┘
               ▼
┌─────────────────────────────────┐
│ Temporal Boundary Evaluator     │  ── (Evaluates effective_date vs expiry_date against current date)
└──────────────┬──────────────────┘
               ▼
┌─────────────────────────────────┐
│ Three-Tier Classification &     │  ── (Assigns Supported / Outdated / Unsupported + Confidence)
│ Finding Generation              │
└─────────────────────────────────┘
```

---

## 2. Claim Pattern Extraction (`backend/app/checks/claim_patterns.py`)

Candidate assertions are identified through combined regex and entity patterns:
- **SLA & Uptime Guarantees**: `\b\d{2}(?:\.\d{1,3})?%\s*(?:uptime|availability|sla)\b`
- **Throughput & Event Rates**: `\b\d+(?:\.\d+)?\s*(?:million|billion|k|m)\s*(?:events|ops|tx|requests)\s*(?:per\s*second|\/s|sec)\b`
- **Latency & Speed**: `\b\d+(?:\.\d+)?\s*(?:ms|milliseconds|microseconds|seconds)\s*(?:p95|p99|latency|response\s*time)\b`
- **Comparative Percentages**: `\b\d+(?:\.\d+)?%\s*(?:faster|more\s*efficient|lower\s*cost|reduction|improvement)\b`
- **Compliance Certifications**: `\b(?:SOC\s*2(?:\s*Type\s*II)?|ISO\s*27001|HIPAA|GDPR|PCI-DSS)\b`

---

## 3. Semantic Alignment & Temporal Boundaries

For each candidate claim string $C$:
1. Compute dense vector embedding $\vec{e}_C$.
2. Retrieve top matching chunk $K$ from the fact-sheet repository where similarity $S = \cos(\vec{e}_C, \vec{e}_K)$.
3. Evaluate temporal dates:
   ```python
   is_active = (chunk.effective_date <= current_date) and (chunk.expiry_date is None or current_date <= chunk.expiry_date)
   is_expired = (chunk.expiry_date is not None and current_date > chunk.expiry_date)
   ```

### 3.1 Classification Decision Tree
```python
if similarity >= CONFIDENCE_THRESHOLD:
    if is_active:
        verdict = "Supported"
        severity = "INFO"
    elif is_expired:
        verdict = "Outdated"
        severity = "HIGH"
        suggested_rewrite = active_chunk_replacement
else:
    verdict = "Unsupported"
    severity = "CRITICAL"
    suggested_rewrite = None  # Requires legal review sign-off
```

---

## 4. Integration with Legal Review Queue

Findings classified as `Unsupported` or `Outdated` trigger a workflow lock:
- The draft cannot transition to `APPROVED` through standard Brand Manager sign-off.
- The draft is routed to the gated **Legal Review Queue** (`/reviews`), requiring Marcus Sterling's role credentials to override or sign off on the assertion.
