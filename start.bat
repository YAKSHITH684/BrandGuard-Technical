@echo off
echo ========================================================
echo Launching BrandGuard Full-Stack Platform...
echo ========================================================
start "BrandGuard Backend (FastAPI)" cmd /c "%~dp0run_backend.bat"
start "BrandGuard Frontend (Next.js)" cmd /c "%~dp0run_frontend.bat"
echo Servers launched!
echo Backend:  http://localhost:8000
echo API Docs: http://localhost:8000/docs
echo Frontend: http://localhost:3000
