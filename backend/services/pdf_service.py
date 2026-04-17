"""
Premium PDF generation service for LegalEase AI.

Design goals:
- restrained black, ivory, and gold palette
- consulting-firm structure with strong typography hierarchy
- generous whitespace and consistent margins
- simple print-friendly layouts with subtle emphasis
"""

from __future__ import annotations

import os
from datetime import datetime
from typing import Iterable, List, Tuple

from reportlab.graphics.shapes import Drawing, Line, Rect, String
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import HRFlowable, KeepTogether, PageBreak, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

PAGE_WIDTH, PAGE_HEIGHT = A4
MARGIN_X = 15 * mm
MARGIN_Y = 13 * mm
CONTENT_WIDTH = PAGE_WIDTH - (2 * MARGIN_X)

CHARCOAL = colors.HexColor("#151311")
CHARCOAL_SOFT = colors.HexColor("#26211C")
CHARCOAL_PANEL = colors.HexColor("#1D1814")
GOLD = colors.HexColor("#B89245")
GOLD_SOFT = colors.HexColor("#D6BE83")
LINE = colors.HexColor("#4A4034")
TEXT = colors.HexColor("#F3EDE2")
TEXT_MUTED = colors.HexColor("#B2A899")
TEXT_LIGHT = colors.HexColor("#EDE6D7")
SUCCESS = colors.HexColor("#8EB69B")
AMBER = colors.HexColor("#D0A95F")
RISK = colors.HexColor("#D07C68")
PANEL = colors.HexColor("#1F1A15")


def clean_text(value) -> str:
    return (
        str(value or "")
        .replace("\u20b9", "Rs.")
        .replace("₹", "Rs.")
        .replace("â‚¹", "Rs.")
        .replace("—", "-")
        .replace("–", "-")
        .replace("\r", " ")
        .strip()
    )


def nice_scale(scale: str) -> str:
    mapping = {
        "solo": "Solo / Freelancer",
        "startup": "Startup",
        "sme": "Small or Medium Business",
        "enterprise": "Enterprise",
    }
    return mapping.get((scale or "").lower(), clean_text(scale))


def nice_mode(mode: str) -> str:
    mapping = {
        "online": "Online / Digital",
        "offline": "Offline / Physical",
        "both": "Hybrid Online + Offline",
    }
    return mapping.get((mode or "").lower(), clean_text(mode))


def _normalize(data: dict) -> dict:
    scores = data.get("scores", {}) or {}
    feasibility = data.get("feasibility", {}) or {}
    risk = data.get("risk", {}) or {}
    compliance = data.get("compliance_complexity", {}) or data.get("compliance", {}) or {}

    normalized = dict(data)
    normalized["business_name"] = data.get("business_name") or data.get("businessName") or data.get("idea") or "Business Legal Analysis"
    normalized["idea"] = data.get("idea") or normalized["business_name"]
    normalized["category"] = data.get("category") or data.get("industry_tag") or "Business"
    normalized["summary"] = data.get("summary", "")
    normalized["key_insight"] = data.get("key_insight") or data.get("keyInsight") or ""
    normalized["report_id"] = data.get("report_id") or data.get("reportId") or ""
    normalized["report_url"] = data.get("report_url") or data.get("url") or ""
    normalized["pdf_url"] = data.get("pdf_url") or ""
    normalized["licenses"] = data.get("licenses", []) or []
    normalized["risks"] = data.get("risks", []) or []
    normalized["action_plan"] = data.get("action_plan", []) or []
    normalized["non_compliance_consequences"] = data.get("non_compliance_consequences", []) or []
    normalized["cost_estimates"] = data.get("cost_estimates", []) or []
    normalized["follow_up_questions"] = data.get("follow_up_questions") or data.get("suggestions") or []
    normalized["checklist"] = data.get("checklist", []) or []
    normalized["risk_breakdown"] = data.get("risk_breakdown", []) or []
    normalized["feasibility"] = {
        "score": int(feasibility.get("score", scores.get("feasibility", 0)) or 0),
        "label": feasibility.get("label", "Moderate"),
        "note": feasibility.get("note", ""),
    }
    normalized["risk"] = {
        "score": int(risk.get("score", scores.get("risk", 0)) or 0),
        "label": risk.get("label", "Moderate"),
        "note": risk.get("note", ""),
    }
    normalized["compliance_complexity"] = {
        "score": int(compliance.get("score", scores.get("compliance", 0)) or 0),
        "label": compliance.get("label", "Moderate"),
        "note": compliance.get("note", ""),
    }
    return normalized


