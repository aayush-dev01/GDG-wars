"""
LegalEase AI – Deterministic Rule Engine
Maps business category + location + scale to required licenses,
base risk scores, and compliance load.

This is pure Python logic — no AI involved here.
The AI layer then ENRICHES these deterministic outputs.
"""

from dataclasses import dataclass, field
from typing import List, Dict, Tuple
import re


# ── License Rule Definitions ──────────────────────────────────────────────────

@dataclass
class LicenseRule:
    name:            str
    authority:       str
    description:     str
    cost_range:      str        # e.g. "₹0 – ₹1,000"
    time_to_approve: str
    priority:        str        # critical | high | medium
    link:            str
    keywords:        List[str]  # triggers if any keyword found in business idea
    categories:      List[str]  # triggers if category matches


LICENSE_RULES: List[LicenseRule] = [

    # ── Universal (almost every business) ────────────────────────────────────
    LicenseRule(
        name="GST Registration",
        authority="Goods and Services Tax Network (GSTN)",
        description="Mandatory for businesses with turnover above ₹20L (₹10L for special category states). Required for interstate supply of goods regardless of turnover.",
        cost_range="Free",
        time_to_approve="3–7 working days",
        priority="critical",
        link="https://www.gst.gov.in",
        keywords=["*"],
        categories=["*"],
    ),
    LicenseRule(
        name="Udyam Registration (MSME)",
        authority="Ministry of Micro, Small and Medium Enterprises",
        description="Free registration that gives access to government schemes, priority lending, and protection under MSMED Act 2006.",
        cost_range="Free",
        time_to_approve="1–2 days",
        priority="high",
        link="https://udyamregistration.gov.in",
        keywords=["*"],
        categories=["*"],
    ),
    LicenseRule(
        name="Shop and Establishment Act Registration",
        authority="State Labour Department",
        description="Mandatory for any commercial establishment, shop, or place of business. Regulates working hours, wages, and conditions.",
        cost_range="₹500 – ₹5,000",
        time_to_approve="7–15 days",
        priority="critical",
        link="https://shramsuvidha.gov.in",
        keywords=["shop", "store", "office", "studio", "outlet", "showroom", "kitchen", "restaurant", "cafe", "salon"],
        categories=["retail", "food", "services", "manufacturing"],
    ),

    # ── Food & Beverage ───────────────────────────────────────────────────────
    LicenseRule(
        name="FSSAI License",
        authority="Food Safety and Standards Authority of India (FSSAI)",
        description="Mandatory for all food businesses including manufacturing, processing, storage, distribution, and sale of food products.",
        cost_range="₹100 – ₹7,500/year",
        time_to_approve="7–30 days",
        priority="critical",
        link="https://foscos.fssai.gov.in",
        keywords=["food", "restaurant", "cafe", "kitchen", "tiffin", "catering", "bakery", "dairy", "snack", "beverage", "juice", "meal", "cook", "eat", "dining", "hotel", "canteen", "sweet", "mithai", "organic food", "cloud kitchen"],
        categories=["food", "hospitality"],
    ),
    LicenseRule(
        name="Fire NOC",
        authority="State Fire Department",
        description="No Objection Certificate from Fire Department required for restaurants, hotels, and establishments above certain floor area.",
        cost_range="₹1,000 – ₹10,000",
        time_to_approve="15–30 days",
        priority="high",
        link="https://nfsm.gov.in",
        keywords=["restaurant", "hotel", "cafe", "kitchen", "catering", "bakery", "cloud kitchen", "dine"],
        categories=["food", "hospitality"],
    ),
    LicenseRule(
        name="Eating House License",
        authority="Local Municipal Corporation / Police Commissioner",
        description="Required for any premises where food and/or beverages are served to the public.",
        cost_range="₹500 – ₹3,000/year",
        time_to_approve="7–21 days",
        priority="critical",
        link="https://mpcb.gov.in",
        keywords=["restaurant", "cafe", "dhaba", "canteen", "dine", "dining", "food court", "cloud kitchen", "tiffin"],
        categories=["food", "hospitality"],
    ),

    # ── E-Commerce / Online Business ──────────────────────────────────────────
    LicenseRule(
        name="Import Export Code (IEC)",
        authority="Directorate General of Foreign Trade (DGFT)",
        description="Mandatory for businesses engaged in import or export of goods/services.",
        cost_range="₹500",
        time_to_approve="2–3 working days",
        priority="critical",
        link="https://www.dgft.gov.in",
        keywords=["export", "import", "international", "global", "foreign"],
        categories=["export", "import", "ecommerce"],
    ),
    LicenseRule(
        name="Legal Entity Identifier (LEI) / Privacy Policy Compliance",
        authority="Ministry of Electronics and Information Technology (MeitY)",
        description="E-commerce platforms must comply with IT Act 2000, IT (Intermediary Guidelines) Rules 2021, and Consumer Protection (E-Commerce) Rules 2020.",
        cost_range="Free (legal compliance cost varies)",
        time_to_approve="Immediate (self-declaration)",
        priority="high",
        link="https://meity.gov.in",
        keywords=["online", "ecommerce", "e-commerce", "app", "platform", "marketplace", "website", "digital", "swiggy", "zomato", "amazon", "flipkart"],
        categories=["ecommerce", "tech", "digital"],
    ),

    # ── Finance / Fintech ─────────────────────────────────────────────────────
    LicenseRule(
        name="RBI Registration / NBFC License",
        authority="Reserve Bank of India (RBI)",
        description="Required for lending, payment aggregation, or financial services. Type depends on business model — NBFC, Payment Aggregator, or Prepaid Payment Instrument (PPI) license.",
        cost_range="₹2L – ₹25L (application fees)",
        time_to_approve="6–18 months",
        priority="critical",
        link="https://www.rbi.org.in",
        keywords=["loan", "lending", "fintech", "financial", "payment", "neobank", "bank", "credit", "nbfc", "insurance", "invest", "wealth", "upi", "wallet", "prepaid"],
        categories=["fintech", "finance", "banking"],
    ),
    LicenseRule(
        name="SEBI Registration",
        authority="Securities and Exchange Board of India (SEBI)",
        description="Required for investment advisors, portfolio managers, stock brokers, and mutual fund distributors.",
        cost_range="₹10,000 – ₹5,00,000",
        time_to_approve="30–90 days",
        priority="critical",
        link="https://www.sebi.gov.in",
        keywords=["stock", "trading", "investment", "broker", "portfolio", "mutual fund", "securities", "demat", "equity"],
        categories=["finance", "investment"],
    ),

    # ── Healthcare ────────────────────────────────────────────────────────────
    LicenseRule(
        name="Clinical Establishment Registration",
        authority="State Health Department / National Medical Commission",
        description="Mandatory for hospitals, clinics, diagnostic labs, and any clinical establishment under the Clinical Establishments Act 2010.",
        cost_range="₹1,000 – ₹50,000",
        time_to_approve="30–60 days",
        priority="critical",
        link="https://clinicalestablishments.gov.in",
        keywords=["hospital", "clinic", "doctor", "medical", "health", "diagnostic", "lab", "pharmacy", "dental", "ayurveda", "wellness", "therapy", "patient"],
        categories=["healthcare", "medical"],
    ),
    LicenseRule(
        name="Drug License",
        authority="Central Drugs Standard Control Organisation (CDSCO) / State FDA",
        description="Required for manufacturing, sale, or distribution of drugs and pharmaceutical products.",
        cost_range="₹3,000 – ₹25,000",
        time_to_approve="30–90 days",
        priority="critical",
        link="https://cdsco.gov.in",
        keywords=["pharmacy", "drug", "medicine", "pharmaceutical", "chemist", "medical store"],
        categories=["healthcare", "pharma"],
    ),

    # ── Education ─────────────────────────────────────────────────────────────
    LicenseRule(
        name="Education Institution Registration",
        authority="State Education Department / University Grants Commission (UGC)",
        description="Required for schools, colleges, coaching centres, and educational institutions.",
        cost_range="₹5,000 – ₹50,000",
        time_to_approve="30–90 days",
        priority="critical",
        link="https://www.ugc.ac.in",
        keywords=["school", "college", "education", "coaching", "tutoring", "institute", "academy", "edtech", "learning", "upsc", "jee", "neet", "training"],
        categories=["education", "edtech"],
    ),

    # ── Manufacturing ─────────────────────────────────────────────────────────
    LicenseRule(
        name="Factory License",
        authority="State Department of Factories and Boilers",
        description="Required if manufacturing premises employs 10+ workers with power or 20+ without power, under the Factories Act 1948.",
        cost_range="₹2,000 – ₹20,000/year",
        time_to_approve="15–45 days",
        priority="critical",
        link="https://labour.gov.in",
        keywords=["factory", "manufacturing", "production", "garment", "textile", "export", "assembly", "plant", "unit"],
        categories=["manufacturing", "export"],
    ),
    LicenseRule(
        name="Pollution Control Board NOC",
        authority="State Pollution Control Board (SPCB)",
        description="Consent to Establish (CTE) and Consent to Operate (CTO) required for industries that may cause pollution.",
        cost_range="₹5,000 – ₹2,00,000",
        time_to_approve="30–90 days",
        priority="high",
        link="https://cpcb.nic.in",
        keywords=["factory", "manufacturing", "chemical", "dyeing", "printing", "waste", "industrial", "plant", "garment", "textile"],
        categories=["manufacturing", "industrial"],
    ),

    # ── Real Estate ───────────────────────────────────────────────────────────
    LicenseRule(
        name="RERA Registration",
        authority="Real Estate Regulatory Authority (State-specific)",
        description="Mandatory for real estate agents and developers under the Real Estate (Regulation and Development) Act 2016.",
        cost_range="₹10,000 – ₹5,00,000",
        time_to_approve="30–60 days",
        priority="critical",
        link="https://rera.gov.in",
        keywords=["real estate", "property", "construction", "builder", "developer", "housing", "apartment", "flat", "plot", "realty"],
        categories=["real estate", "construction"],
    ),

    # ── Alcohol ───────────────────────────────────────────────────────────────
    LicenseRule(
        name="Excise / Liquor License",
        authority="State Excise Department",
        description="Required for manufacture, sale, or serving of alcoholic beverages. Highly regulated and state-specific.",
        cost_range="₹10,000 – ₹5,00,000+/year",
        time_to_approve="60–180 days",
        priority="critical",
        link="https://excise.gov.in",
        keywords=["alcohol", "beer", "wine", "bar", "liquor", "brewery", "distillery", "pub", "spirits"],
        categories=["hospitality", "food"],
    ),

    # ── Logistics ────────────────────────────────────────────────────────────
    LicenseRule(
        name="Motor Vehicle Permit",
        authority="State Transport Authority (STA)",
        description="Required for commercial transport operations, delivery fleet, and logistics businesses.",
        cost_range="₹1,000 – ₹10,000/vehicle",
        time_to_approve="7–21 days",
        priority="high",
        link="https://parivahan.gov.in",
        keywords=["logistics", "transport", "delivery", "courier", "fleet", "truck", "cab", "taxi", "ambulance"],
        categories=["logistics", "transport"],
    ),

    # ── Digital / App ─────────────────────────────────────────────────────────
    LicenseRule(
        name="Startup India Registration",
        authority="Department for Promotion of Industry and Internal Trade (DPIIT)",
        description="Free recognition that enables tax exemptions (80IAC), self-certification under labour/environment laws, and access to ₹10,000 Cr Fund of Funds.",
        cost_range="Free",
        time_to_approve="2–5 days",
        priority="high",
        link="https://www.startupindia.gov.in",
        keywords=["startup", "app", "platform", "saas", "tech", "software", "digital", "ai", "ml", "mobile"],
        categories=["tech", "startup", "digital"],
    ),
]


