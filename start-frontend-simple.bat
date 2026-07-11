@echo off
REM Start Frontend - Simplified with node
cd /d "%CD%"
echo Starting ZOIKO Bible Explorer Frontend on port 24116...
echo.
node -e "require('child_process').execSync('pnpm --filter @workspace/bible-explorer run dev', { stdio: 'inherit' })"
pause
