"""
LegalEase AI - /api/report Router
Retrieve stored reports, workspace state, and PDFs.
"""

import os
from datetime import datetime
from io import BytesIO

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse, StreamingResponse

from models.schemas import (
    DocumentStatusUpdate,
    ReportChatRequest,
    ReportChatResponse,
    TaskStatusUpdate,
)
import json

from services.chat_service import chat_about_report
from services.document_service import derive_workspace_doc_status, store_uploaded_document
from services.excel_service import build_excel_report
from services.storage_service import (
    get_dashboard_summary,
    get_report,
    list_reports,
    set_report_task_status,
    upsert_report_document,
)
from services.workspace_service import workspace_snapshot

router = APIRouter()
BACKEND_DIR = os.path.dirname(os.path.dirname(__file__))
_configured_reports_dir = os.getenv("GENERATED_REPORTS_DIR", "generated_reports")
GENERATED_REPORTS_DIR = (
    _configured_reports_dir
    if os.path.isabs(_configured_reports_dir)
    else os.path.join(BACKEND_DIR, _configured_reports_dir)
)
_configured_uploads_dir = os.getenv("DOCUMENT_UPLOADS_DIR", "uploaded_documents")
DOCUMENT_UPLOADS_DIR = (
    _configured_uploads_dir
    if os.path.isabs(_configured_uploads_dir)
    else os.path.join(BACKEND_DIR, _configured_uploads_dir)
)


def _get_existing_report(report_id: str) -> dict:
    report = get_report(report_id.upper())
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report


@router.get("/report/{report_id}")
def get_report_data(report_id: str):
    """Return full report JSON by ID."""
    report = _get_existing_report(report_id)
    return report["data"]


@router.post("/report/{report_id}/chat", response_model=ReportChatResponse)
async def chat_with_report(report_id: str, payload: ReportChatRequest):
    report = _get_existing_report(report_id.upper())
    answer = await chat_about_report(
        report=report,
        message=payload.message,
        history=[item.model_dump() for item in payload.history],
    )
    return ReportChatResponse(answer=answer)


@router.get("/report/{report_id}/pdf")
def download_pdf(report_id: str):
    """Download the PDF for a report."""
    pdf_path = os.path.join(GENERATED_REPORTS_DIR, f"{report_id.upper()}.pdf")
    if not os.path.exists(pdf_path):
        raise HTTPException(status_code=404, detail="PDF not found")
    return FileResponse(
        pdf_path,
        media_type="application/pdf",
        filename=f"LegalEase-Report-{report_id.upper()}.pdf",
    )


@router.get("/report/{report_id}/excel")
def download_excel(report_id: str):
    report = _get_existing_report(report_id)
    workbook_bytes = build_excel_report(report["data"])
    return StreamingResponse(
        BytesIO(workbook_bytes),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": f'attachment; filename="LegalEase-Report-{report_id.upper()}.xlsx"'
        },
    )


@router.get("/reports")
def get_all_reports():
    """List recent reports."""
    return list_reports(limit=50)


@router.get("/report/{report_id}/workspace")
def get_report_workspace(report_id: str):
    """Return persisted tasks and document requirements for a report."""
    normalized_report_id = report_id.upper()
    report = _get_existing_report(normalized_report_id)
    return workspace_snapshot(normalized_report_id, report["data"])


@router.post("/report/{report_id}/tasks/{task_key}")
def update_report_task(report_id: str, task_key: str, payload: TaskStatusUpdate):
    normalized_report_id = report_id.upper()
    report = _get_existing_report(normalized_report_id)
    updated = set_report_task_status(normalized_report_id, task_key, payload.status)
    if not updated:
        raise HTTPException(status_code=404, detail="Task not found")
    return workspace_snapshot(normalized_report_id, report["data"])


@router.get("/report/{report_id}/documents")
def get_report_documents(report_id: str):
    normalized_report_id = report_id.upper()
    report = _get_existing_report(normalized_report_id)
    return workspace_snapshot(normalized_report_id, report["data"])["documents"]


@router.post("/report/{report_id}/documents")
def upsert_document(report_id: str, payload: DocumentStatusUpdate):
    normalized_report_id = report_id.upper()
    report = _get_existing_report(normalized_report_id)
    upsert_report_document(
        report_id=normalized_report_id,
        doc_key=payload.doc_key,
        license_name=payload.license_name or "General compliance",
        document_name=payload.document_name or payload.doc_key,
        status=payload.status,
        note=payload.note,
    )
    return workspace_snapshot(normalized_report_id, report["data"])


@router.post("/report/{report_id}/documents/{doc_key}/upload")
async def upload_document(
    report_id: str,
    doc_key: str,
    file: UploadFile = File(...),
    note: str | None = Form(default=None),
):
    normalized_report_id = report_id.upper()
    report = _get_existing_report(normalized_report_id)
    workspace = workspace_snapshot(normalized_report_id, report["data"])
    target_document = next((item for item in workspace["documents"] if item["doc_key"] == doc_key), None)
    if not target_document:
        raise HTTPException(status_code=404, detail="Document requirement not found")

    stored = await store_uploaded_document(
        report_id=normalized_report_id,
        doc_key=doc_key,
        upload=file,
        uploads_root=DOCUMENT_UPLOADS_DIR,
        document_name=target_document["document_name"],
        verification_note=note,
    )
    upsert_report_document(
        report_id=normalized_report_id,
        doc_key=doc_key,
        license_name=target_document["license_name"],
        document_name=target_document["document_name"],
        status=derive_workspace_doc_status(stored["validation"]["status"]),
        note=note or target_document.get("note"),
        original_filename=stored["original_filename"],
        stored_filename=stored["stored_filename"],
        stored_path=stored["stored_path"],
        content_type=stored["content_type"],
        file_size=stored["file_size"],
        validation_status=stored["validation"]["status"],
        validation_note=stored["validation"]["note"],
        validation_payload=json.dumps(stored["validation"]),
        uploaded_at=datetime.utcnow().isoformat(),
    )
    return workspace_snapshot(normalized_report_id, report["data"])


@router.get("/dashboard/summary")
def dashboard_summary():
    return get_dashboard_summary()
