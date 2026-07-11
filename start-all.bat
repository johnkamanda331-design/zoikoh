@echo off
REM Start both Backend and Frontend on Windows
echo Starting ZOIKO Bible Explorer...
echo.
echo Opening Backend API Server on port 8080...
start powershell -ExecutionPolicy Bypass -Command "cd '%CD%' && pnpm --filter @workspace/api-server run dev"
timeout /t 3
echo.
echo Opening Frontend React App on port 24116...
start powershell -ExecutionPolicy Bypass -Command "cd '%CD%' && pnpm --filter @workspace/bible-explorer run dev"
echo.
echo Both servers started!
echo - Frontend: http://localhost:24116
echo - Backend: http://localhost:8080
echo.
pause
