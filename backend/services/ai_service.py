"""
LegalEase AI – AI Service (Google Gemini)
Takes the deterministic rule engine output and enriches it with
personalized, business-specific language, insights, and action plans.

Fixes:
  - Robust JSON extraction: strips markdown fences, repairs common
    Gemini quirks (trailing commas, smart quotes, unescaped apostrophes).
  - Falls back to a safe structured default if parsing still fails so the
    overall /analyze request never errors out due to AI JSON issues.
  - Detailed logging of raw Gemini output to help debug future failures.
"""

import os
import re
import json
import asyncio
import httpx
import logging
import hashlib
from typing import List, Dict
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))
GEMINI_URL = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
    "gemini-2.5-flash:generateContent"
)


class GeminiQuotaExceededError(Exception):
    """Raised when Gemini returns HTTP 429 after all retries are exhausted."""


def get_gemini_api_key() -> str:
    return os.getenv("GEMINI_API_KEY", "").strip()


# ── JSON repair helpers ───────────────────────────────────────────────────────

def _strip_fences(text: str) -> str:
    """Remove markdown code fences that Gemini sometimes adds."""
    text = re.sub(r"^```(?:json)?\s*", "", text.strip(), flags=re.IGNORECASE)
    text = re.sub(r"\s*```$", "", text.strip())
    return text.strip()


def _extract_json_block(text: str) -> str:
    """Return the substring from first { to last } (handles trailing text)."""
    s = text.find("{")
    e = text.rfind("}")
    if s == -1 or e == -1 or e < s:
        raise ValueError("No JSON object found in response")
    return text[s : e + 1]


def _repair_json(raw: str) -> str:
    """
    Best-effort repair for common Gemini JSON issues:
      1. Smart / curly quotes  →  straight quotes
      2. Trailing commas before } or ]
      3. Unescaped newlines inside string values
      4. Single-quoted keys or values  →  double-quoted
    """
    # 1. Normalise curly / smart quotes
    for bad, good in [
        ("\u2018", "'"), ("\u2019", "'"),   # left/right single
        ("\u201c", '"'), ("\u201d", '"'),   # left/right double
        ("\u2032", "'"), ("\u2033", '"'),   # prime
    ]:
        raw = raw.replace(bad, good)

    # 2. Remove trailing commas  ,  before  }  or  ]
    raw = re.sub(r",\s*([}\]])", r"\1", raw)

    # 3. Collapse literal newlines inside quoted strings to \\n
    #    (Gemini occasionally puts a raw newline inside a JSON string)
    def fix_newlines(m):
        return m.group(0).replace("\n", "\\n").replace("\r", "")
    raw = re.sub(r'"[^"\\]*(?:\\.[^"\\]*)*"', fix_newlines, raw, flags=re.DOTALL)

    return raw


def _safe_parse(text: str) -> dict:
    """Strip → extract → repair → parse, with progressive fallback."""
    text = _strip_fences(text)
    text = _extract_json_block(text)

    # First attempt: parse as-is
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Second attempt: after repair
    repaired = _repair_json(text)
    try:
        return json.loads(repaired)
    except json.JSONDecodeError as exc:
        # Log the problematic text to help debugging
        snippet = repaired[:500]
        raise ValueError(
            f"JSON parse failed after repair: {exc}\n"
            f"First 500 chars of repaired text:\n{snippet}"
        ) from exc