def build_styles():
    styles = {}

    def add(name: str, **kwargs):
        styles[name] = ParagraphStyle(name, **kwargs)

    add("cover_brand", fontName="Helvetica-Bold", fontSize=13, leading=16, textColor=TEXT_LIGHT, alignment=TA_CENTER)
    add("cover_tag", fontName="Helvetica", fontSize=9, leading=12, textColor=GOLD_SOFT, alignment=TA_CENTER)
    add("cover_title", fontName="Helvetica-Bold", fontSize=26, leading=31, textColor=colors.white, alignment=TA_CENTER)
    add("cover_subtitle", fontName="Helvetica", fontSize=11, leading=16, textColor=TEXT_LIGHT, alignment=TA_CENTER)
    add("cover_meta", fontName="Helvetica", fontSize=8.5, leading=11, textColor=GOLD_SOFT, alignment=TA_CENTER)
    add("eyebrow", fontName="Helvetica-Bold", fontSize=8.5, leading=11, textColor=GOLD, alignment=TA_LEFT)
    add("section_title", fontName="Helvetica-Bold", fontSize=18, leading=23, textColor=TEXT, alignment=TA_LEFT)
    add("section_sub", fontName="Helvetica", fontSize=10, leading=15, textColor=TEXT_MUTED, alignment=TA_LEFT)
    add("body", fontName="Helvetica", fontSize=10.3, leading=15.5, textColor=TEXT, alignment=TA_LEFT)
    add("body_muted", fontName="Helvetica", fontSize=9.4, leading=14, textColor=TEXT_MUTED, alignment=TA_LEFT)
    add("body_bold", fontName="Helvetica-Bold", fontSize=10.3, leading=15.5, textColor=TEXT, alignment=TA_LEFT)
    add("label", fontName="Helvetica-Bold", fontSize=8.2, leading=10, textColor=TEXT_MUTED, alignment=TA_LEFT)
    add("small", fontName="Helvetica", fontSize=8.6, leading=12, textColor=TEXT_MUTED, alignment=TA_LEFT)
    add("metric_value", fontName="Helvetica-Bold", fontSize=16, leading=20, textColor=TEXT, alignment=TA_LEFT)
    add("metric_label", fontName="Helvetica-Bold", fontSize=7.8, leading=10, textColor=TEXT_MUTED, alignment=TA_LEFT)
    add("metric_band", fontName="Helvetica-Bold", fontSize=8.4, leading=10.5, textColor=GOLD_SOFT, alignment=TA_LEFT)
    add("risk_title", fontName="Helvetica-Bold", fontSize=10.4, leading=14, textColor=TEXT, alignment=TA_LEFT)
    add("footer", fontName="Helvetica", fontSize=8, leading=10, textColor=TEXT_MUTED, alignment=TA_CENTER)
    add("footer_brand", fontName="Helvetica-Bold", fontSize=8.5, leading=11, textColor=GOLD, alignment=TA_CENTER)
    add("center_small", fontName="Helvetica", fontSize=8.5, leading=11, textColor=TEXT_MUTED, alignment=TA_CENTER)
    add("table_header", fontName="Helvetica-Bold", fontSize=8.2, leading=10, textColor=TEXT_LIGHT, alignment=TA_LEFT)
    add("table_body", fontName="Helvetica", fontSize=9.4, leading=13.5, textColor=TEXT, alignment=TA_LEFT)
    return styles


def draw_page_frame(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(CHARCOAL)
    canvas.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, stroke=0, fill=1)
    canvas.setStrokeColor(LINE)
    canvas.setLineWidth(0.6)
    canvas.line(MARGIN_X, PAGE_HEIGHT - 10 * mm, PAGE_WIDTH - MARGIN_X, PAGE_HEIGHT - 10 * mm)
    canvas.line(MARGIN_X, 10 * mm, PAGE_WIDTH - MARGIN_X, 10 * mm)
    canvas.setFont("Helvetica-Bold", 8)
    canvas.setFillColor(GOLD)
    canvas.drawString(MARGIN_X, PAGE_HEIGHT - 7.2 * mm, "LEGALEASE AI")
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(TEXT_MUTED)
    canvas.drawRightString(PAGE_WIDTH - MARGIN_X, PAGE_HEIGHT - 7.2 * mm, f"Page {doc.page}")
    canvas.restoreState()


