# Known Limitations and Design Trade-Offs

This document transparently outlines the known architectural boundaries, technical trade-offs, and platform limitations of BrandGuard.

---

## 1. Hosting and Runtime Limitations

### 1.1 Render Free-Tier Cold Starts
- **Limitation**: When deployed on Render's free tier, the Python web service (`brandguard-api`) spins down after 15 minutes of inactivity. The initial incoming request incurs a 30–60 second delay while the container initializes.
- **Impact**: First-time visitors may experience a temporary delay.
- **Mitigation**: Once awake, subsequent requests respond in sub-second latency. For production enterprise deployments, upgrading to a paid Render Instance ($7/month) eliminates spin-downs entirely.

### 1.2 Image OCR Processing Limits
- **Limitation**: Optical Character Recognition on very high-resolution images (greater than 4000x4000 pixels or file size > 10MB) requires significant CPU and memory.
- **Impact**: Processing times on free-tier containers can reach 3–6 seconds.
- **Mitigation**: Client-side image downscaling prior to upload maintains OCR legibility while reducing processing overhead.

---

## 2. Storage and Database Trade-Offs

### 2.1 SQLite vs PostgreSQL Vector Search
- **Limitation**: In local development without PostgreSQL, BrandGuard falls back to SQLite and performs cosine similarity matching in Python memory.
- **Scalability Boundary**: SQLite vector matching performs well up to ~2,000 chunks (<10ms). Beyond 10,000 chunks, in-memory iteration causes perceptible latency.
- **Recommendation**: Enterprise deployments with large guideline libraries must use PostgreSQL with `pgvector` indexed via IVFFlat or HNSW.

---

## 3. Frontend & Browser Capabilities

### 3.1 Web Speech API Browser Support
- **Limitation**: The Voice Dictation studio utilizes the browser-native Web Speech API (`webkitSpeechRecognition`).
- **Compatibility**: Fully supported in Google Chrome, Microsoft Edge, Brave, and Safari. Mozilla Firefox currently lacks out-of-the-box support for the continuous Web Speech API and requires manual flag enablement or external audio transcription fallbacks.

### 3.2 Monolingual English Rule Engine
- **Limitation**: The current dictionary of banned terms (`backend/app/seed/glossary.json`), superlative regexes, and readability formulas are calibrated specifically for English corporate copy.
- **Future Scope**: Expansion into multilingual support (Hindi, Spanish, German) is scheduled for Q1 2027.

---

## 4. LLM API Rate Limits

- **Limitation**: Groq's free developer tier enforces Requests-Per-Minute (RPM) and Tokens-Per-Minute (TPM) quotas.
- **Resilience Strategy**: The review pipeline pre-screens drafts using the local deterministic engine first, passing only relevant chunks to Groq. If rate limits are encountered, BrandGuard returns deterministic findings and logs an informational alert without crashing.
