"""
LegalEase AI - Report Chat Service
Conversational assistant grounded in a saved report.
"""

from __future__ import annotations

import os
from typing import Any

import httpx
from fastapi import HTTPException

GROQ_CHAT_URL = "https://api.groq.com/openai/v1/chat/completions"
DEFAULT_GROQ_CHAT_MODEL = "llama-3.3-70b-versatile"


def get_groq_api_key() -> str:
    return os.getenv("GROQ_API_KEY", "").strip()


def get_groq_chat_model() -> str:
    configured = os.getenv("GROQ_CHAT_MODEL", DEFAULT_GROQ_CHAT_MODEL).strip()
    return configured or DEFAULT_GROQ_CHAT_MODEL


def _clip(text: str | None, limit: int = 240) -> str:
    value = (text or "").strip()
    if len(value) <= limit:
        return value
    return value[: limit - 3].rstrip() + "..."


def _report_context(report: dict[str, Any]) -> str:
    data = report["data"]

    licenses = "\n".join(
        f"- {item.get('name', 'License')} | authority: {item.get('authority', 'Unknown')} | priority: {item.get('priority', 'normal')}"
        for item in (data.get("licenses") or [])[:8]
    ) or "- No licenses listed"

    risks = "\n".join(
        f"- {item.get('title', 'Risk')} | severity: {item.get('severity', 'unknown')} | penalty: {_clip(item.get('penalty'), 120)}"
        for item in (data.get("risks") or [])[:6]
    ) or "- No risks listed"

    actions = "\n".join(
        f"- Step {item.get('step', '?')}: {item.get('title', 'Action')} | timeframe: {item.get('timeframe', 'General')}"
        for item in (data.get("action_plan") or [])[:6]
    ) or "- No action plan listed"

    return (
        f"Report ID: {data.get('report_id', report.get('id', 'Unknown'))}\n"
        f"Business Idea: {report.get('idea', data.get('business_name', 'Unknown'))}\n"
        f"Business Name: {data.get('business_name', 'Unknown')}\n"
        f"Category: {data.get('category', 'Unknown')}\n"
        f"Location: {report.get('location', data.get('location', 'Unknown'))}\n"
        f"Scale: {report.get('scale', data.get('scale', 'Unknown'))}\n"
        f"Mode: {report.get('mode', data.get('mode', 'Unknown'))}\n"
        f"Summary: {_clip(data.get('summary'), 500)}\n"
        f"Key Insight: {_clip(data.get('key_insight'), 400)}\n"
        f"Feasibility Score: {data.get('feasibility', {}).get('score', 'N/A')}\n"
        f"Risk Score: {data.get('risk', {}).get('score', 'N/A')}\n"
        f"Compliance Complexity Score: {data.get('compliance_complexity', {}).get('score', 'N/A')}\n\n"
        f"Top Licenses:\n{licenses}\n\n"
        f"Top Risks:\n{risks}\n\n"
        f"Action Plan:\n{actions}"
    )


async def chat_about_report(report: dict[str, Any], message: str, history: list[dict[str, str]] | None = None) -> str:
    groq_api_key = get_groq_api_key()
    if not groq_api_key:
        raise HTTPException(status_code=500, detail="AI chat is not configured for report chat.")

    system_prompt = (
        "You are LegalEase Counsel, a premium legal-compliance chat assistant for Indian founders.\n"
        "Answer using the provided report context first, then general Indian compliance knowledge if needed.\n"
        "Be practical, concise, and founder-friendly.\n"
        "Use short paragraphs or bullets when helpful.\n"
        "If the report lacks a detail, say that clearly instead of inventing it.\n"
        "Do not claim to be a lawyer of record. Avoid definitive legal advice.\n"
        "When relevant, mention concrete next steps, likely documents, authorities, timelines, or penalties.\n"
        "If asked about something outside the report, frame it as a general suggestion."
    )

    messages: list[dict[str, Any]] = [
        {"role": "system", "content": system_prompt},
        {"role": "system", "content": f"Report context:\n{_report_context(report)}"},
    ]

    for item in (history or [])[-10:]:
        role = (item.get("role") or "").strip().lower()
        content = (item.get("content") or "").strip()
        if role in {"user", "assistant"} and content:
            messages.append({"role": role, "content": content[:4000]})

    messages.append({"role": "user", "content": message.strip()[:4000]})

    payload = {
        "model": get_groq_chat_model(),
        "messages": messages,
        "temperature": 0.25,
        "max_completion_tokens": 900,
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            GROQ_CHAT_URL,
            json=payload,
            headers={
                "Authorization": f"Bearer {groq_api_key}",
                "Content-Type": "application/json",
            },
        )

    if response.status_code != 200:
        raise HTTPException(status_code=502, detail="AI chat request failed.")

    try:
        answer = response.json()["choices"][0]["message"]["content"].strip()
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"AI chat response was invalid: {exc}") from exc

    if not answer:
        raise HTTPException(status_code=502, detail="AI chat returned an empty answer.")

    return answer
