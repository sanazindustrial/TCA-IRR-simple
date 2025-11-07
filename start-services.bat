@echo off
echo Starting TCA-IRR Application Services...
echo.

echo Starting Backend (FastAPI)...
start "TCA-IRR Backend" cmd /k "cd /d %~dp0 && py main.py"

timeout /t 5

echo Starting Frontend (Next.js)...  
start "TCA-IRR Frontend" cmd /k "cd /d %~dp0 && npm run dev"

echo.
echo Services are starting...
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
echo.
echo Check the opened windows for logs and status.
pause