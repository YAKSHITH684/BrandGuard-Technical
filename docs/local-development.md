# Local Development Workflow Guide

## 1. Fast Start Options

### Option A: One-Click Windows Launcher
In the repository root, execute `start.bat`:
```cmd
start.bat
```
This batch script automatically launches two independent console windows:
1. **Backend Server**: Activates Python, checks dependencies, and launches Uvicorn on `http://localhost:8000`.
2. **Frontend Server**: Launches Next.js dev server on `http://localhost:3000`.

### Option B: Manual Multi-Terminal Workflow

**Terminal 1 — Backend API**:
```bash
cd backend
# Activate virtual environment if applicable
py -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Terminal 2 — Frontend Application**:
```bash
cd frontend
npm run dev
```

---

## 2. Ports and Endpoints

| Service | Address | Description |
|---|---|---|
| **Frontend Web App** | `http://localhost:3000` | Next.js development server with hot-module reloading |
| **Backend REST API** | `http://localhost:8000` | FastAPI server with auto-reload enabled |
| **Interactive Docs** | `http://localhost:8000/docs` | Swagger UI for testing API endpoints |
| **Alternative Docs** | `http://localhost:8000/redoc` | ReDoc formatted API specifications |

---

## 3. Database Management & Seeding

BrandGuard is engineered with a **local-first philosophy**:
- If `DATABASE_URL` is omitted, backend automatically initializes a local SQLite file database at `backend/brandguard.db`.
- On initial startup, the `main.py` lifespan handler detects whether default guidelines, fact sheets, and demo personas exist. If empty, it executes `seed_data.py` automatically.

### Resetting the Local Database
To restore the database to a clean, pre-seeded state:
```bash
cd backend
rm brandguard.db
# Restart uvicorn server - tables and seed data are recreated automatically
```

---

## 4. Persona Switching and RBAC Testing

BrandGuard includes a one-click persona switcher on the landing page (`http://localhost:3000`) and in the top navigation bar:
- **Alex Vance (`creator@brandguard.io`)**: Test draft submission, real-time finding cards, and accepting/disputing AI rewrites.
- **Elena Rostova (`manager@brandguard.io`)**: Test guideline uploads, standard approval queues, and insights charts.
- **Marcus Sterling (`reviewer@brandguard.io`)**: Test legal review gating, fact-sheet claim validation, and audit log exports.

Switching personas clears the local JWT token and immediately re-authenticates as the selected role without requiring password entry.

---

## 5. Development Tips and Debugging

1. **Uvicorn Hot Reload**: Code changes in `backend/app/` automatically trigger server reload. Inspect the terminal log for syntax or runtime tracebacks.
2. **Next.js Fast Refresh**: Edits in `frontend/src/` update the browser state immediately without full page reload.
3. **Inspecting Database Records**: Use any standard SQLite viewer (such as DB Browser for SQLite or VS Code SQLite extension) to inspect `backend/brandguard.db`.
4. **Mocking Groq Inference**: If you are working offline or without a Groq API key, leave `GROQ_API_KEY` empty in `.env`. The backend pipeline automatically switches to heuristic rule evaluation.
