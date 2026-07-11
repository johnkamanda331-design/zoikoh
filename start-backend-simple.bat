@echo off
REM Start Backend - Simplified with node
cd /d "%CD%"
echo Starting ZOIKO Bible Explorer Backend on port 8080...
echo.
node -e "require('child_process').execSync('pnpm --filter @workspace/api-server run dev', { stdio: 'inherit' })"
pause
