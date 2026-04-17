"""
LegalEase AI – Risk Scoring Engine
Pure Python deterministic logic. Scores 0–100 across multiple dimensions.
No AI involved — reproducible, explainable, auditable.
"""

from typing import List, Dict, Tuple
from engines.rule_engine import RISK_WEIGHTS, SCALE_RISK_DELTA


# ── Risk Category Definitions ─────────────────────────────────────────────────

RISK_DIMENSIONS = [
    "Regulatory Risk",
    "Financial Penalty Risk",
    "Operational Compliance Risk",
    "Market & Competition Risk",
    "Legal Liability Risk",
]

CATEGORY_DIMENSION_SCORES: Dict[str, Dict[str, int]] = {
    "food": {
        "Regulatory Risk":            70,
        "Financial Penalty Risk":     60,
        "Operational Compliance Risk":75,
        "Market & Competition Risk":  55,
        "Legal Liability Risk":       65,
    },
    "fintech": {
        "Regulatory Risk":            90,
        "Financial Penalty Risk":     85,
        "Operational Compliance Risk":80,
        "Market & Competition Risk":  70,
        "Legal Liability Risk":       85,
    },
    "healthcare": {
        "Regulatory Risk":            85,
        "Financial Penalty Risk":     75,
        "Operational Compliance Risk":80,
        "Market & Competition Risk":  50,
        "Legal Liability Risk":       90,
    },
    "manufacturing": {
        "Regulatory Risk":            70,
        "Financial Penalty Risk":     65,
        "Operational Compliance Risk":75,
        "Market & Competition Risk":  60,
        "Legal Liability Risk":       60,
    },
    "export": {
        "Regulatory Risk":            65,
        "Financial Penalty Risk":     70,
        "Operational Compliance Risk":60,
        "Market & Competition Risk":  75,
        "Legal Liability Risk":       55,
    },
    "real estate": {
        "Regulatory Risk":            80,
        "Financial Penalty Risk":     75,
        "Operational Compliance Risk":70,
        "Market & Competition Risk":  65,
        "Legal Liability Risk":       80,
    },
    "ecommerce": {
        "Regulatory Risk":            45,
        "Financial Penalty Risk":     40,
        "Operational Compliance Risk":50,
        "Market & Competition Risk":  70,
        "Legal Liability Risk":       45,
    },
    "education": {
        "Regulatory Risk":            40,
        "Financial Penalty Risk":     35,
        "Operational Compliance Risk":45,
        "Market & Competition Risk":  50,
        "Legal Liability Risk":       35,
    },
    "tech": {
        "Regulatory Risk":            35,
        "Financial Penalty Risk":     30,
        "Operational Compliance Risk":40,
        "Market & Competition Risk":  65,
        "Legal Liability Risk":       40,
    },
    "logistics": {
        "Regulatory Risk":            55,
        "Financial Penalty Risk":     50,
        "Operational Compliance Risk":60,
        "Market & Competition Risk":  60,
        "Legal Liability Risk":       55,
    },
    "agriculture": {
        "Regulatory Risk":            40,
        "Financial Penalty Risk":     35,
        "Operational Compliance Risk":45,
        "Market & Competition Risk":  55,
        "Legal Liability Risk":       30,
    },
    "retail": {
        "Regulatory Risk":            40,
        "Financial Penalty Risk":     35,
        "Operational Compliance Risk":45,
        "Market & Competition Risk":  60,
        "Legal Liability Risk":       35,
    },
    "hospitality": {
        "Regulatory Risk":            65,
        "Financial Penalty Risk":     55,
        "Operational Compliance Risk":70,
        "Market & Competition Risk":  60,
        "Legal Liability Risk":       60,
    },
    "services": {
        "Regulatory Risk":            30,
        "Financial Penalty Risk":     25,
        "Operational Compliance Risk":35,
        "Market & Competition Risk":  50,
        "Legal Liability Risk":       30,
    },
}

DEFAULT_DIMENSION_SCORES = {
    "Regulatory Risk":            40,
    "Financial Penalty Risk":     35,
    "Operational Compliance Risk":40,
    "Market & Competition Risk":  50,
    "Legal Liability Risk":       35,
}

