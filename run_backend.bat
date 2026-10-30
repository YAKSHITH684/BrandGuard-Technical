@echo off
setlocal enabledelayedexpansion
echo ========================================================
echo Starting BrandGuard FastAPI Backend Server...
echo ========================================================
cd /d "%~dp0backend"
set PYTHONPATH=%CD%

:: Auto-detect Python binary (prefer 'python', fallback to 'py' or explicit local path)
set "PYTHON_CMD="

python --version >nul 2>&1
if not errorlevel 1 (
    set "PYTHON_CMD=python"
) else (
    py --version >nul 2>&1
    if not errorlevel 1 (
        set "PYTHON_CMD=py"
    ) else if exist "%LOCALAPPDATA%\Programs\Python\Python312\python.exe" (
        set "PYTHON_CMD=%LOCALAPPDATA%\Programs\Python\Python312\python.exe"
    ) else if exist "%LOCALAPPDATA%\Programs\Python\Python311\python.exe" (
        set "PYTHON_CMD=%LOCALAPPDATA%\Programs\Python\Python311\python.exe"
    ) else if exist "C:\Python312\python.exe" (
        set "PYTHON_CMD=C:\Python312\python.exe"
    ) else (
        echo [ERROR] Python 3.10+ executable not found in PATH or standard directories.
        echo Please ensure Python is installed and added to your PATH environment variable.
        pause
        exit /b 1
    )
)

echo [OK] Using Python: %PYTHON_CMD%
echo [OK] Backend URL: http://localhost:8000
echo [OK] API Docs:    http://localhost:8000/docs
echo [OK] Health Check: http://localhost:8000/health
echo ========================================================
"%PYTHON_CMD%" -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
pause
