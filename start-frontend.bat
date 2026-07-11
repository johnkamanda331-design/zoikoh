@echo off
REM Start Frontend React App on Windows
powershell -ExecutionPolicy Bypass -Command "cd '%CD%' && pnpm --filter @workspace/bible-explorer run dev"
