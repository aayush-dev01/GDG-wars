"""
LegalEase AI – Pydantic Schemas
"""

from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Any


class AnalyzeRequest(BaseModel):
    idea:     str
    location: str
    scale:    str
    mode:     str
    email:    Optional[str] = None

    @field_validator("idea")
    @classmethod
    def idea_not_empty(cls, v):
        v = v.strip()
        if len(v) < 5:
            raise ValueError("Business idea must be at least 5 characters")
        if len(v) > 2000:
            raise ValueError("Business idea must be under 2000 characters")
        return v

    @field_validator("location")
    @classmethod
    def valid_location(cls, v):
        if len(v.strip()) < 2:
            raise ValueError("Location is required")
        return v.strip()

    @field_validator("email")
    @classmethod
    def valid_email(cls, v):
        if v is None:
            return v
        v = v.strip()
        if not v:
            return None
        if "@" not in v or "." not in v.split("@")[-1]:
            raise ValueError("Please enter a valid email address")
        return v


class ScoreDetail(BaseModel):
    score: int
    note:  str
    label: str


class AnalyzeResponse(BaseModel):
    report_id:                    str
    business_name:                str
    category:                     str
    summary:                      str
    key_insight:                  str
    feasibility:                  ScoreDetail
    risk:                         ScoreDetail
    compliance_complexity:        ScoreDetail
    licenses:                     List[Any]
    risks:                        List[Any]
    action_plan:                  List[Any]
    non_compliance_consequences:  List[Any]
    cost_estimates:               List[Any]
    risk_breakdown:               List[Any]
    follow_up_questions:          List[str]
    pdf_url:                      Optional[str]
    report_url:                   str


class TaskStatusUpdate(BaseModel):
    status: str

    @field_validator("status")
    @classmethod
    def valid_status(cls, v):
        value = v.strip().lower()
        allowed = {"pending", "in_progress", "completed"}
        if value not in allowed:
            raise ValueError(f"Status must be one of: {', '.join(sorted(allowed))}")
        return value


class DocumentStatusUpdate(BaseModel):
    doc_key: str
    status: str = "missing"
    note: Optional[str] = None
    license_name: Optional[str] = None
    document_name: Optional[str] = None

    @field_validator("doc_key")
    @classmethod
    def valid_doc_key(cls, v):
        value = v.strip()
        if len(value) < 3:
            raise ValueError("Document key is required")
        return value

    @field_validator("status")
    @classmethod
    def valid_doc_status(cls, v):
        value = v.strip().lower()
        allowed = {"missing", "collecting", "ready", "submitted"}
        if value not in allowed:
            raise ValueError(f"Status must be one of: {', '.join(sorted(allowed))}")
        return value

    @field_validator("note")
    @classmethod
    def normalize_note(cls, v):
        return v.strip() if isinstance(v, str) and v.strip() else None


class DocumentValidationResult(BaseModel):
    status: str
    note: str


class UploadedDocumentMeta(BaseModel):
    original_filename: Optional[str] = None
    stored_filename: Optional[str] = None
    file_size: Optional[int] = None
    content_type: Optional[str] = None
    uploaded_at: Optional[str] = None
    file_url: Optional[str] = None
    validation: Optional[DocumentValidationResult] = None


class ReportChatMessage(BaseModel):
    role: str
    content: str

    @field_validator("role")
    @classmethod
    def valid_role(cls, v):
        value = v.strip().lower()
        allowed = {"user", "assistant"}
        if value not in allowed:
            raise ValueError(f"Role must be one of: {', '.join(sorted(allowed))}")
        return value

    @field_validator("content")
    @classmethod
    def valid_content(cls, v):
        value = v.strip()
        if len(value) < 1:
            raise ValueError("Message content is required")
        if len(value) > 4000:
            raise ValueError("Message content must be under 4000 characters")
        return value


class ReportChatRequest(BaseModel):
    message: str
    history: List[ReportChatMessage] = Field(default_factory=list)

    @field_validator("message")
    @classmethod
    def valid_message(cls, v):
        value = v.strip()
        if len(value) < 2:
            raise ValueError("Message must be at least 2 characters")
        if len(value) > 4000:
            raise ValueError("Message must be under 4000 characters")
        return value


class ReportChatResponse(BaseModel):
    answer: str
