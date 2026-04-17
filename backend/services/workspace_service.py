"""
LegalEase AI - Workspace Service
Derives execution tasks and document requirements from a stored report.
"""

from __future__ import annotations

import json
import re
from typing import Any

from services.storage_service import (
    list_report_documents,
    list_report_tasks,
    upsert_report_document,
    upsert_report_task,
)


DOCUMENT_LIBRARY = {
    "gst": [
        "PAN Card of proprietor/company",
        "Aadhaar Card",
        "Bank account statement or cancelled cheque",
        "Proof of business address",
        "Digital signature (for companies/LLPs)",
        "Incorporation certificate (for companies)",
    ],
    "fssai": [
        "Photo ID proof",
        "Proof of possession of premises",
        "List of food products to be handled",
        "Food safety management plan",
        "Water test report where applicable",
        "Municipality or panchayat NOC if required",
    ],
    "udyam": [
        "Aadhaar of proprietor/partner/director",
        "PAN of business entity",
        "Bank account details",
        "NIC activity code",
    ],
    "shop": [
        "Proof of address of business premises",
        "PAN of owner",
        "Aadhaar of owner",
        "Passport-size photograph",
        "Employee details",
    ],
    "trade": [
        "Ownership or tenancy document",
        "Site plan or building layout",
        "NOC from fire department if applicable",
        "PAN card",
        "Identity proof of owner",
    ],
    "iec": [
        "PAN card of entity",
        "Identity proof of director",
        "Bank certificate or cancelled cheque",
        "Digital photograph",
        "Address proof of business",
    ],
}

DEFAULT_DOCUMENTS = [
    "PAN Card",
    "Aadhaar Card",
    "Proof of business address",
    "Bank account details",
    "Business registration certificate",
]

EXTRA_TASKS = [
    {
        "task_key": "operations-bank-account",
        "title": "Open a dedicated business bank account",
        "category": "operations",
        "timeframe": "Week 1",
        "source": "workspace",
    },
    {
        "task_key": "operations-bookkeeping",
        "title": "Set up bookkeeping and compliant invoicing",
        "category": "operations",
        "timeframe": "Week 1",
        "source": "workspace",
    },
    {
        "task_key": "legal-contract-review",
        "title": "Review founder, vendor, and employee contracts before launch",
        "category": "legal",
        "timeframe": "Pre-launch",
        "source": "workspace",
    },
    {
        "task_key": "compliance-record-room",
        "title": "Keep licenses, challans, and filings in one document room",
        "category": "compliance",
        "timeframe": "Ongoing",
        "source": "workspace",
    },
]


def _slugify(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-") or "item"


def _document_list_for_license(name: str) -> list[str]:
    lowered = (name or "").lower()
    for key, documents in DOCUMENT_LIBRARY.items():
        if key in lowered:
            return documents
    return DEFAULT_DOCUMENTS


def derive_workspace_tasks(report_data: dict[str, Any]) -> list[dict[str, str]]:
    tasks: list[dict[str, str]] = []
    for license_item in report_data.get("licenses", []) or []:
        name = license_item.get("name", "Required registration")
        tasks.append(
            {
                "task_key": f"license-{_slugify(name)}",
                "title": f"Apply for {name}",
                "category": "licensing",
                "timeframe": license_item.get("time_to_approve") or "Pre-launch",
                "source": "license",
            }
        )

    for index, step in enumerate(report_data.get("action_plan", []) or [], start=1):
        title = step.get("title") or f"Action step {index}"
        tasks.append(
            {
                "task_key": f"action-{index}-{_slugify(title)}",
                "title": title,
                "category": step.get("category") or "compliance",
                "timeframe": step.get("timeframe") or "Planned",
                "source": "action_plan",
            }
        )

    tasks.extend(EXTRA_TASKS)
    return tasks


def derive_workspace_documents(report_data: dict[str, Any]) -> list[dict[str, str]]:
    requirements: list[dict[str, str]] = []
    for license_item in report_data.get("licenses", []) or []:
        license_name = license_item.get("name", "General compliance")
        for document_name in _document_list_for_license(license_name):
            requirements.append(
                {
                    "doc_key": f"{_slugify(license_name)}-{_slugify(document_name)}",
                    "license_name": license_name,
                    "document_name": document_name,
                }
            )
    return requirements


def ensure_workspace_seeded(report_id: str, report_data: dict[str, Any]) -> None:
    existing_tasks = {item["task_key"] for item in list_report_tasks(report_id)}
    existing_documents = {item["doc_key"] for item in list_report_documents(report_id)}

    for task in derive_workspace_tasks(report_data):
        if task["task_key"] in existing_tasks:
            continue
        upsert_report_task(
            report_id=report_id,
            task_key=task["task_key"],
            title=task["title"],
            category=task["category"],
            timeframe=task["timeframe"],
            status="pending",
            source=task["source"],
        )

    for document in derive_workspace_documents(report_data):
        if document["doc_key"] in existing_documents:
            continue
        upsert_report_document(
            report_id=report_id,
            doc_key=document["doc_key"],
            license_name=document["license_name"],
            document_name=document["document_name"],
            status="missing",
            note=None,
        )


def workspace_snapshot(report_id: str, report_data: dict[str, Any]) -> dict[str, Any]:
    ensure_workspace_seeded(report_id, report_data)

    tasks = list_report_tasks(report_id)
    documents = list_report_documents(report_id)

    completed = sum(1 for item in tasks if item.get("status") == "completed")
    ready_documents = sum(1 for item in documents if item.get("status") in {"ready", "submitted"})

    return {
        "report_id": report_id,
        "tasks": tasks,
        "documents": [
            {
                **item,
                "file_url": f"/documents/{report_id.upper()}/{item['stored_filename']}" if item.get("stored_filename") else None,
                "validation": (
                    json.loads(item["validation_payload"])
                    if item.get("validation_payload")
                    else {
                        "status": item.get("validation_status"),
                        "note": item.get("validation_note"),
                    }
                ) if item.get("validation_status") else None,
            }
            for item in documents
        ],
        "summary": {
            "task_count": len(tasks),
            "completed_tasks": completed,
            "completion_rate": round((completed / len(tasks)) * 100) if tasks else 0,
            "document_count": len(documents),
            "ready_documents": ready_documents,
        },
    }
