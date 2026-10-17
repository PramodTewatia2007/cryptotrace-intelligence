@echo off
title CryptoTrace Intelligence - Law Enforcement System
color 0b
echo ===============================================================================
echo                CRYPTOTRACE INTELLIGENCE FORENSIC SYSTEM
echo        Real-Time Crypto Fraud Attribution & Law Enforcement Platform
echo ===============================================================================
echo.
echo [1/3] Initializing environment and verifying paths...

set PROJECT_DIR=%~dp0
set VENV_PYTHON=%PROJECT_DIR%backend\venv\Scripts\python.exe

if not exist "%VENV_PYTHON%" (
    echo [ERROR] Virtual environment python not found at: %VENV_PYTHON%
    pause
    exit /b 1
)

echo [2/3] Starting backend intelligence engine & embedded web application...
cd /d "%PROJECT_DIR%backend"
set PYTHONPATH=%PROJECT_DIR%backend

echo [3/3] Opening CryptoTrace Intelligence Web Console at http://127.0.0.1:8000 ...
start "" http://127.0.0.1:8000

echo.
echo ===============================================================================
echo   System running on: http://127.0.0.1:8000
echo   OpenAPI Swagger Docs: http://127.0.0.1:8000/docs
echo.
echo   Press CTRL+C in this console window to stop the application.
echo ===============================================================================
echo.

"%VENV_PYTHON%" launcher.py
pause
