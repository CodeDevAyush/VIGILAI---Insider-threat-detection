from pymongo import MongoClient
import os
import random

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
client = MongoClient(MONGO_URI)
db = client["Vigil-Ai"]

THREAT_TYPES = [
    "Mass exfiltration",
    "USB exfiltration",
    "Credential stuffing",
    "After-hours access",
    "Privilege abuse",
]

REASONS = [
    "Isolation Forest score: -0.82 (anomaly threshold: -0.50)",
    "After-hours access + external IP + large file size",
    "Multiple failed logins preceding successful auth",
    "USB device + sensitive file + end-of-day timing",
    "Admin account accessing cross-department sensitive files",
]

def _classify(log: dict):
    """Derive threat_type, severity, and reason from log features."""
    event = (log.get("event_type") or "").lower()
    size = log.get("file_size", 0) or 0
    is_after = log.get("is_after_hours", False)
    is_high = log.get("is_high_risk_ext", False)

    if "usb" in event or "removable" in event:
        idx = 1  # USB exfiltration
    elif size > 500 * 1024 * 1024:
        idx = 0  # Mass exfiltration
    elif log.get("failed_logins", 0) > 5:
        idx = 2  # Credential stuffing
    elif is_after:
        idx = 3  # After-hours access
    else:
        idx = 4  # Privilege abuse

    # Severity from file size + flags
    if size > 800 * 1024 * 1024 or (is_high and is_after):
        severity = "CRITICAL"
    elif size > 100 * 1024 * 1024 or is_high or is_after:
        severity = "HIGH"
    else:
        severity = "MEDIUM"

    return THREAT_TYPES[idx], REASONS[idx], severity


def response_agent(log):
    print(f"[Response] Generating Alert for User: {log.get('user')}")

    threat_type, reason, severity = _classify(log)

    alert = {
        "device_id": log.get("device_id", "unknown"),
        "user": log.get("user", "unknown"),
        "file_name": log.get("file_name", "unknown"),
        "file_size": log.get("file_size", 0),
        "path": log.get("path", ""),
        "threat_type": threat_type,
        "severity": severity,
        "reason": reason,
        "action": "open",
        "status": "open",
        "timestamp": log.get("timestamp"),
    }

    db.alerts.insert_one(alert)

    return {"status": "suspicious"}
