"""
LegalEase AI - Document Service
Handles upload storage and AI-powered validation for report documents.
"""

from __future__ import annotations

import base64
import io
import json
import os
import re
from pathlib import Path
from typing import Any

import httpx
from fastapi import HTTPException, UploadFile
from PIL import Image

GROQ_CHAT_URL = "https://api.groq.com/openai/v1/chat/completions"
DEFAULT_GROQ_VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct"

ALLOWED_CONTENT_TYPES = {
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
}
ALLOWED_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png", ".webp"}
MAX_FILE_SIZE = 10 * 1024 * 1024
MAX_IMAGE_PAGES = 3
MAX_IMAGE_BYTES = 3 * 1024 * 1024


def _slugify(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-") or "document"


def _extract_json(text: str) -> dict[str, Any]:
    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1 or end < start:
        raise ValueError("No JSON object found in AI response")
    return json.loads(text[start : end + 1])


def get_groq_api_key() -> str:
    return os.getenv("GROQ_API_KEY", "").strip()


def get_groq_vision_model() -> str:
    return os.getenv("GROQ_VISION_MODEL", DEFAULT_GROQ_VISION_MODEL).strip() or DEFAULT_GROQ_VISION_MODEL


def _normalize_image(image: Image.Image) -> Image.Image:
    if image.mode == "RGBA":
        background = Image.new("RGB", image.size, "white")
        background.paste(image, mask=image.split()[3])
        return background
    if image.mode != "RGB":
        return image.convert("RGB")
    return image


def _fit_image(image: Image.Image, max_side: int = 1600) -> Image.Image:
    img = _normalize_image(image)
    if max(img.size) <= max_side:
        return img
    resized = img.copy()
    resized.thumbnail((max_side, max_side))
    return resized


def _image_to_data_url(image: Image.Image) -> str:
    current = _fit_image(image)

    for max_side in (1600, 1400, 1200, 1000):
        candidate = _fit_image(current, max_side=max_side)
        for quality in (85, 70, 55, 40):
            buffer = io.BytesIO()
            candidate.save(buffer, format="JPEG", optimize=True, quality=quality)
            raw = buffer.getvalue()
            if len(raw) <= MAX_IMAGE_BYTES:
                encoded = base64.b64encode(raw).decode("ascii")
                return f"data:image/jpeg;base64,{encoded}"
        current = candidate

    raise HTTPException(status_code=400, detail="Document image is too large to validate. Please upload a clearer, smaller file.")


def _pdf_pages_to_data_urls(file_bytes: bytes) -> list[str]:
    try:
        import fitz
    except ImportError as exc:
        raise HTTPException(
            status_code=500,
            detail="PDF verification needs PyMuPDF installed on the backend.",
        ) from exc

    try:
        document = fitz.open(stream=file_bytes, filetype="pdf")
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Uploaded PDF could not be read for verification.") from exc

    data_urls: list[str] = []
    try:
        for page_index in range(min(document.page_count, MAX_IMAGE_PAGES)):
            page = document.load_page(page_index)
            pixmap = page.get_pixmap(matrix=fitz.Matrix(1.6, 1.6), alpha=False)
            image = Image.frombytes("RGB", [pixmap.width, pixmap.height], pixmap.samples)
            data_urls.append(_image_to_data_url(image))
    finally:
        document.close()

    if not data_urls:
        raise HTTPException(status_code=400, detail="Uploaded PDF has no readable pages.")
    return data_urls


def _file_to_data_urls(file_bytes: bytes, content_type: str) -> list[str]:
    if content_type == "application/pdf":
        return _pdf_pages_to_data_urls(file_bytes)

    try:
        image = Image.open(io.BytesIO(file_bytes))
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Uploaded image could not be processed.") from exc
    return [_image_to_data_url(image)]


def validate_uploaded_file(filename: str, content_type: str, file_size: int) -> None:
    ext = Path(filename).suffix.lower()
    if content_type not in ALLOWED_CONTENT_TYPES or ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Only PDF, JPG, PNG, or WEBP documents are allowed.")
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="Document exceeds the 10 MB upload limit.")
    if file_size == 0:
        raise HTTPException(status_code=400, detail="Uploaded document is empty.")


def map_validation_to_status(validation: dict[str, Any]) -> str:
    authenticity = (validation.get("authenticity_assessment") or "").lower()
    validity = (validation.get("validity_status") or "").lower()
    matches = bool(validation.get("matches_expected_document", False))

    if authenticity == "suspicious" or validity == "expired":
        return "review_required"
    if matches and authenticity in {"likely_authentic", "cannot_determine"} and validity in {"valid", "not_applicable", "cannot_determine"}:
        return "validated"
    return "review_required"


def derive_workspace_doc_status(validation_status: str) -> str:
    return "ready" if validation_status == "validated" else "collecting"