SCALE_DIMENSION_DELTA: Dict[str, int] = {
    "solo":       -5,
    "startup":    0,
    "sme":        +8,
    "enterprise": +15,
}

MODE_DELTA: Dict[str, int] = {
    "online":  -5,
    "offline":  0,
    "both":    +5,
}

# High-risk keywords that bump scores up
HIGH_RISK_KEYWORDS = [
    ("child", +15),
    ("minor", +15),
    ("alcohol", +20),
    ("drug", +15),
    ("medicine", +10),
    ("surgery", +20),
    ("cryptocurrency", +25),
    ("crypto", +25),
    ("gambling", +30),
    ("weapon", +40),
    ("explosive", +40),
    ("defence", +20),
    ("foreign", +10),
    ("cross-border", +10),
]


def calculate_risk_score(
    idea: str,
    category: str,
    scale: str,
    mode: str,
    licenses: List[dict],
) -> Tuple[int, str, List[dict]]:
    """
    Returns (overall_risk_score 0–100, explanation, breakdown_list).
    Purely deterministic.
    """
    idea_lower = idea.lower()

    # Base score from category
    base = RISK_WEIGHTS.get(category, 40)

    # Scale adjustment
    base += SCALE_RISK_DELTA.get(scale, 0)

    # Mode adjustment
    base += MODE_DELTA.get(mode, 0)

    # License count penalty
    critical_licenses = sum(1 for l in licenses if l.get("priority") == "critical")
    base += critical_licenses * 3

    # High-risk keyword scan
    keyword_bump = 0
    for keyword, delta in HIGH_RISK_KEYWORDS:
        if keyword in idea_lower:
            keyword_bump += delta

    total = min(base + keyword_bump, 100)
    total = max(total, 0)

    # Build dimension breakdown
    dim_scores = CATEGORY_DIMENSION_SCORES.get(category, DEFAULT_DIMENSION_SCORES)
    breakdown = []
    for dim, score in dim_scores.items():
        adjusted = score + SCALE_DIMENSION_DELTA.get(scale, 0) + keyword_bump // len(dim_scores)
        adjusted = min(max(adjusted, 0), 100)
        breakdown.append({"label": dim, "score": adjusted})

    # Explanation
    if total >= 70:
        explanation = f"High regulatory exposure due to {category} sector requirements and {scale} scale operations."
    elif total >= 45:
        explanation = f"Moderate risk profile — manageable with proper compliance setup for {category} businesses."
    else:
        explanation = f"Relatively low risk for a {category} business at {scale} scale."

    return total, explanation, breakdown


def calculate_feasibility_score(
    category: str,
    scale: str,
    licenses: List[dict],
    risk_score: int,
) -> Tuple[int, str]:
    """
    Returns (feasibility_score 0–100, explanation).
    Inversely correlated with risk and compliance complexity.
    """
    # Sector feasibility base (lower barrier = more feasible)
    sector_feasibility = {
        "services":      85,
        "tech":          80,
        "retail":        75,
        "ecommerce":     78,
        "education":     72,
        "agriculture":   70,
        "food":          65,
        "logistics":     65,
        "hospitality":   60,
        "manufacturing": 58,
        "export":        60,
        "real estate":   55,
        "healthcare":    52,
        "fintech":       45,
    }

    base = sector_feasibility.get(category, 65)

    # Scale impact
    scale_impact = {"solo": +5, "startup": 0, "sme": -5, "enterprise": -8}
    base += scale_impact.get(scale, 0)

    # Number of licenses reduces feasibility slightly
    base -= len(licenses) * 2

    # Risk penalty
    base -= (risk_score - 50) // 10

    score = min(max(base, 10), 95)

    if score >= 70:
        note = f"Strong viability — {category} businesses are well-supported with clear regulatory pathways."
    elif score >= 50:
        note = f"Viable with careful planning — regulatory complexity requires preparation but is manageable."
    else:
        note = f"Challenging entry — significant regulatory barriers; strongly recommend consulting a CA or lawyer first."

    return score, note
