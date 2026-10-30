# Developer Onboarding Guide

Welcome to the **BrandGuard** engineering team! This guide helps new contributors understand the architecture, configure local tooling, and make their first successful contribution.

---

## 1. Day-One Setup Checklist

Complete the following steps on your first day:
- [ ] Clone the repository: `git clone https://github.com/YAKSHITH684/BrandGuard-Technical.git`
- [ ] Install Python 3.12 and create a virtual environment (`python -m venv venv`).
- [ ] Install backend dependencies: `pip install -r requirements.txt`.
- [ ] Install Node.js 18+ and frontend dependencies: `npm install` inside `frontend/`.
- [ ] Launch both servers using `start.bat` (Windows) or separate terminal sessions.
- [ ] Verify the backend Swagger UI loads at `http://localhost:8000/docs`.
- [ ] Verify the frontend UI renders at `http://localhost:3000`.
- [ ] Run the test suite: `python test_suite.py` inside `backend/` and verify all tests pass.

---

## 2. Recommended Developer Tooling

### VS Code Extensions
- **Python** & **Pylance**: IntelliSense, type checking, and auto-import support.
- **Tailwind CSS IntelliSense**: Autocomplete and hover previews for Tailwind classes.
- **SQLite Viewer**: Instant inspection of `backend/brandguard.db` tables.
- **REST Client / Thunder Client**: Quick API testing inside the editor.

---

## 3. Core Architectural Concepts Every Developer Must Know

1. **Deterministic Rule Primacy**:
   - Always prefer deterministic, rule-based checks for patterns with clear boundaries (banned words, regexes, contrast math, syllable counts).
   - Reserve LLM inference for nuanced tasks: tone evaluation, intent-preserving rewrites, and semantic claim grounding.
2. **Strict Grounding Contract**:
   - Never allow the LLM to output ungrounded rules or hallucinations.
   - All AI findings must map back to an explicit `source_chunk_id` stored in the database.
3. **Zero-Leak Privacy Boundary**:
   - Never send raw user drafts to external cloud APIs without running `redaction.py` first.
4. **Dual-Dialect Storage**:
   - All database migrations or ORM model changes must maintain compatibility with both **PostgreSQL (pgvector)** and the **SQLite fallback**.

---

## 4. Making Your First Contribution

### Step 1: Create a Feature Branch
```bash
git checkout -b feat/your-feature-name
```

### Step 2: Implement Your Changes
Follow coding conventions:
- Backend: Follow PEP 8 guidelines and type hint all function arguments.
- Frontend: Create modular React components with Tailwind utility classes.

### Step 3: Run Verification
```bash
# Backend tests
cd backend
python test_suite.py
python test_multimodal_logic.py

# Frontend build verification
cd ../frontend
npm run build
```

### Step 4: Commit with Conventional Commits
```bash
git commit -m "feat: add support for custom guideline chunk tags"
```

---

## 5. Getting Help & Escalation

- **Technical Architecture Questions**: Consult [docs/architecture.md](architecture.md).
- **API Questions**: Consult [docs/api-usage.md](api-usage.md) and interactive Swagger docs (`/docs`).
- **Reporting Issues**: Submit an issue via GitHub using the structured templates.