def draw_cover_frame(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(CHARCOAL)
    canvas.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, stroke=0, fill=1)
    canvas.setStrokeColor(GOLD)
    canvas.setLineWidth(1.2)
    canvas.line(MARGIN_X, PAGE_HEIGHT - 18 * mm, PAGE_WIDTH - MARGIN_X, PAGE_HEIGHT - 18 * mm)
    canvas.line(MARGIN_X, 18 * mm, PAGE_WIDTH - MARGIN_X, 18 * mm)
    canvas.setFont("Helvetica-Bold", 8.5)
    canvas.setFillColor(GOLD_SOFT)
    canvas.drawString(MARGIN_X, PAGE_HEIGHT - 14 * mm, "LEGALEASE AI")
    canvas.setFont("Helvetica", 8)
    canvas.drawRightString(PAGE_WIDTH - MARGIN_X, PAGE_HEIGHT - 14 * mm, "Business Legal Analysis Report")
    canvas.restoreState()


def divider(width: float = CONTENT_WIDTH, color=LINE, thickness: float = 0.6):
    return HRFlowable(width=width, color=color, thickness=thickness, spaceBefore=0, spaceAfter=0)


def section_heading(title: str, styles, subtitle: str | None = None) -> List:
    items = [Spacer(1, 1), Paragraph(title.upper(), styles["eyebrow"]), Spacer(1, 1), Paragraph(title, styles["section_title"])]
    if subtitle:
        items.extend([Spacer(1, 1), Paragraph(clean_text(subtitle), styles["section_sub"])])
    items.extend([Spacer(1, 4), divider(), Spacer(1, 6)])
    return items


def score_accent(score: int, score_type: str) -> colors.Color:
    if score_type == "risk":
        if score <= 34:
            return SUCCESS
        if score <= 69:
            return AMBER
        return RISK
    if score >= 70:
        return SUCCESS
    if score >= 35:
        return AMBER
    return RISK


def score_band(score: int, score_type: str) -> str:
    if score_type == "risk":
        if score <= 30:
            return "Controlled"
        if score <= 60:
            return "Moderate"
        return "Elevated"
    if score >= 70:
        return "Strong"
    if score >= 45:
        return "Balanced"
    return "Weak"


def metric_cards(cards: List[Tuple[str, str]], styles) -> Table:
    card_width = CONTENT_WIDTH / max(len(cards), 1)
    rows = []
    for label, value in cards:
        rows.append(
            Table(
                [[Paragraph(clean_text(value), styles["metric_value"])], [Paragraph(clean_text(label).upper(), styles["metric_label"])]],
                colWidths=[card_width - 8],
                style=[
                    ("BACKGROUND", (0, 0), (-1, -1), CHARCOAL_PANEL),
                    ("BOX", (0, 0), (-1, -1), 0.5, LINE),
                    ("TOPPADDING", (0, 0), (-1, -1), 12),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
                    ("LEFTPADDING", (0, 0), (-1, -1), 12),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 12),
                ],
            )
        )
    table = Table([rows], colWidths=[card_width] * len(cards), hAlign="LEFT")
    table.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP")]))
    return table


def score_scale(title: str, score: int, label: str, score_type: str, styles) -> Table:
    accent = score_accent(score, score_type)
    bar_width = 138
    label_y = 1
    bar_y = 13
    drawing = Drawing(bar_width + 12, 24)
    drawing.add(Rect(6, bar_y, bar_width, 6, fillColor=CHARCOAL_SOFT, strokeColor=LINE, strokeWidth=0.2))
    drawing.add(Rect(6, bar_y, max(8, min(bar_width, int((score / 100) * bar_width))), 6, fillColor=accent, strokeColor=accent, strokeWidth=0))
    for tick in (0, 50, 100):
        x = 6 + int((tick / 100) * bar_width)
        drawing.add(Line(x, 11, x, 20, strokeColor=LINE, strokeWidth=0.4))
        anchor = "start" if tick == 0 else "end" if tick == 100 else "middle"
        drawing.add(String(x, label_y, str(tick), fillColor=TEXT_MUTED, fontName="Helvetica", fontSize=6, textAnchor=anchor))

    card = Table(
        [
            [Paragraph(title.upper(), styles["metric_label"])],
            [Paragraph(f"{score} / 100", styles["metric_value"])],
            [Paragraph(f"{score_band(score, score_type)}  ·  {clean_text(label)}", styles["metric_band"])],
            [drawing],
        ],
        colWidths=[(CONTENT_WIDTH / 3) - 10],
    )
    card.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), CHARCOAL_PANEL), ("BOX", (0, 0), (-1, -1), 0.5, LINE), ("TOPPADDING", (0, 0), (-1, -1), 8), ("BOTTOMPADDING", (0, 0), (-1, -1), 8), ("LEFTPADDING", (0, 0), (-1, -1), 10), ("RIGHTPADDING", (0, 0), (-1, -1), 10)]))
    return card


