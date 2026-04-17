@echo off
setlocal

set "PROJECT_ROOT=%~dp0"
set "PYTHON_EXE=%PROJECT_ROOT%.venv_clean\Scripts\python.exe"

if not exist "%PYTHON_EXE%" (
  echo Missing backend Python runtime at ".venv_clean\Scripts\python.exe".
  echo Recreate it with:
  echo   python -m venv .venv_clean
  echo   .\.venv_clean\Scripts\python.exe -m pip install -r requirements.txt
  exit /b 1
)

cd /d "%PROJECT_ROOT%"
"%PYTHON_EXE%" -m uvicorn main:app --host 127.0.0.1 --port 8000
