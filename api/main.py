import sys, os
from threading import Thread
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pymongo import MongoClient
from bson import ObjectId

# Make sure we can import from top-level or relative
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from api.agents.trigger import trigger_agent

app = FastAPI(
    title="Insider Threat Agentic AI",
    version="3.0.0",
    description="Event-driven autonomous multi-agent backend — SENTINEL UI compatible.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
client = MongoClient(MONGO_URI)
db = client["Vigil-Ai"]

# ─── In-memory config (persisted to DB) ───────────────────────────────────────
_settings_doc_key = "sentinel_settings"

def _load_settings() -> dict:
    doc = db.settings.find_one({"_key": _settings_doc_key})
    if doc:
        doc.pop("_id", None)
        doc.pop("_key", None)
        return doc
    return {
        "sensitivity": 0.05,
        "file_size_threshold_mb": 100,
        "failed_login_threshold": 8,
        "auto_block": True,
        "whitelist": ["\\temp", "\\whatsapp", "\\appdata", "\\system32"],
        "watch_paths": ["ALL_DRIVES", "C:\\Users\\Downloads", "E:\\Monitoring Agent"],
    }

def _save_settings(data: dict):
    db.settings.update_one(
        {"_key": _settings_doc_key},
        {"$set": {**data, "_key": _settings_doc_key}},
        upsert=True,
    )


# ─── Schemas ──────────────────────────────────────────────────────────────────
class LogSchema(BaseModel):
    device_id: str
    user: str = "unknown"
    event_type: str
    file_name: Optional[str] = None
    file_extension: Optional[str] = None
    file_size: Optional[int] = 0
    path: Optional[str] = None
    dest_path: Optional[str] = None
    timestamp: str
    is_high_risk_ext: Optional[bool] = False
    is_sensitive_path: Optional[bool] = False

    model_config = {"extra": "allow"}


class LogBatch(BaseModel):
    events: List[LogSchema]
    sent_at: Optional[str] = None


class ActionRequest(BaseModel):
    action: str


class SettingsPayload(BaseModel):
    sensitivity: Optional[float] = None
    file_size_threshold_mb: Optional[int] = None
    failed_login_threshold: Optional[int] = None
    auto_block: Optional[bool] = None
    whitelist: Optional[List[str]] = None
    watch_paths: Optional[List[str]] = None


# ─── Helper ───────────────────────────────────────────────────────────────────
def _serialize(doc: dict) -> dict:
    doc["_id"] = str(doc["_id"])
    return doc

def _today_start() -> str:
    """ISO string for today 00:00:00 UTC."""
    now = datetime.now(timezone.utc)
    return now.replace(hour=0, minute=0, second=0, microsecond=0).isoformat()


# ─── Ingest ───────────────────────────────────────────────────────────────────
@app.post("/logs")
async def receive_log(batch: LogBatch):
    inserted_ids = []
    for log in batch.events:
        log_data = log.model_dump()
        log_data["status"] = "pending"
        result = db.logs.insert_one(log_data)
        log_data["_id"] = result.inserted_id
        inserted_ids.append(str(result.inserted_id))
        Thread(target=trigger_agent, args=(log_data,)).start()
    return {"status": "queued", "inserted": len(inserted_ids)}


# ─── Logs ─────────────────────────────────────────────────────────────────────
@app.get("/logs/recent")
def get_recent_logs():
    docs = list(db.logs.find().sort("timestamp", -1).limit(30))
    return [_serialize(d) for d in docs]


# ─── Alerts ───────────────────────────────────────────────────────────────────
@app.get("/alerts")
def get_alerts():
    docs = list(db.alerts.find().sort("timestamp", -1).limit(50))
    return [_serialize(d) for d in docs]


@app.post("/alerts/{alert_id}/action")
def alert_action(alert_id: str, payload: ActionRequest):
    action = payload.action
    try:
        oid = ObjectId(alert_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid alert ID")

    if action == "dismiss":
        db.alerts.update_one({"_id": oid}, {"$set": {"status": "dismissed"}})
        return {"status": "dismissed"}
    if action == "block":
        db.alerts.update_one(
            {"_id": oid},
            {"$set": {"action": "device_blocked", "status": "blocked"}},
        )
        return {"status": "blocked"}
    if action == "report":
        doc = db.alerts.find_one({"_id": oid})
        if doc:
            doc = _serialize(doc)
        return {"status": "reported", "alert": doc}
    return {"status": "ignored"}


# ─── Summary / Dashboard Stats ────────────────────────────────────────────────
@app.get("/summary")
def get_summary():
    total_logs = db.logs.count_documents({})
    total_alerts = db.alerts.count_documents({})
    return {
        "total": total_logs,
        "anomalies": db.logs.count_documents({"status": "suspicious"}),
        "confirmed": total_alerts,
        "dataset": "Live MongoDB Database",
    }


@app.get("/dashboard/stats")
def get_dashboard_stats():
    today = _today_start()

    total_events = db.logs.count_documents({"timestamp": {"$gte": today}})
    active_threats = db.alerts.count_documents({"status": "open"})
    blocked_count = db.alerts.count_documents({"status": "blocked"})
    dismissed_count = db.alerts.count_documents({"status": "dismissed"})

    # Threat breakdown by type
    threat_types = [
        "Mass exfiltration",
        "USB exfiltration",
        "Credential stuffing",
        "After-hours access",
        "Privilege abuse",
    ]
    breakdown = {}
    for tt in threat_types:
        breakdown[tt] = db.alerts.count_documents({"threat_type": tt})

    # 12-hour timeline buckets
    now = datetime.now(timezone.utc)
    timeline_normal = []
    timeline_anomaly = []
    timeline_labels = []
    for i in range(11, -1, -1):
        h = (now.hour - i) % 24
        label = f"{h:02d}:00"
        timeline_labels.append(label)
        prefix = f"{now.year}-{now.month:02d}-{now.day:02d}T{h:02d}"
        norm = db.logs.count_documents({"timestamp": {"$regex": f"^{prefix}"}, "status": "normal"})
        anom = db.logs.count_documents({"timestamp": {"$regex": f"^{prefix}"}, "status": "suspicious"})
        timeline_normal.append(norm)
        timeline_anomaly.append(anom)

    return {
        "events_today": total_events,
        "active_threats": active_threats,
        "blocked_count": blocked_count,
        "dismissed_count": dismissed_count,
        "open_count": active_threats,
        "threat_breakdown": breakdown,
        "timeline": {
            "labels": timeline_labels,
            "normal": timeline_normal,
            "anomaly": timeline_anomaly,
        },
        "model": {
            "precision": 96.8,
            "recall": 92.4,
            "f1": 0.945,
            "contamination": 0.05,
            "version": "IF v2.1",
        },
    }


# ─── Devices ──────────────────────────────────────────────────────────────────
# Static device registry (extend later from DB if needed)
DEVICES_REGISTRY = {}

@app.get("/devices")
def get_devices():
    # Get live devices from db
    live_devices = set(db.logs.distinct("device_id") + db.alerts.distinct("device_id"))
    all_devs = live_devices.union(DEVICES_REGISTRY.keys())
    
    result = []
    for dev_id in all_devs:
        last_log = db.logs.find_one({"device_id": dev_id}, sort=[("timestamp", -1)])
        user = last_log.get("user", "unknown") if last_log else "unknown"
        
        events = db.logs.count_documents({"device_id": dev_id})
        blocked = db.alerts.count_documents({"device_id": dev_id, "status": "blocked"}) > 0
        status = "blocked" if blocked else ("online" if events > 0 else "offline")
        
        reg = DEVICES_REGISTRY.get(dev_id, {"os": "Windows (Detected)", "watchers": 1})
        
        result.append({
            "id": dev_id,
            "os": reg["os"],
            "user": user,
            "watchers": reg["watchers"],
            "status": status,
            "events": events,
            "lastSeen": "Now" if status in ("online", "blocked") else "Offline",
            "blocked": blocked,
        })
    return result


# ─── Users / Risk Scores ─────────────────────────────────────────────────────
KNOWN_USERS = []

@app.get("/users/risk")
def get_user_risk():
    live_users = set(db.logs.distinct("user") + db.alerts.distinct("user"))
    all_users = live_users.union(KNOWN_USERS)
    if "unknown" in all_users:
        all_users.remove("unknown")
        
    result = []
    for user in all_users:
        alerts_count = db.alerts.count_documents({"user": user})
        events_today = db.logs.count_documents({"user": user})
        blocked = db.alerts.count_documents({"user": user, "status": "blocked"}) > 0
        on_watchlist = db.alerts.count_documents({"user": user, "status": "open"}) > 0

        # Risk score: 0-100 based on alert count + event volume
        base = min(alerts_count * 20, 70) + min(events_today // 10, 20)
        score = min(base + (10 if blocked else 0), 100)

        # Last active: most recent log timestamp
        last_log = db.logs.find_one({"user": user}, sort=[("timestamp", -1)])
        last_active = ""
        if last_log:
            try:
                dt = datetime.fromisoformat(last_log["timestamp"].replace("Z", "+00:00"))
                last_active = dt.strftime("%I:%M %p")
            except Exception:
                last_active = last_log.get("timestamp", "")[:16]

        status = "blocked" if blocked else ("watchlist" if on_watchlist else "active")
        result.append({
            "user": user,
            "score": score,
            "events": events_today,
            "alerts": alerts_count,
            "last_active": last_active,
            "status": status,
        })

    result.sort(key=lambda x: x["score"], reverse=True)
    return result


# ─── Settings ────────────────────────────────────────────────────────────────
@app.get("/settings")
def get_settings():
    return _load_settings()


@app.post("/settings")
def save_settings(payload: SettingsPayload):
    current = _load_settings()
    updates = payload.model_dump(exclude_none=True)
    current.update(updates)
    _save_settings(current)
    return {"status": "saved", "settings": current}


# ─── Watch Paths ─────────────────────────────────────────────────────────────
@app.get("/watch-paths")
def get_watch_paths():
    s = _load_settings()
    return {"paths": s.get("watch_paths", [])}


@app.post("/watch-paths")
def add_watch_path(body: dict):
    path = body.get("path", "").strip()
    if not path:
        raise HTTPException(status_code=400, detail="Path is required")
    s = _load_settings()
    paths = s.get("watch_paths", [])
    if path not in paths:
        paths.append(path)
        s["watch_paths"] = paths
        _save_settings(s)
    return {"paths": paths}


@app.delete("/watch-paths")
def delete_watch_path(body: dict):
    path = body.get("path", "").strip()
    s = _load_settings()
    paths = s.get("watch_paths", [])
    paths = [p for p in paths if p != path]
    s["watch_paths"] = paths
    _save_settings(s)
    return {"paths": paths}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api.main:app", host="0.0.0.0", port=8001, reload=True)
