@echo off
echo ========================================================
echo Starting BrandGuard FastAPI Backend Server...
echo ========================================================
cd /d "%~dp0backend"
set PYTHONPATH=%CD%
py -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
pause
