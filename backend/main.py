"""
LegalEase AI - India
FastAPI Backend Entry Point
"""

import os
import logging
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles

BASE_DIR = os.path.dirname(__file__)

# Load .env before anything else.
load_dotenv(os.path.join(BASE_DIR, ".env"))

logger = logging.getLogger(__name__)

from routers import analyze, report

GENERATED_REPORTS_DIR = os.getenv(
    "GENERATED_REPORTS_DIR",
    os.path.join(BASE_DIR, "generated_reports"),
)
DOCUMENT_UPLOADS_DIR = os.getenv(
    "DOCUMENT_UPLOADS_DIR",
    os.path.join(BASE_DIR, "uploaded_documents"),
)

gemini_api_key = os.getenv("GEMINI_API_KEY", "").strip()
if not gemini_api_key or gemini_api_key == "YOUR_GEMINI_API_KEY_HERE":
    logger.warning(
        "GEMINI_API_KEY is missing. /api/analyze will fall back to "
        "deterministic content, but the backend will continue to start."
    )


def _cors_origins() -> list[str]:
    configured = os.getenv("CORS_ORIGINS", "")
    origins = [origin.strip() for origin in configured.split(",") if origin.strip()]

    defaults = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
    frontend_url = os.getenv("FRONTEND_URL", "").rstrip("/")

    for origin in defaults:
        if origin not in origins:
            origins.append(origin)

    if frontend_url and frontend_url not in origins:
        origins.append(frontend_url)

    return origins


app = FastAPI(
    title="LegalEase AI - India",
    description="AI-powered legal compliance engine for Indian businesses",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Efficiency: Gzip Compression ─────────────────────────────────────────────
app.add_middleware(GZipMiddleware, minimum_size=1000)

# ── Security: Extra Security Headers ─────────────────────────────────────────
@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Content-Security-Policy"] = "default-src 'self' 'unsafe-inline' 'unsafe-eval' https://generativelanguage.googleapis.com https://fonts.googleapis.com https://fonts.gstatic.com data:;"
    return response

app.include_router(analyze.router, prefix="/api")
app.include_router(report.router, prefix="/api")

os.makedirs(GENERATED_REPORTS_DIR, exist_ok=True)
os.makedirs(DOCUMENT_UPLOADS_DIR, exist_ok=True)
app.mount("/reports", StaticFiles(directory=GENERATED_REPORTS_DIR), name="reports")
app.mount("/documents", StaticFiles(directory=DOCUMENT_UPLOADS_DIR), name="documents")


@app.get("/health")
def health():
    return {"status": "ok", "service": "LegalEase AI Backend"}
