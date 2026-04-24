@echo off
TITLE Vigil-AI Sentinel Ecosystem
echo =========================================================
echo    Vigil-AI: Event-Driven Agentic AI Pipeline Orchestrator  
echo =========================================================
echo.
echo Launching services in dedicated terminals...
echo.

echo [1/3] Starting Machine Learning Backend (Port 8001)...
start "Vigil-AI Backend" cmd /k "cd /d c:\Users\ASUS\OneDrive\Desktop\insider && title Vigil-AI API [8001] && python -m uvicorn api.main:app --port 8001 --reload"

echo [2/3] Starting React Live Dashboard (Port 5173)...
start "Sentinel Dashboard" cmd /k "cd /d c:\Users\ASUS\OneDrive\Desktop\insider\frontend && title Sentinel Dashboard && npm run dev"

echo [3/3] Starting Autonomous Monitoring Agent (System Watchdog)...
start "Monitoring Agent" cmd /k "cd /d c:\Users\ASUS\OneDrive\Desktop\insider\endpoint_agent && title Endpoint File Monitor && python -m agent.agent"

echo.
echo SUCCESS: All 3 modules have been deployed natively.
echo.
echo - React Dashboard : http://localhost:5173
echo - Live API        : http://localhost:8001
echo.
echo You can safely close this orchestrator window. The services are running independently!
pause
