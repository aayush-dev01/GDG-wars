import pytest
from engines.rule_engine import detect_category, get_applicable_licenses, calculate_compliance_complexity

def test_detect_category():
    assert detect_category("I want to open a restaurant") == "food"
    assert detect_category("Building a fintech app for loans") == "fintech"
    assert detect_category("A new saas platform for lawyers") == "tech"
    assert detect_category("Selling clothes on an online store") == "ecommerce"

def test_get_applicable_licenses():
    licenses = get_applicable_licenses("restaurant", "food", "Maharashtra")
    license_names = [l["name"] for l in licenses]
    assert "FSSAI License" in license_names
    assert "GST Registration" in license_names
    assert "Shop and Establishment Act Registration" in license_names

def test_compliance_complexity():
    licenses = [
        {"priority": "critical"},
        {"priority": "high"},
        {"priority": "medium"}
    ]
    # base = 3 * 8 = 24
    # critical = 1 * 5 = 5
    # total = 29
    assert calculate_compliance_complexity(licenses, "tech") == 29

    # fintech adds +20
    assert calculate_compliance_complexity(licenses, "fintech") == 49
