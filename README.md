# 🛡️ Sentinel: Event-Driven Agentic AI Pipeline

Sentinel is an advanced, autonomous multi-agent pipeline designed to natively detect Insider Threats and data exfiltration. Transitioning away from legacy CSV dataset batching, Sentinel now features a fully **Event-Driven Architecture** that monitors Native Windows Filesystems in real-time. 

Logs are dynamically streamed to a **FastAPI** backend where autonomous Machine Learning agents isolate anomalies securely, passing results to an active **React + Vite** Live Dashboard.

---

## 🏗️ Multi-Agent Architecture

```text
Endpoint Monitor (Port 8000/Local) → FastAPI (Port 8001) → Trigger → Detection (ML) → Verification → Response
```

### Directory Structure
```text
insider/
├── api/                  # FastAPI backend
│   ├── agents/           # ML Pipeline (Trigger, Detection, Verification, Response)
│   └── main.py           # Core API & routing
├── frontend/             # React + Vite Sentinel Dashboard
├── models/               # Saved ML models (Isolation Forest)
├── start_pipeline.bat    # Windows Orchestrator Script
```

| Agent Layer | Responsibility |
|-------------|----------------|
| **Endpoint Agent** | Runs natively via a Watchdog on Windows, streaming live internal telemetry (`E:\Monitoring Agent`) directly into the pipeline. |
| **Trigger Agent** | Instantly catches incoming traffic and filters non-threat vectors before escalating. |
| **Detection Agent** | Connects dynamically to an `Isolation Forest` Machine Learning model. It retrieves the user's active context matrix (hourly file counts, logins) from MongoDB to natively execute Anomaly Predictions. |
| **Verification Agent** | Organic ruleset engine that analyzes threat markers against explicit Whitelists (e.g., `temp`, `whatsapp`, `appdata`) to eliminate False Positives system noise. |
| **Response Agent** | Formats confirmed threats into actionable blocks and pipes them through the persistence layer (`alerts`) for Admin control. |

---

## 🚀 Quick Start (Local Setup)

The architecture has been unified for an ultra-fast startup via the local orchestration script.

### 1. Launch the Pipeline Orchestrator
Instead of opening multiple terminals, navigate to the `insider` root directory and simply execute:
```bash
start_pipeline.bat
```
*(You can also double-click the script natively from your Windows Desktop!)*

This cleanly initiates the 3 Core Modules concurrently:
- `[PORT 8001]` **Sentinel ML Backend** (receives and processes logs natively)
- `[PORT 5173]` **React Live Dashboard** (admin interface)
- **Monitoring Agent** (The active filesystem watcher tracking directory events organically in the background)

### 2. View the Live Dashboard
Navigate to **[http://localhost:5173](http://localhost:5173)**. You will see an Autonomous Feed tracking system logs actively, supported by KPI graphics displaying current anomalies.

---

## 🚨 Threat Generation & Testing

There are two primary methods to trigger the Machine Learning detection engines to confirm your pipeline is operating securely:

### Method A: Organic Native Detection (Real-World)
Because the `Monitoring Agent` sits actively on your operating system, any highly suspicious activity natively executed inside watched directories will be caught!

1. Open a system directory like `C:\Users\YOUR_NAME\Downloads`
2. Aggressively transfer or build a massive set of bulk `.csv` documents or manipulate a `.exe` executable file natively.
3. Within 5-seconds, the Endpoint watchdog will beam the activity batch to Sentinel. The ML model will instantly recognize the deviation in normal feature counts, override whitelists, and populate an Alert on your browser!

### Method B: Simulated Burst Traffic
Since the pipeline is event-driven, you can rapidly trigger alerts by generating massive file system changes simultaneously.

**What to do:**
1. Download a large `.zip` file from the internet, or extract an existing large project inside your `Downloads` or `Documents` folder.
2. The ML model tracks the speed and volume of events. A sudden burst of 50+ file modifications in less than a second will aggressively spike your Anomaly Score.
3. The Verification Agent will classify this as `burst_file_access` or `suspicious_executable` (if it contains binaries).
4. Critical Alerts will instantly render on the web UI!

---

## 🛠️ Admin Action Control

Inside the `Sentinel Dashboard` feed, confirmed threats are not completely static. We have deployed Action Modules natively on the frontend:
- **[Dismiss]**: Destroys the false-positive alert natively off the API.
- **[Block]**: Flags the task organically as `device_blocked` via MongoDB and paints a **[BLOCKED]** warning over the User ID preventing any further pipeline interactions.

---

## ⚙️ Configuration Overrides

Your Endpoint Agent relies on its respective `config.json` inside the `Monitoring Agent` directory to dictate where traffic is streamed:

```json
{
  "device_id": "PC_001",
  "server_url": "http://localhost:8001",
  "log_interval": 5,
  "watch_paths": [
    "ALL_DRIVES"
  ]
}
```
*Note: Ensure `server_url` points directly to the Sentinel port `8001` or your Live Stream will skip the Trigger Agents!*