def key_panel(title: str, body: str, styles) -> Table:
    table = Table([[Paragraph(clean_text(title).upper(), styles["eyebrow"])], [Paragraph(clean_text(body), styles["body"])]], colWidths=[CONTENT_WIDTH])
    table.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), PANEL), ("BOX", (0, 0), (-1, -1), 0.6, LINE), ("LINEBEFORE", (0, 0), (0, -1), 2.5, GOLD), ("TOPPADDING", (0, 0), (-1, -1), 8), ("BOTTOMPADDING", (0, 0), (-1, -1), 8), ("LEFTPADDING", (0, 0), (-1, -1), 10), ("RIGHTPADDING", (0, 0), (-1, -1), 10)]))
    return table


def bullet_rows(items: Iterable[str], styles, marker_color=GOLD) -> List:
    flows = []
    marker_hex = marker_color.hexval()[2:] if hasattr(marker_color, "hexval") else "B89245"
    for item in items:
        row = Table(
            [[Paragraph(f"<font color='#{marker_hex}'>&#9679;</font>", styles["body"]), Paragraph(clean_text(item), styles["body"])]],
            colWidths=[10, CONTENT_WIDTH - 10],
            style=[("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0), ("TOPPADDING", (0, 0), (-1, -1), 2), ("BOTTOMPADDING", (0, 0), (-1, -1), 2)],
        )
        flows.append(row)
    return flows


def numbered_roadmap(plan: list, styles) -> List:
    flows = []
    for step in plan:
        step_num = str(step.get("step", ""))
        title = clean_text(step.get("title", "Untitled step"))
        description = clean_text(step.get("description", ""))
        meta = "  |  ".join(part for part in [clean_text(step.get("timeframe", "")), clean_text(step.get("cost", "")), clean_text(step.get("category", "")).title()] if part)
        index_table = Table(
            [[Paragraph(step_num, ParagraphStyle("step_num", fontName="Helvetica-Bold", fontSize=15, leading=18, textColor=GOLD, alignment=TA_CENTER))]],
            colWidths=[28],
            rowHeights=[28],
            style=[("BACKGROUND", (0, 0), (-1, -1), CHARCOAL_SOFT), ("BOX", (0, 0), (-1, -1), 0.6, GOLD_SOFT), ("VALIGN", (0, 0), (-1, -1), "MIDDLE")],
        )
        content_table = Table(
            [[Paragraph(title, styles["body_bold"])], [Paragraph(description, styles["body"])], [Paragraph(meta, styles["small"])]],
            colWidths=[CONTENT_WIDTH - 36],
            style=[("TOPPADDING", (0, 0), (-1, -1), 0), ("BOTTOMPADDING", (0, 0), (-1, -1), 0), ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0)],
        )
        row = Table(
            [[index_table, content_table]],
            colWidths=[36, CONTENT_WIDTH - 36],
            style=[("BACKGROUND", (0, 0), (-1, -1), CHARCOAL_PANEL), ("BOX", (0, 0), (-1, -1), 0.5, LINE), ("VALIGN", (0, 0), (-1, -1), "TOP"), ("TOPPADDING", (0, 0), (-1, -1), 12), ("BOTTOMPADDING", (0, 0), (-1, -1), 12), ("LEFTPADDING", (0, 0), (-1, -1), 12), ("RIGHTPADDING", (0, 0), (-1, -1), 12)],
        )
        flows.extend([KeepTogether([row]), Spacer(1, 5)])
    return flows


def structured_table(headers: List[str], rows: List[List[str]], widths: List[float], styles) -> Table:
    body = [[Paragraph(clean_text(cell), styles["table_header"]) for cell in headers]]
    for row in rows:
        body.append([Paragraph(clean_text(cell), styles["table_body"]) for cell in row])

    table = Table(body, colWidths=widths, repeatRows=1)
    table.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), CHARCOAL_SOFT), ("TEXTCOLOR", (0, 0), (-1, 0), TEXT_LIGHT), ("ROWBACKGROUNDS", (0, 1), (-1, -1), [CHARCOAL_PANEL, PANEL]), ("BOX", (0, 0), (-1, -1), 0.5, LINE), ("INNERGRID", (0, 0), (-1, -1), 0.35, LINE), ("TOPPADDING", (0, 0), (-1, -1), 6), ("BOTTOMPADDING", (0, 0), (-1, -1), 6), ("LEFTPADDING", (0, 0), (-1, -1), 9), ("RIGHTPADDING", (0, 0), (-1, -1), 9), ("VALIGN", (0, 0), (-1, -1), "TOP")]))
    return table