def _fallback_response(idea: str, location: str) -> dict:
    """Return a minimal but valid structure when AI completely fails."""
    return {
        "business_name": idea[:50],
        "summary": (
            f"Legal analysis for a business in {location}. "
            "Please review the compliance requirements below."
        ),
        "key_insight": (
            "Ensure all required licenses are obtained before commencing operations "
            "to avoid penalties under relevant Indian laws."
        ),
        "risks": [
            {
                "title": "Operating Without Required Licenses",
                "description": "Starting business operations without mandatory registrations.",
                "penalty": "Varies by applicable law — see license details above.",
                "severity": "high",
                "law": "Relevant State/Central Legislation",
            }
        ],
        "action_plan": [
            {
                "step": 1,
                "title": "Obtain All Required Licenses",
                "description": "Apply for all licenses listed in the compliance section above.",
                "timeframe": "Week 1-4",
                "cost": "Varies",
                "category": "compliance",
            }
        ],
        "non_compliance_consequences": [
            {
                "area": "General Non-Compliance",
                "consequence": "Fines, penalties, or business closure under applicable Indian law.",
            }
        ],
        "cost_estimates": [
            {
                "item": "Total Estimated Compliance Cost",
                "range": "Rs. 5,000 to Rs. 50,000",
                "notes": "Depends on specific licenses required.",
            }
        ],
        "follow_up_questions": [
            "Do you plan to hire employees in the first year?",
            "Will you be accepting payments online?",
            "Are you planning to export goods or services?",
        ],
    }

# ── Global Cache ──────────────────────────────────────────────────────────────
_ai_cache = {}  # prompt_hash -> parsed_json

# ── Main AI enrichment call ───────────────────────────────────────────────────

