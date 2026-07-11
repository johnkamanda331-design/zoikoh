@echo off
REM Start Both - Simplified with node
cd /d "%CD%"
echo Starting ZOIKO Bible Explorer...
echo.
echo Opening Backend on port 8080...
start cmd /k node -e "require('child_process').execSync('pnpm --filter @workspace/api-server run dev', { stdio: 'inherit' })"
timeout /t 3
echo.
echo Opening Frontend on port 24116...
start cmd /k node -e "require('child_process').execSync('pnpm --filter @workspace/bible-explorer run dev', { stdio: 'inherit' })"
echo.
echo Both servers should be starting...
echo - Frontend: http://localhost:24116
echo - Backend: http://localhost:8080
echo.
pause