def license_checklist_items(licenses: list) -> List[str]:
    base = [f"Obtain {clean_text(lic.get('name', 'required registration'))}" for lic in licenses]
    base.extend(
        [
            "Open and operate a dedicated business bank account.",
            "Set up compliant invoicing and bookkeeping from day one.",
            "Retain registration certificates and statutory records in one place.",
            "Review contracts, employee documents, and vendor terms before launch.",
            "Schedule recurring compliance reviews with a qualified CA or legal advisor.",
        ]
    )
    return base


def derive_risk_breakdown(data: dict) -> List[dict]:
    supplied = data.get("risk_breakdown", []) or []
    if supplied:
        return supplied

    licenses = data.get("licenses", []) or []
    risks = data.get("risks", []) or []
    action_plan = data.get("action_plan", []) or []
    compliance_score = int(data.get("compliance_complexity", {}).get("score", 0) or 0)
    risk_score = int(data.get("risk", {}).get("score", 0) or 0)
    high_risks = sum(1 for item in risks if clean_text(item.get("severity", "")).lower() == "high")
    medium_risks = sum(1 for item in risks if clean_text(item.get("severity", "")).lower() == "medium")
    high_priority_licenses = sum(1 for item in licenses if clean_text(item.get("priority", "")).lower() in {"high", "critical"})

    return [
        {"label": "Licensing burden", "score": min(100, 20 + (len(licenses) * 8) + (high_priority_licenses * 7))},
        {"label": "Enforcement exposure", "score": min(100, 15 + (high_risks * 18) + (medium_risks * 10))},
        {"label": "Compliance complexity", "score": min(100, max(18, compliance_score))},
        {"label": "Execution readiness gap", "score": min(100, 25 + max(0, 6 - len(action_plan)) * 8 + max(0, risk_score - 25))},
    ]


def priority_summary(licenses: list) -> List[Tuple[str, str]]:
    return [
        ("Registrations", str(len(licenses))),
        ("High Priority", str(sum(1 for item in licenses if clean_text(item.get("priority", "")).lower() in {"high", "critical"}))),
        ("Authorities", str(len({clean_text(item.get('authority', '')) for item in licenses if clean_text(item.get('authority', ''))}))),
    ]


def mini_count_cards(cards: List[Tuple[str, str]], styles) -> Table:
    width = CONTENT_WIDTH / max(1, len(cards))
    cols = []
    for label, value in cards:
        cell = Table([[Paragraph(clean_text(value), styles["metric_value"])], [Paragraph(clean_text(label).upper(), styles["metric_label"])]], colWidths=[width - 8])
        cell.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), PANEL), ("BOX", (0, 0), (-1, -1), 0.5, LINE), ("TOPPADDING", (0, 0), (-1, -1), 10), ("BOTTOMPADDING", (0, 0), (-1, -1), 10), ("LEFTPADDING", (0, 0), (-1, -1), 12), ("RIGHTPADDING", (0, 0), (-1, -1), 12)]))
        cols.append(cell)
    grid = Table([cols], colWidths=[width] * len(cards))
    grid.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP")]))
    return grid


def breakdown_chart(breakdown: List[dict]) -> Drawing:
    row_height = 22
    drawing = Drawing(CONTENT_WIDTH - 28, max(56, len(breakdown) * row_height + 12))
    start_x = 122
    max_width = drawing.width - start_x - 38
    y = drawing.height - 16

    for item in breakdown:
        label = clean_text(item.get("label", "Category"))
        score = int(item.get("score", 0) or 0)
        accent = score_accent(score, "risk")
        fill = max(10, (score / 100) * max_width)
        drawing.add(String(0, y + 1, label, fillColor=TEXT, fontName="Helvetica", fontSize=8.5))
        drawing.add(Rect(start_x, y, max_width, 9, fillColor=CHARCOAL_SOFT, strokeColor=LINE, strokeWidth=0.3))
        drawing.add(Rect(start_x, y, fill, 9, fillColor=accent, strokeColor=accent, strokeWidth=0))
        drawing.add(String(start_x + max_width + 8, y + 1, f"{score}", fillColor=TEXT_MUTED, fontName="Helvetica-Bold", fontSize=8.5))
        y -= row_height
    return drawing


