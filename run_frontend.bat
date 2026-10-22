@echo off
echo ========================================================
echo Starting BrandGuard Next.js Frontend Server...
echo ========================================================
set PATH=C:\Users\yaksh\.tools\nodejs;%PATH%
cd /d "%~dp0frontend"
npm run dev
pause
