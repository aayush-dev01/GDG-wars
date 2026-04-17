$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$python = Join-Path $projectRoot ".venv_clean\Scripts\python.exe"

if (-not (Test-Path $python)) {
    Write-Error "Missing backend Python runtime at '.venv_clean\Scripts\python.exe'. Recreate it with: python -m venv .venv_clean; .\.venv_clean\Scripts\python.exe -m pip install -r requirements.txt"
}

Set-Location $projectRoot
& $python -m uvicorn main:app --host 127.0.0.1 --port 8000