def build_cover(story: list, data: dict, styles):
    business_name = clean_text(data.get("business_name", "Business Legal Analysis"))
    subtitle = clean_text(data.get("category", "")) or "India Market Entry and Compliance Outlook"
    story.append(Spacer(1, 50 * mm))
    story.append(Paragraph("LEGALEASE AI", styles["cover_brand"]))
    story.append(Spacer(1, 6))
    story.append(Paragraph("BUSINESS LEGAL ANALYSIS REPORT", styles["cover_tag"]))
    story.append(Spacer(1, 10))
    story.append(Paragraph("Business Legal Analysis Report", styles["cover_title"]))
    story.append(Spacer(1, 6))
    story.append(Paragraph(business_name, styles["cover_subtitle"]))
    story.append(Spacer(1, 4))
    story.append(Paragraph(subtitle, styles["cover_subtitle"]))
    story.append(Spacer(1, 10))
    story.append(divider(width=72 * mm, color=GOLD_SOFT, thickness=0.8))
    story.append(Spacer(1, 10))
    story.append(Paragraph("Prepared for India launch planning", styles["cover_meta"]))
    story.append(Spacer(1, 7 * mm))
    story.append(Paragraph("Prepared by LegalEase AI as a structured legal and compliance briefing for founders, operators, and advisors.", ParagraphStyle("cover_note", fontName="Helvetica", fontSize=9.5, leading=14, textColor=TEXT_MUTED, alignment=TA_CENTER)))
    story.append(PageBreak())


def build_executive_summary(story: list, data: dict, styles):
    story.extend(section_heading("Executive Summary", styles, "A concise legal outlook for the proposed business."))
    summary = clean_text(data.get("summary", ""))
    if not summary:
        summary = "LegalEase AI has prepared an initial legal and compliance outlook based on the proposed business profile."
    story.append(Paragraph(summary, styles["body"]))
    story.append(Spacer(1, 5))
    key_insight = clean_text(data.get("key_insight", ""))
    if key_insight:
        story.append(key_panel("Key Insight", key_insight, styles))
        story.append(Spacer(1, 6))
    metric_grid = Table(
        [[
            score_scale("Feasibility", int(data.get("feasibility", {}).get("score", 0) or 0), data.get("feasibility", {}).get("label", ""), "feasibility", styles),
            score_scale("Risk", int(data.get("risk", {}).get("score", 0) or 0), data.get("risk", {}).get("label", ""), "risk", styles),
            score_scale("Compliance", int(data.get("compliance_complexity", {}).get("score", 0) or 0), data.get("compliance_complexity", {}).get("label", ""), "complexity", styles),
        ]],
        colWidths=[CONTENT_WIDTH / 3] * 3,
    )
    metric_grid.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP")]))
    story.append(metric_grid)


def build_input_snapshot(story: list, data: dict, styles):
    story.extend(section_heading("Your Input", styles, "The core business details used to generate this report."))
    rows = [
        ["Business Idea", clean_text(data.get("idea", data.get("business_name", "Business")))],
        ["Location", clean_text(data.get("location", "India"))],
        ["Scale", nice_scale(data.get("scale", ""))],
        ["Mode", nice_mode(data.get("mode", ""))],
        ["Business Type", clean_text(data.get("category", "Business"))],
        ["Report ID", clean_text(data.get("report_id", ""))],
    ]
    story.append(structured_table(["Field", "Detail"], rows, [CONTENT_WIDTH * 0.26, CONTENT_WIDTH * 0.74], styles))
    story.append(Spacer(1, 6))
    story.append(mini_count_cards([("Licenses Found", str(len(data.get("licenses", []) or []))), ("Risks Identified", str(len(data.get("risks", []) or []))), ("Action Steps", str(len(data.get("action_plan", []) or [])))], styles))


def build_penalty_summary(story: list, data: dict, styles):
    risks = data.get("risks", []) or []
    top_risk = risks[0] if risks else {}
    penalty = clean_text(top_risk.get("penalty", "Not specified"))
    title = clean_text(top_risk.get("title", "Potential penalty exposure"))
    panel = Table([[Paragraph("MAX PENALTY", styles["eyebrow"])], [Paragraph(penalty, styles["body_bold"])], [Paragraph(title, styles["small"])]], colWidths=[CONTENT_WIDTH])
    panel.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), CHARCOAL_PANEL), ("BOX", (0, 0), (-1, -1), 0.5, LINE), ("LINEBEFORE", (0, 0), (0, -1), 2.5, RISK), ("TOPPADDING", (0, 0), (-1, -1), 12), ("BOTTOMPADDING", (0, 0), (-1, -1), 12), ("LEFTPADDING", (0, 0), (-1, -1), 14), ("RIGHTPADDING", (0, 0), (-1, -1), 14)]))
    story.append(panel)


