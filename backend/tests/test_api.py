import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_analyze_endpoint():
    payload = {
        "idea": "I want to start a cloud kitchen in Mumbai",
        "location": "Maharashtra",
        "scale": "startup",
        "mode": "hybrid",
        "email": "test@example.com"
    }
    response = client.post("/api/analyze", json=payload)
    
    assert response.status_code == 200
    data = response.json()
    assert "report_id" in data
    assert "licenses" in data
    assert any("FSSAI" in l["name"] for l in data["licenses"])
    assert data["category"] == "food"