# ── State-Specific Additional Rules ──────────────────────────────────────────

STATE_EXTRA_RULES: Dict[str, List[str]] = {
    "Maharashtra": ["Gumasta License (MCGM) required for Mumbai businesses", "Maharashtra Professional Tax Registration"],
    "Delhi":       ["Delhi Pollution Control Committee NOC for manufacturing", "Trade License from MCD"],
    "Karnataka":   ["Karnataka Professional Tax Registration", "BBMP Trade License for Bengaluru"],
    "Tamil Nadu":  ["Tamil Nadu Professional Tax Registration", "CMDA/DTCP approval for construction"],
    "Gujarat":     ["Gujarat Professional Tax Registration", "GIDC allotment for industrial units"],
    "West Bengal": ["West Bengal Professional Tax Registration", "Calcutta Municipal Corporation Trade License"],
    "Kerala":      ["Kerala Professional Tax", "Tourism license for homestays/hotels"],
    "Rajasthan":   ["Rajasthan Professional Tax", "RIICO allotment for industrial units"],
    "Telangana":   ["Telangana Professional Tax", "TS-iPASS clearance for manufacturing"],
    "Uttar Pradesh":["UP Professional Tax", "Awadh Development Authority NOC for construction"],
}


# ── Category Detection ────────────────────────────────────────────────────────

