"""
LegalEase AI – /api/analyze Router
Orchestrates: Rule Engine → Risk Engine → AI Enrichment → PDF → Storage → Email
"""

import uuid, os, time, logging
import threading
from collections import defaultdict
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse
from models.schemas import AnalyzeRequest, AnalyzeResponse, ScoreDetail
from engines.rule_engine import detect_category, get_applicable_licenses, get_state_notes, calculate_compliance_complexity
from engines.risk_engine import calculate_risk_score, calculate_feasibility_score
from services.ai_service import enrich_with_ai, GeminiQuotaExceededError
from services.pdf_service import generate_pdf
from services.storage_service import save_report
from services.workspace_service import ensure_workspace_seeded
from services.email_service import send_report_email
from services.gcs_service import upload_to_gcs

logger = logging.getLogger(__name__)

router = APIRouter()

BACKEND_DIR = os.path.dirname(os.path.dirname(__file__))
BASE_URL     = os.getenv("BASE_URL", "http://localhost:8000")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
_configured_reports_dir = os.getenv("GENERATED_REPORTS_DIR", "generated_reports")
GENERATED_REPORTS_DIR = (
    _configured_reports_dir
    if os.path.isabs(_configured_reports_dir)
    else os.path.join(BACKEND_DIR, _configured_reports_dir)
)


def _resolve_runtime_urls(request: Request) -> tuple[str, str]:
    """Prefer local request/origin URLs during local runs; otherwise fall back to env."""
    request_base = str(request.base_url).rstrip("/")
    origin = (request.headers.get("origin") or "").rstrip("/")

    if "127.0.0.1" in request_base or "localhost" in request_base:
        base_url = request_base
    else:
        base_url = BASE_URL.rstrip("/")

    if origin and ("127.0.0.1" in origin or "localhost" in origin):
        frontend_url = origin
    elif "127.0.0.1" in request_base or "localhost" in request_base:
        frontend_url = "http://127.0.0.1:5173"
    else:
        frontend_url = FRONTEND_URL.rstrip("/")

    return base_url, frontend_url

# ── Simple in-memory rate limiter ─────────────────────────────────────────────
# Limits each IP to MAX_REQUESTS analyses per WINDOW_SECONDS
MAX_REQUESTS    = int(os.getenv("RATE_LIMIT_MAX", "5"))
WINDOW_SECONDS  = int(os.getenv("RATE_LIMIT_WINDOW", "3600"))  # 1 hour
_rate_store: dict = defaultdict(list)   # ip -> [timestamp, ...]

def _check_rate_limit(ip: str):
    now = time.time()
    window_start = now - WINDOW_SECONDS
    # Drop old entries
    _rate_store[ip] = [t for t in _rate_store[ip] if t > window_start]
    if len(_rate_store[ip]) >= MAX_REQUESTS:
        raise HTTPException(
            status_code=429,
            detail=f"Rate limit exceeded. Maximum {MAX_REQUESTS} analyses per hour per IP. Try again later."
        )
    _rate_store[ip].append(now)


def _send_report_email_background(
    to_email: str,
    report_id: str,
    business_name: str,
    pdf_path: str,
):
    logger.info(f"Background email send started for report {report_id} to {to_email}")
    try:
        sent = send_report_email(
            to_email=to_email,
            report_id=report_id,
            business_name=business_name,
            pdf_path=pdf_path,
        )
        logger.info(f"Background email send finished for report {report_id}: sent={sent}")
    except Exception as e:
        logger.warning(f"Email background send warning: {e}")


