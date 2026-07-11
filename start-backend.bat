@echo off
REM Start Backend API Server on Windows
powershell -ExecutionPolicy Bypass -Command "cd '%CD%' && pnpm --filter @workspace/api-server run dev"
