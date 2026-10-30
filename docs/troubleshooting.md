# Troubleshooting and Diagnostics Guide

## 1. Quick Diagnostic Checklist

If you encounter unexpected behavior, run through this quick checklist:
- [ ] Is Python 3.12+ and Node.js 18+ active?
- [ ] Is the backend running on `http://localhost:8000`?
- [ ] Is the frontend running on `http://localhost:3000`?
- [ ] Does `http://localhost:8000/docs` load in your browser?
- [ ] Are environment variables set correctly in `.env`?

---

## 2. Common Issues and Resolutions

### 2.1 Backend Takes 30–60 Seconds to Respond on Render
- **Symptom**: The first request to `brandguard-api.onrender.com` hangs or times out with a 502/504 error.
- **Cause**: Render's free tier spins down web services after 15 minutes of inactivity.
- **Resolution**:
  - Open `https://brandguard-api.onrender.com/docs` in your browser to wake the service.
  - Wait for the Swagger UI to appear (confirming the instance has spun up).
  - Refresh the frontend web application. Subsequent requests will respond in milliseconds.

### 2.2 Cross-Origin Resource Sharing (CORS) Block
- **Symptom**: Browser console logs `Access to fetch at ... from origin ... has been blocked by CORS policy`.
- **Cause**: The `FRONTEND_URL` environment variable on the backend does not match the frontend origin, or includes trailing slashes.
- **Resolution**:
  - In `backend/.env` or Render environment settings, verify `FRONTEND_URL`.
  - For local dev: `FRONTEND_URL=http://localhost:3000` (ensure no trailing `/`).
  - For production: `FRONTEND_URL=https://brandguard-web.onrender.com`.

### 2.3 Database Fallback from PostgreSQL to SQLite
- **Symptom**: Log shows `PostgreSQL connection failed, falling back to SQLite`.
- **Cause**: `DATABASE_URL` is either empty or points to an unreachable PostgreSQL host.
- **Resolution**:
  - This is expected behavior during local development. BrandGuard automatically creates `brandguard.db` in SQLite format and continues running normally.
  - For production, ensure your Render managed PostgreSQL internal database URL is set in the `DATABASE_URL` environment variable.

### 2.4 Groq API Rate Limiting or Missing Key
- **Symptom**: Review findings return rule-based checks only, without LLM synthesis.
- **Cause**: `GROQ_API_KEY` is not defined or the account has exceeded Groq's free tier rate limit (TPM/RPM).
- **Resolution**:
  - Check your Groq console at [console.groq.com](https://console.groq.com) for quota status.
  - The deterministic rule engine (banned words, claim checks, readability, WCAG contrast) will continue functioning normally even if Groq is unavailable.

### 2.5 Tesseract OCR Not Found Error
- **Symptom**: Uploading an image returns `TesseractNotFoundError` or fails to extract text.
- **Cause**: Tesseract executable is not installed on the system path.
- **Resolution**:
  - Follow the installation steps in [docs/installation.md](installation.md#5-optional-ocr-engine-installation).
  - On Windows, ensure `C:\Program Files\Tesseract-OCR` is added to your system `PATH`.
  - If OCR is unavailable, use standard text submission in the Drafts studio.

### 2.6 Local Port Conflicts (Port 8000 or 3000 in Use)
- **Symptom**: `OSError: [Errno 10048] error while attempting to bind on address ('0.0.0.0', 8000)`.
- **Cause**: Another process or background terminal is already using port 8000 or 3000.
- **Resolution**:
  - Find and terminate the process holding the port:
    ```powershell
    # Windows
    Get-Process -Id (Get-NetTCPConnection -LocalPort 8000).OwningProcess | Stop-Process
    ```
  - Or run the server on an alternate port:
    ```bash
    py -m uvicorn app.main:app --host 0.0.0.0 --port 8080 --reload
    ```

### 2.7 Anti-FOUC Theme Flickering
- **Symptom**: Screen briefly flashes white before switching to dark mode on initial page load.
- **Cause**: Local storage theme check was executing after initial DOM paint.
- **Resolution**:
  - BrandGuard includes an inline anti-FOUC script inside `_document.js` that checks `localStorage.theme` prior to rendering CSS classes, preventing visual flashing.
