import pytest
from app import app
import db
import json
import tempfile
import os

@pytest.fixture
def client():
    app.config["TESTING"] = True
    
    # Use temporary file DB for tests
    fd, temp_path = tempfile.mkstemp()
    db.DB_PATH = temp_path
    db.init_db()
    
    with app.test_client() as client:
        yield client
        
    os.close(fd)
    os.remove(temp_path)

VALID_PAYLOAD = {
    "Gender": "Male",
    "Customer Type": "Returning",
    "Type of Travel": "Business",
    "Class": "Business",
    "Age": 40,
    "Flight Distance": 1200,
    "Departure Delay": 0,
    "Arrival Delay": 0,
    "Departure and Arrival Time Convenience": 3,
    "Ease of Online Booking": 3,
    "Check-in Service": 3,
    "Online Boarding": 3,
    "Gate Location": 3,
    "On-board Service": 3,
    "Seat Comfort": 3,
    "Leg Room Service": 3,
    "Cleanliness": 3,
    "Food and Drink": 3,
    "In-flight Service": 4,
    "In-flight Wifi Service": 2,
    "In-flight Entertainment": 3,
    "Baggage Handling": 4
}

def get_history_count(table):
    with db.get_db() as conn:
        return conn.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]

def test_valid_prediction(client):
    count_before = get_history_count("satisfaction_predictions")
    res = client.post("/api/predict", json=VALID_PAYLOAD)
    assert res.status_code == 200
    data = res.get_json()
    assert "prediction" in data
    
    count_after = get_history_count("satisfaction_predictions")
    assert count_after == count_before + 1

def test_valid_cluster(client):
    count_before = get_history_count("cluster_predictions")
    res = client.post("/api/cluster", json=VALID_PAYLOAD)
    assert res.status_code == 200
    data = res.get_json()
    assert "cluster_id" in data
    
    count_after = get_history_count("cluster_predictions")
    assert count_after == count_before + 1

def test_missing_field(client):
    count_before = get_history_count("satisfaction_predictions")
    payload = VALID_PAYLOAD.copy()
    del payload["Age"]
    
    res = client.post("/api/predict", json=payload)
    assert res.status_code == 422
    data = res.get_json()
    assert "error" in data
    assert "Age" in data["details"]
    assert "Field is required." in data["details"]["Age"]
    
    # Ensure DB not modified
    assert get_history_count("satisfaction_predictions") == count_before

def test_invalid_categorical_value(client):
    payload = VALID_PAYLOAD.copy()
    payload["Class"] = "Premium"
    
    res = client.post("/api/predict", json=payload)
    assert res.status_code == 422
    data = res.get_json()
    assert "Class" in data["details"]
    assert "Invalid value" in data["details"]["Class"]

def test_numerical_outside_range(client):
    payload = VALID_PAYLOAD.copy()
    payload["Age"] = 150
    
    res = client.post("/api/predict", json=payload)
    assert res.status_code == 422
    data = res.get_json()
    assert "Age" in data["details"]
    assert "Invalid value" in data["details"]["Age"]

def test_null_value(client):
    payload = VALID_PAYLOAD.copy()
    payload["Check-in Service"] = None
    
    res = client.post("/api/predict", json=payload)
    assert res.status_code == 422
    data = res.get_json()
    assert "Check-in Service" in data["details"]
    assert "Field is required" in data["details"]["Check-in Service"]

def test_wrong_data_type(client):
    payload = VALID_PAYLOAD.copy()
    payload["Age"] = "forty"
    
    res = client.post("/api/predict", json=payload)
    assert res.status_code == 422
    data = res.get_json()
    assert "Age" in data["details"]
    assert "Invalid type" in data["details"]["Age"]
    
def test_boolean_instead_of_number(client):
    payload = VALID_PAYLOAD.copy()
    payload["Age"] = True
    
    res = client.post("/api/predict", json=payload)
    assert res.status_code == 422
    data = res.get_json()
    assert "Age" in data["details"]
    assert "Invalid type" in data["details"]["Age"]

def test_unexpected_field(client):
    payload = VALID_PAYLOAD.copy()
    payload["Extra_Column"] = "Hacker"
    
    res = client.post("/api/predict", json=payload)
    assert res.status_code == 422
    data = res.get_json()
    assert "Extra_Column" in data["details"]
    assert "Unexpected field" in data["details"]["Extra_Column"]

def test_malformed_json(client):
    res = client.post("/api/predict", data="{bad_json:", headers={"Content-Type": "application/json"})
    assert res.status_code == 400

def test_empty_request(client):
    res = client.post("/api/predict", json={})
    assert res.status_code in (400, 422)
    data = res.get_json()
    assert "error" in data