def build_roadmap(story: list, data: dict, styles):
    plan = data.get("action_plan", []) or []
    story.extend(section_heading("Compliance Plan", styles, "A chronological action plan for launch readiness."))
    if plan:
        story.extend(numbered_roadmap(plan, styles))
    else:
        story.append(Paragraph("No action plan was generated for this report.", styles["body_muted"]))


def build_licenses(story: list, data: dict, styles):
    licenses = data.get("licenses", []) or []
    story.extend(section_heading("Licenses & Registrations", styles, "Registrations and approvals most likely required before or during launch."))
    if not licenses:
        story.append(Paragraph("No specific licenses were identified for this business profile.", styles["body_muted"]))
        return
    story.append(mini_count_cards(priority_summary(licenses), styles))
    story.append(Spacer(1, 10))
    rows = []
    for lic in licenses:
        rows.append([clean_text(lic.get("name", "")), clean_text(lic.get("authority", "")), clean_text(lic.get("priority", "")).title(), f"{clean_text(lic.get('estimated_cost', ''))}  |  {clean_text(lic.get('time_to_approve', ''))}"])
    story.append(structured_table(["Registration", "Authority", "Priority", "Cost / Timeline"], rows, [CONTENT_WIDTH * 0.29, CONTENT_WIDTH * 0.25, CONTENT_WIDTH * 0.14, CONTENT_WIDTH * 0.32], styles))


def build_risks(story: list, data: dict, styles):
    risks = data.get("risks", []) or []
    story.extend(section_heading("Risk Analysis", styles, "Material legal and compliance risks that should be monitored before launch."))
    if not risks:
        story.append(Paragraph("No specific legal risks were generated for this report.", styles["body_muted"]))
        return
    for risk in risks:
        severity = clean_text(risk.get("severity", "")).title() or "Risk"
        accent = RISK if severity.lower() == "high" else AMBER if severity.lower() == "medium" else SUCCESS
        panel = Table(
            [
                [Paragraph(f"{clean_text(risk.get('title', 'Risk'))}  |  {severity}", ParagraphStyle("risk_heading", parent=styles["risk_title"], textColor=accent))],
                [Paragraph(clean_text(risk.get("description", "")), styles["body"])],
                [Paragraph(f"Relevant law: {clean_text(risk.get('law', 'Not specified'))}", styles["small"])],
                [Paragraph(f"Potential penalty or exposure: {clean_text(risk.get('penalty', 'Not specified'))}", styles["small"])],
            ],
            colWidths=[CONTENT_WIDTH],
        )
        panel.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), CHARCOAL_PANEL), ("BOX", (0, 0), (-1, -1), 0.5, LINE), ("LINEBEFORE", (0, 0), (0, -1), 2.5, accent), ("TOPPADDING", (0, 0), (-1, -1), 7), ("BOTTOMPADDING", (0, 0), (-1, -1), 7), ("LEFTPADDING", (0, 0), (-1, -1), 10), ("RIGHTPADDING", (0, 0), (-1, -1), 10)]))
        story.extend([panel, Spacer(1, 5)])


def build_checklist(story: list, data: dict, styles):
    items = data.get("checklist", []) or license_checklist_items(data.get("licenses", []) or [])
    story.extend(section_heading("Compliance Checklist", styles, "A structured pre-launch checklist for execution and review."))
    story.extend(bullet_rows(items, styles))


def build_risk_breakdown(story: list, data: dict, styles):
    breakdown = derive_risk_breakdown(data)
    story.extend(section_heading("Risk Distribution", styles, "A quick view of the score contribution by legal category."))
    if not breakdown:
        story.append(Paragraph("No detailed risk distribution was generated for this report.", styles["body_muted"]))
        return
    chart_panel = Table([[breakdown_chart(breakdown)]], colWidths=[CONTENT_WIDTH])
    chart_panel.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), CHARCOAL_PANEL), ("BOX", (0, 0), (-1, -1), 0.5, LINE), ("TOPPADDING", (0, 0), (-1, -1), 10), ("BOTTOMPADDING", (0, 0), (-1, -1), 6), ("LEFTPADDING", (0, 0), (-1, -1), 10), ("RIGHTPADDING", (0, 0), (-1, -1), 10)]))
    story.append(chart_panel)