def score_label(score: int, type_: str) -> str:
    if type_ == "risk":
        if score <= 30: return "Low Risk"
        if score <= 60: return "Medium Risk"
        return "High Risk"
    if type_ == "complexity":
        if score <= 30: return "Simple"
        if score <= 60: return "Moderate"
        return "Complex"
    if score >= 70: return "Viable"
    if score >= 45: return "Moderate"
    return "Challenging"


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze(req: AnalyzeRequest, request: Request):
    # Rate limit by IP
    client_ip = request.client.host if request.client else "unknown"
    _check_rate_limit(client_ip)

    report_id = str(uuid.uuid4())[:8].upper()

    # ── Step 1: Detect Category ───────────────────────────────────────────────
    category = detect_category(req.idea)

    # ── Step 2: Rule Engine → Licenses ───────────────────────────────────────
    licenses    = get_applicable_licenses(req.idea, category, req.location)
    state_notes = get_state_notes(req.location)

    # ── Step 3: Risk Score ────────────────────────────────────────────────────
    risk_score, risk_note, risk_breakdown = calculate_risk_score(
        req.idea, category, req.scale, req.mode, licenses
    )

    # ── Step 4: Feasibility + Compliance Complexity ───────────────────────────
    feasibility_score, feasibility_note = calculate_feasibility_score(
        category, req.scale, licenses, risk_score
    )
    compliance_complexity = calculate_compliance_complexity(licenses, category)
    complexity_note = (
        f"{len(licenses)} licenses required — "
        + ("high regulatory burden" if compliance_complexity > 60
           else "moderate compliance load" if compliance_complexity > 35
           else "manageable compliance requirements")
        + f" for a {category} business."
    )

    # ── Step 5: AI Enrichment ─────────────────────────────────────────────────
    try:
        ai_data = await enrich_with_ai(
            idea=req.idea, location=req.location, scale=req.scale, mode=req.mode,
            category=category, licenses=licenses, risk_score=risk_score,
            feasibility_score=feasibility_score, compliance_complexity=compliance_complexity,
            state_notes=state_notes,
        )
    except GeminiQuotaExceededError as e:
        return JSONResponse(
            status_code=429,
            content={"error": str(e)},
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI service error: {str(e)}")

    # ── Step 6: Assemble Full Report Data ─────────────────────────────────────
    # report_url points to the FRONTEND report viewer page (what QR opens)
    # pdf_url    points to the raw PDF file
    runtime_base_url, runtime_frontend_url = _resolve_runtime_urls(request)
    report_url = f"{runtime_frontend_url}/report/{report_id}"
    pdf_url    = f"{runtime_base_url}/api/report/{report_id}/pdf"

    full_data = {
        "report_id":    report_id,
        "business_name":ai_data.get("business_name", "Business Analysis"),
        "category":     category,
        "summary":      ai_data.get("summary", ""),
        "key_insight":  ai_data.get("key_insight", ""),
        "location":     req.location,
        "scale":        req.scale,
        "mode":         req.mode,
        "feasibility": {
            "score": feasibility_score,
            "note":  feasibility_note,
            "label": score_label(feasibility_score, "feasibility"),
        },
        "risk": {
            "score": risk_score,
            "note":  risk_note,
            "label": score_label(risk_score, "risk"),
        },
        "compliance_complexity": {
            "score": compliance_complexity,
            "note":  complexity_note,
            "label": score_label(compliance_complexity, "complexity"),
        },
        "licenses":                    licenses,
        "risks":                       ai_data.get("risks", []),
        "action_plan":                 ai_data.get("action_plan", []),
        "non_compliance_consequences": ai_data.get("non_compliance_consequences", []),
        "cost_estimates":              ai_data.get("cost_estimates", []),
        "risk_breakdown":              risk_breakdown,
        "follow_up_questions":         ai_data.get("follow_up_questions", []),
        "report_url": report_url,
        "pdf_url":    pdf_url,
    }

    # ── Step 7: Generate PDF ──────────────────────────────────────────────────
    pdf_path = os.path.join(GENERATED_REPORTS_DIR, f"{report_id}.pdf")
    try:
        generate_pdf(full_data, pdf_path)
        # Optional: Upload to GCS if configured
        upload_to_gcs(pdf_path, f"reports/{report_id}.pdf")
    except Exception as e:
        logger.warning(f"PDF generation warning: {e}")
        full_data["pdf_url"] = None
        pdf_path = None

    # ── Step 8: Store in SQLite ───────────────────────────────────────────────
    save_report(
        report_id=report_id,
        idea=req.idea,
        location=req.location,
        scale=req.scale,
        mode=req.mode,
        data=full_data,
        pdf_path=pdf_path,
    )
    ensure_workspace_seeded(report_id, full_data)

    # ── Step 9: Send Email (non-fatal, optional) ──────────────────────────────
    if req.email and pdf_path:
        try:
            logger.info(f"Queuing background email for report {report_id} to {req.email}")
            threading.Thread(
                target=_send_report_email_background,
                args=(req.email, report_id, full_data["business_name"], pdf_path),
                daemon=True,
            ).start()
        except Exception as e:
            logger.warning(f"Email queue warning: {e}")  # never block the response

    # ── Step 10: Build Response ───────────────────────────────────────────────
    return AnalyzeResponse(
        report_id=report_id,
        business_name=full_data["business_name"],
        category=category,
        summary=full_data["summary"],
        key_insight=full_data["key_insight"],
        feasibility=ScoreDetail(**full_data["feasibility"]),
        risk=ScoreDetail(**full_data["risk"]),
        compliance_complexity=ScoreDetail(**full_data["compliance_complexity"]),
        licenses=licenses,
        risks=ai_data.get("risks", []),
        action_plan=ai_data.get("action_plan", []),
        non_compliance_consequences=ai_data.get("non_compliance_consequences", []),
        cost_estimates=ai_data.get("cost_estimates", []),
        risk_breakdown=risk_breakdown,
        follow_up_questions=ai_data.get("follow_up_questions", []),
        pdf_url=full_data.get("pdf_url"),
        report_url=report_url,
    )
