from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import init_db
from app.routers import auth, sources, drafts, findings, reviews, checks, insights, audit, chatbot

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Explainable Pre-Publish Brand Governance Platform"
)

# CORS setup
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    settings.FRONTEND_URL
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"^https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup hook to initialize DB tables and seed demo personas
@app.on_event("startup")
def on_startup():
    print("[STARTUP] Initializing DB...", flush=True)
    init_db()
    print("[STARTUP] DB initialized.", flush=True)
    try:
        from app.seed.populate_demo_cases import ensure_seed_data
        print("[STARTUP] Ensuring seed data...", flush=True)
        ensure_seed_data()
        print("[STARTUP] Seed data ensured.", flush=True)
    except Exception as e:
        print(f"[Warning] Seeding skipped or encountered error: {e}", flush=True)

# Health heartbeat & root status
@app.get("/")
@app.get("/health")
@app.get("/api/health")
def health_check():
    key = settings.GROQ_API_KEY or ""
    masked_key = ""
    if key:
        masked_key = f"{key[:8]}...{key[-4:]}" if len(key) > 12 else "configured"
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "groq_configured": bool(settings.GROQ_API_KEY),
        "groq_key_preview": masked_key
    }

# Include all routers under both /api and root ("") so requests work with or without /api prefix
all_routers = [
    auth.router,
    sources.router,
    drafts.router,
    findings.router,
    reviews.router,
    checks.router,
    insights.router,
    audit.router,
    chatbot.router
]

for router in all_routers:
    app.include_router(router, prefix=settings.API_V1_STR)
    app.include_router(router, prefix="")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