def _normalize_confidence_value(value: Any) -> int | None:
    if value is None:
        return None

    try:
        numeric = float(value)
    except (TypeError, ValueError):
        return None

    # Some models return confidence in 0-1 form, others in 0-100 form.
    if 0 <= numeric <= 1:
        numeric *= 100

    return max(0, min(100, round(numeric)))


async def analyze_document_with_ai(
    file_bytes: bytes,
    content_type: str,
    expected_document_name: str,
    verification_note: str | None = None,
) -> dict[str, Any]:
    groq_api_key = get_groq_api_key()
    if not groq_api_key:
        raise HTTPException(status_code=500, detail="AI validation is not configured for document checks.")

    data_urls = _file_to_data_urls(file_bytes, content_type)

    prompt = (
        "You are validating a business compliance document uploaded by a user in India.\n"
        "Review the document content shown in the uploaded page images, not the filename.\n"
        f"Expected document type: {expected_document_name}\n\n"
        "Return only JSON with this exact structure:\n"
        "{\n"
        '  "detected_document_type": "string",\n'
        '  "matches_expected_document": true,\n'
        '  "authenticity_assessment": "likely_authentic | suspicious | cannot_determine",\n'
        '  "validity_status": "valid | expired | not_applicable | cannot_determine",\n'
        '  "expiry_date": "YYYY-MM-DD or null",\n'
        '  "document_number": "masked identifier or null",\n'
        '  "holder_name": "name or null",\n'
        '  "confidence": 0,\n'
        '  "issues": ["issue 1", "issue 2"],\n'
        '  "note": "short explanation for a founder",\n'
        '  "visible_fields": ["field 1", "field 2"]\n'
        "}\n\n"
        "Rules:\n"
        "- Use the document content itself even if the uploaded filename is unrelated.\n"
        "- Do not claim government-side official verification unless the document itself contains proof.\n"
        "- Mark authenticity_assessment as suspicious only if there are visible inconsistencies, missing security patterns, obvious edits, or mismatched content.\n"
        "- If expiry is not present, use not_applicable or cannot_determine.\n"
        "- Keep document_number masked except last 4 characters if visible.\n"
        "- If this is a multi-page PDF, use all provided page images together before deciding.\n"
        "- confidence must be an integer from 0 to 100, not a decimal from 0 to 1.\n"
        "- If unclear, use cannot_determine instead of guessing."
    )
    if verification_note:
        prompt += (
            "\n\nAdditional founder instruction for what to verify:\n"
            f"- {verification_note.strip()}\n"
            "- Use this as extra checking context, but do not override what is actually visible in the document."
        )

    message_content: list[dict[str, Any]] = [{"type": "text", "text": prompt}]
    message_content.extend(
        {"type": "image_url", "image_url": {"url": data_url}}
        for data_url in data_urls
    )

    payload = {
        "model": get_groq_vision_model(),
        "messages": [
            {
                "role": "user",
                "content": message_content,
            }
        ],
        "temperature": 0.1,
        "max_completion_tokens": 1200,
        "response_format": {"type": "json_object"},
    }

    async with httpx.AsyncClient(timeout=90.0) as client:
        response = await client.post(
            GROQ_CHAT_URL,
            json=payload,
            headers={
                "Authorization": f"Bearer {groq_api_key}",
                "Content-Type": "application/json",
            },
        )

    if response.status_code != 200:
        raise HTTPException(status_code=502, detail="AI document validation failed.")

    try:
        raw = response.json()["choices"][0]["message"]["content"]
        parsed = raw if isinstance(raw, dict) else _extract_json(raw)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"AI document validation response was invalid: {exc}") from exc

    parsed["confidence"] = _normalize_confidence_value(parsed.get("confidence"))
    parsed["status"] = map_validation_to_status(parsed)
    return parsed


async def store_uploaded_document(
    report_id: str,
    doc_key: str,
    upload: UploadFile,
    uploads_root: str,
    document_name: str,
    verification_note: str | None = None,
) -> dict[str, Any]:
    report_folder = Path(uploads_root) / report_id.upper()
    report_folder.mkdir(parents=True, exist_ok=True)

    extension = Path(upload.filename or "").suffix.lower()
    stored_filename = f"{_slugify(doc_key)}{extension}"
    target_path = report_folder / stored_filename

    file_bytes = await upload.read()
    validate_uploaded_file(
        filename=upload.filename or stored_filename,
        content_type=upload.content_type or "application/octet-stream",
        file_size=len(file_bytes),
    )

    validation = await analyze_document_with_ai(
        file_bytes=file_bytes,
        content_type=upload.content_type or "application/octet-stream",
        expected_document_name=document_name,
        verification_note=verification_note,
    )
    target_path.write_bytes(file_bytes)

    return {
        "stored_filename": stored_filename,
        "stored_path": str(target_path),
        "original_filename": upload.filename or stored_filename,
        "content_type": upload.content_type or "application/octet-stream",
        "file_size": len(file_bytes),
        "validation": validation,
    }
