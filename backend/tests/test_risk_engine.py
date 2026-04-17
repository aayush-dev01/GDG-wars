import pytest
from engines.risk_engine import calculate_risk_score, calculate_feasibility_score

def test_calculate_risk_score():
    idea = "Opening a high-scale factory"
    category = "manufacturing"
    scale = "enterprise"
    mode = "physical"
    licenses = [{"name": "Factory License"}]
    
    score, note, breakdown = calculate_risk_score(idea, category, scale, mode, licenses)
    
    assert score > 50  # Enterprise manufacturing should be high risk
    assert "manufacturing" in note.lower()
    assert len(breakdown) > 0

def test_calculate_feasibility_score():
    category = "tech"
    scale = "startup"
    licenses = [{"name": "Startup India"}]
    risk_score = 20
    
    score, note = calculate_feasibility_score(category, scale, licenses, risk_score)
    
    assert score > 70  # Low risk tech startup should be highly feasible
    assert "viable" in note.lower()