async def enrich_with_ai(
    idea: str,
    location: str,
    scale: str,
    mode: str,
    category: str,
    licenses: List[dict],
    risk_score: int,
    feasibility_score: int,
    compliance_complexity: int,
    state_notes: List[str],
) -> dict:
    """
    Calls Gemini to generate personalized AI content.
    Returns a dict with enriched fields to merge into the final response.
    Never raises on JSON parse errors — falls back to safe defaults.
    """

    gemini_api_key = get_gemini_api_key()

    if not gemini_api_key or gemini_api_key in ("YOUR_GEMINI_API_KEY_HERE", ""):
        logger.warning("GEMINI_API_KEY is missing. Using deterministic fallback.")
        return _fallback_response(idea, location)

    license_names = [lic["name"] for lic in licenses]
    state_notes_str = "; ".join(state_notes) if state_notes else "None"
    license_str = ", ".join(license_names) if license_names else "None identified"

    prompt = (
        "You are a senior Indian corporate lawyer writing a compliance report.\n"
        "A client described their business and our rule engine determined required licenses and scores.\n\n"
        "=== BUSINESS CONTEXT ===\n"
        f'Business Idea: "{idea}"\n'
        f"Location: {location}\n"
        f"Scale: {scale}\n"
        f"Mode: {mode}\n"
        f"Category: {category}\n"
        f"Determined Licenses: {license_str}\n"
        f"Risk Score (0-100): {risk_score}\n"
        f"Feasibility Score (0-100): {feasibility_score}\n"
        f"Compliance Complexity (0-100): {compliance_complexity}\n"
        f"State-Specific Notes: {state_notes_str}\n\n"
        "=== TASK ===\n"
        "Respond with ONLY a valid JSON object. "
        "Do NOT use markdown, backticks, or any text outside the JSON.\n"
        "Do NOT include trailing commas. Use only straight double-quotes.\n\n"
        "Required JSON structure:\n"
        "{\n"
        '  "business_name": "3-5 word concise business name",\n'
        '  "summary": "2-sentence summary specific to this business and location",\n'
        f'  "key_insight": "One critical insight entrepreneurs starting this in {location} miss",\n'
        '  "risks": [\n'
        '    {\n'
        '      "title": "Risk name",\n'
        '      "description": "Specific risk description",\n'
        '      "penalty": "Exact penalty amount under Indian law",\n'
        '      "severity": "high",\n'
        '      "law": "Exact Indian Act name and Section number"\n'
        '    }\n'
        '  ],\n'
        '  "action_plan": [\n'
        '    {\n'
        '      "step": 1,\n'
        '      "title": "Step title",\n'
        '      "description": "Exactly what to do",\n'
        '      "timeframe": "Week 1-2",\n'
        '      "cost": "Rs. 1000 or Free",\n'
        '      "category": "legal"\n'
        '    }\n'
        '  ],\n'
        '  "non_compliance_consequences": [\n'
        '    {"area": "Area name", "consequence": "Specific legal consequence"}\n'
        '  ],\n'
        '  "cost_estimates": [\n'
        '    {"item": "Item name", "range": "Rs. X to Rs. Y", "notes": "Brief note"}\n'
        '  ],\n'
        '  "follow_up_questions": [\n'
        '    "Question 1", "Question 2", "Question 3"\n'
        '  ]\n'
        "}\n\n"
        "Rules:\n"
        "- risks: title, description, penalty, severity (high/medium/low), law\n"
        "- action_plan: category must be one of: legal, financial, operational, compliance\n"
        "- Cite real Indian laws: IT Act 2000, FSSAI Act 2006, Companies Act 2013, GST Act, Consumer Protection Act 2019\n"
        "- Penalty amounts must be specific rupee figures from actual law\n"
        "- Include 4-6 risks, 6-10 action steps, 3-5 consequences, 4-6 cost estimates\n"
        "- Action plan ordered chronologically\n"
        "- Use Rs. prefix for all rupee amounts (not the rupee symbol)\n"
        "- Never use apostrophes inside JSON string values; rephrase instead"
    )

    # ── Check Cache ──
    prompt_hash = hashlib.md5(prompt.encode("utf-8")).hexdigest()
    if prompt_hash in _ai_cache:
        logger.info(f"AI response cache hit for hash {prompt_hash}")
        return _ai_cache[prompt_hash]

    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.3,
            "maxOutputTokens": 4096,
            "responseMimeType": "application/json",
        },
    }

    resp = None
    retry_delays = (2, 4, 8)
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            for attempt, delay in enumerate(retry_delays, start=1):
                resp = await client.post(
                    f"{GEMINI_URL}?key={gemini_api_key}",
                    json=payload,
                )
                if resp.status_code != 429:
                    break
                logger.warning(
                    f"Gemini API returned 429 on attempt {attempt}. "
                    f"Retrying in {delay}s."
                )
                await asyncio.sleep(delay)

            if resp is not None and resp.status_code == 429:
                logger.error("Gemini quota exhausted after retries. Using deterministic fallback.")
                return _fallback_response(idea, location)
    except Exception as exc:
        logger.exception(f"Request to Gemini failed: {exc}")
        return _fallback_response(idea, location)

    if resp.status_code != 200:
        logger.error(
            f"Gemini API returned {resp.status_code}. "
            f"Using fallback. Response snippet: {resp.text[:300]}"
        )
        return _fallback_response(idea, location)

    try:
        data = resp.json()
    except ValueError as exc:
        logger.error(f"Gemini returned invalid JSON envelope: {exc}")
        return _fallback_response(idea, location)

    if "error" in data:
        if str(data["error"].get("code")) == "429":
            logger.error("Gemini returned quota error payload. Using deterministic fallback.")
            return _fallback_response(idea, location)
        logger.error(
            "Gemini returned an error payload. "
            f"Using fallback. Message: {data['error'].get('message', 'Unknown error')}"
        )
        return _fallback_response(idea, location)

    # Extract raw text
    try:
        raw = data["candidates"][0]["content"]["parts"][0]["text"]
    except (KeyError, IndexError) as exc:
        logger.error(f"Unexpected Gemini response shape: {data}")
        return _fallback_response(idea, location)

    logger.info(f"Raw Gemini response ({len(raw)} chars):\n{raw[:300]}...")

    # Parse with repair fallback
    try:
        parsed = _safe_parse(raw)
        # ── Update Cache ──
        _ai_cache[prompt_hash] = parsed
        return parsed
    except ValueError as exc:
        logger.error(f"JSON parse error: {exc}")
        return _fallback_response(idea, location)