def build_non_compliance(story: list, data: dict, styles):
    items = data.get("non_compliance_consequences", []) or []
    story.extend(section_heading("Non-Compliance Consequences", styles, "Potential business and regulatory exposure if key obligations are missed."))
    if not items:
        story.append(Paragraph("No specific non-compliance consequences were generated for this report.", styles["body_muted"]))
        return
    for item in items:
        panel = Table([[Paragraph(clean_text(item.get("area", "Area")), ParagraphStyle("nc_heading", parent=styles["risk_title"], textColor=RISK))], [Paragraph(clean_text(item.get("consequence", "")), styles["body"])]], colWidths=[CONTENT_WIDTH])
        panel.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), CHARCOAL_PANEL), ("BOX", (0, 0), (-1, -1), 0.5, LINE), ("LINEBEFORE", (0, 0), (0, -1), 2.5, RISK), ("TOPPADDING", (0, 0), (-1, -1), 10), ("BOTTOMPADDING", (0, 0), (-1, -1), 10), ("LEFTPADDING", (0, 0), (-1, -1), 14), ("RIGHTPADDING", (0, 0), (-1, -1), 14)]))
        story.extend([panel, Spacer(1, 5)])


def build_cost_estimates(story: list, data: dict, styles):
    estimates = data.get("cost_estimates", []) or []
    story.extend(section_heading("Cost Estimates", styles, "Indicative setup and compliance costs based on the current business profile."))
    if not estimates:
        story.append(Paragraph("No cost estimates were generated for this report.", styles["body_muted"]))
        return
    rows = []
    for item in estimates:
        rows.append([clean_text(item.get("item", "")), clean_text(item.get("range", "")), clean_text(item.get("notes", ""))])
    story.append(structured_table(["Item", "Estimated Range", "Notes"], rows, [CONTENT_WIDTH * 0.34, CONTENT_WIDTH * 0.24, CONTENT_WIDTH * 0.42], styles))


def build_follow_up_questions(story: list, data: dict, styles):
    questions = data.get("follow_up_questions", []) or []
    story.extend(section_heading("Suggestions", styles, "Additional prompts to refine the legal and compliance picture."))
    if not questions:
        story.append(Paragraph("No follow-up questions were generated for this report.", styles["body_muted"]))
        return
    story.extend(bullet_rows(questions, styles, marker_color=GOLD_SOFT))


def build_footer_block(story: list, data: dict, styles):
    story.append(Spacer(1, 8))
    story.append(divider())
    story.append(Spacer(1, 4))
    story.append(Paragraph("LEGALEASE AI", styles["footer_brand"]))
    report_id = clean_text(data.get("report_id", ""))
    story.append(Paragraph(f"Report ID: {report_id}", styles["footer"]))
    if data.get("report_url"):
        story.append(Paragraph(clean_text(data["report_url"]), styles["footer"]))


def generate_pdf(data: dict, output_path: str) -> str:
    normalized = _normalize(data)
    os.makedirs(os.path.dirname(output_path) if os.path.dirname(output_path) else ".", exist_ok=True)
    styles = build_styles()
    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        leftMargin=MARGIN_X,
        rightMargin=MARGIN_X,
        topMargin=MARGIN_Y,
        bottomMargin=MARGIN_Y,
        title=normalized.get("report_title") or f"LegalEase AI - {clean_text(normalized.get('business_name', 'Report'))}",
        author="LegalEase AI",
        subject="Business Legal Analysis Report",
    )

    story: List = []
    build_cover(story, normalized, styles)
    build_executive_summary(story, normalized, styles)
    story.append(Spacer(1, 8))
    build_input_snapshot(story, normalized, styles)
    story.append(Spacer(1, 8))
    build_penalty_summary(story, normalized, styles)
    story.append(PageBreak())
    build_licenses(story, normalized, styles)
    story.append(PageBreak())
    build_roadmap(story, normalized, styles)
    story.append(Spacer(1, 8))
    build_risks(story, normalized, styles)
    story.append(Spacer(1, 8))
    build_risk_breakdown(story, normalized, styles)
    story.append(Spacer(1, 8))
    build_non_compliance(story, normalized, styles)
    story.append(Spacer(1, 8))
    build_cost_estimates(story, normalized, styles)
    story.append(Spacer(1, 8))
    build_checklist(story, normalized, styles)
    story.append(Spacer(1, 14))
    build_follow_up_questions(story, normalized, styles)
    build_footer_block(story, normalized, styles)

    doc.build(story, onFirstPage=draw_cover_frame, onLaterPages=draw_page_frame)
    return output_path
