import os
import sys
import pandas as pd
import joblib
from datetime import datetime
from pymongo import MongoClient

from .verification import verification_agent

PROJECT_ROOT = os.path.join(os.path.dirname(__file__), "..", "..")
MODEL_PATH = os.path.join(PROJECT_ROOT, "models", "isolation_forest.pkl")

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
client = MongoClient(MONGO_URI)
db = client["Vigil-Ai"]

_model = None

def _load_model():
    global _model
    if _model is None and os.path.exists(MODEL_PATH):
        try:
            _model = joblib.load(MODEL_PATH)
        except Exception as e:
            print(f"[Detection] Failed to load ML model: {e}")
    return _model

def _get_hourly_features(user: str, target_time_iso: str) -> pd.DataFrame:
    try:
        dt = datetime.fromisoformat(target_time_iso.replace("Z", "+00:00"))
        hour = dt.hour
        day_of_week = dt.weekday()
    except Exception:
        hour = 12
        day_of_week = 0
        
    is_after_hours = 1 if hour < 7 or hour > 20 else 0
    hour_prefix = target_time_iso[:13] 
    
    cursor = db.logs.find({
        "user": user,
        "timestamp": {"$regex": f"^{hour_prefix}"}
    })
    
    file_count = 0
    for doc in cursor:
        etype = doc.get("event_type", "").lower()
        if "file" in etype:
            file_count += 1
            
    feats = {
        "hour": [hour],
        "day_of_week": [day_of_week],
        "is_after_hours": [is_after_hours],
        "logon_count": [0],
        "logoff_count": [0],
        "usb_connect": [0],
        "usb_disconnect": [0],
        "file_count": [file_count],
        "http_count": [0],
        "email_count": [0],
        "email_size_total": [0.0],
        "email_attachments_total": [0.0],
    }
    
    # Must order consistently with the trained model columns
    df = pd.DataFrame(feats)
    return df

def run_model(log):
    model = _load_model()
    is_high_risk = log.get("is_high_risk_ext", False)
    is_sensitive = log.get("is_sensitive_path", False)
    if is_high_risk and is_sensitive:
        return "suspicious"
        
    if model is None:
        if log.get("file_size", 0) > 1000 * 1024:
            return "suspicious"
        return "normal"
        
    feature_df = _get_hourly_features(log.get("user", "unknown"), log.get("timestamp"))
    try:
        prediction = model.predict(feature_df)
        if prediction[0] == -1:
            return "suspicious"
    except Exception as e:
        print(f"[Detection] ML prediction failed: {e}")
        
    return "normal"

def detection_agent(log):
    result = run_model(log)

    if result == "suspicious":
        print("[Detection] Anomalous context marked suspicious by ML! Forwarding...")
        db.logs.update_one({"_id": log["_id"]}, {"$set": {"status": "suspicious"}})
        return verification_agent(log)

    db.logs.update_one({"_id": log["_id"]}, {"$set": {"status": "normal"}})
    return {"status": "normal"}