CATEGORY_KEYWORDS: Dict[str, List[str]] = {
    "food":          ["food", "restaurant", "cafe", "kitchen", "tiffin", "catering", "bakery", "dairy", "snack", "meal", "cook", "dining", "hotel", "canteen", "sweet", "juice", "beverage", "cloud kitchen"],
    "fintech":       ["fintech", "loan", "lending", "payment", "neobank", "credit", "nbfc", "wallet", "upi", "insurance", "invest", "wealth", "trading"],
    "ecommerce":     ["ecommerce", "e-commerce", "online store", "marketplace", "dropship", "amazon", "flipkart", "meesho", "shopify"],
    "healthcare":    ["hospital", "clinic", "doctor", "medical", "health", "diagnostic", "lab", "pharmacy", "dental", "ayurveda", "wellness"],
    "education":     ["school", "college", "edtech", "coaching", "tutor", "training", "academy", "learning", "upsc", "jee", "neet"],
    "manufacturing": ["factory", "manufacturing", "production", "garment", "textile", "assembly", "plant", "unit"],
    "export":        ["export", "import", "international", "global", "foreign trade"],
    "real estate":   ["real estate", "property", "construction", "builder", "developer", "housing", "apartment"],
    "logistics":     ["logistics", "transport", "delivery", "courier", "fleet", "truck"],
    "tech":          ["app", "saas", "software", "platform", "ai", "ml", "digital product", "startup"],
    "agriculture":   ["farm", "agriculture", "organic", "crop", "seeds", "fertilizer", "dairy farm"],
    "retail":        ["shop", "store", "retail", "showroom", "outlet", "kirana"],
    "hospitality":   ["hotel", "resort", "hostel", "guest house", "homestay", "tourism"],
    "services":      ["consultancy", "agency", "freelance", "salon", "spa", "gym", "yoga", "fitness"],
}


