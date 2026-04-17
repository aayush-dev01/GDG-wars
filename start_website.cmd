@echo off
setlocal

set "ROOT=%~dp0"

echo Clearing old local dev servers on ports 5173, 5174, 5175, and 8000...
for %%P in (5173 5174 5175 8000) do (
  for /f "tokens=5" %%I in ('netstat -ano ^| findstr ":%%P " ^| findstr "LISTENING"') do (
    taskkill /PID %%I /F >nul 2>nul
  )
)

timeout /t 2 /nobreak >nul

echo Starting backend on http://127.0.0.1:8000
start "LegalEase Backend" cmd /k "cd /d "%ROOT%backend" && start_backend.cmd"

timeout /t 3 /nobreak >nul

echo Starting frontend on http://127.0.0.1:5173
start "LegalEase Frontend" cmd /k "cd /d "%ROOT%frontend" && npm run dev -- --host 127.0.0.1 --port 5173"

echo LegalEase is launching in two windows.