# ── Risk Category Weights ─────────────────────────────────────────────────────

RISK_WEIGHTS: Dict[str, int] = {
    "food":          65,
    "fintech":       85,
    "healthcare":    80,
    "manufacturing": 70,
    "export":        60,
    "real estate":   75,
    "ecommerce":     45,
    "education":     40,
    "tech":          35,
    "logistics":     55,
    "agriculture":   45,
    "retail":        40,
    "hospitality":   60,
    "services":      35,
}

SCALE_RISK_DELTA: Dict[str, int] = {
    "solo":       -10,
    "startup":    0,
    "sme":        +10,
    "enterprise": +20,
}


# ── Main Engine Functions ─────────────────────────────────────────────────────

def detect_category(idea: str) -> str:
    """Detect primary business category from the idea text."""
    idea_lower = idea.lower()
    best_category = "services"
    best_count = 0

    for category, keywords in CATEGORY_KEYWORDS.items():
        count = sum(1 for kw in keywords if kw in idea_lower)
        if count > best_count:
            best_count = count
            best_category = category

    return best_category


def get_applicable_licenses(idea: str, category: str, location: str) -> List[dict]:
    """
    Deterministically map business to required licenses.
    Returns list of license dicts sorted by priority.
    """
    idea_lower    = idea.lower()
    found_names   = set()
    results       = []

    for rule in LICENSE_RULES:
        # Universal rules
        if "*" in rule.keywords:
            if rule.name not in found_names:
                found_names.add(rule.name)
                results.append(_rule_to_dict(rule))
            continue

        # Keyword match
        keyword_match   = any(kw in idea_lower for kw in rule.keywords)
        category_match  = category in rule.categories or "*" in rule.categories

        if keyword_match or category_match:
            if rule.name not in found_names:
                found_names.add(rule.name)
                results.append(_rule_to_dict(rule))

    # Sort: critical → high → medium
    priority_order = {"critical": 0, "high": 1, "medium": 2}
    results.sort(key=lambda x: priority_order.get(x["priority"], 3))

    return results


def _rule_to_dict(rule: LicenseRule) -> dict:
    return {
        "name":            rule.name,
        "authority":       rule.authority,
        "description":     rule.description,
        "estimated_cost":  rule.cost_range,
        "time_to_approve": rule.time_to_approve,
        "priority":        rule.priority,
        "link":            rule.link,
    }


def get_state_notes(location: str) -> List[str]:
    """Return state-specific compliance notes."""
    for state, notes in STATE_EXTRA_RULES.items():
        if state.lower() in location.lower():
            return notes
    return [f"Check {location} state-specific professional tax and municipal trade license requirements."]


def calculate_compliance_complexity(licenses: List[dict], category: str) -> int:
    """Score 0–100 based on number and type of licenses."""
    base = len(licenses) * 8
    if category in ["fintech", "healthcare"]:
        base += 20
    elif category in ["manufacturing", "export"]:
        base += 15
    elif category in ["food", "hospitality"]:
        base += 10
    critical_count = sum(1 for l in licenses if l["priority"] == "critical")
    base += critical_count * 5
    return min(base, 100)
