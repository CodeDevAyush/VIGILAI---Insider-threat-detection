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
├── endpoint_agent/       # Standalone Windows Monitoring Agent (Watchdog)
├── frontend/             # React + Vite Sentinel Dashboard
├── models/               # Saved ML models (Isolation Forest)
├── start_pipeline.bat    # Windows Orchestrator Script
```

| Agent Layer | Responsibility |
|-------------|----------------|
| **Endpoint Agent** | Runs natively via a Watchdog on Windows, streaming live internal telemetry (`insider/endpoint_agent`) directly into the pipeline. |
| **Trigger Agent** | Instantly catches incoming traffic and filters non-threat vectors before escalating. |
| **Detection Agent** | Connects dynamically to an `Isolation Forest` Machine Learning model. It retrieves the user's active context matrix (hourly file counts, logins) from MongoDB to natively execute Anomaly Predictions. |
| **Verification Agent** | Organic ruleset engine that analyzes threat markers against explicit Whitelists (e.g., `temp`, `whatsapp`, `appdata`) to eliminate False Positives system noise. |
| **Response Agent** | Formats confirmed threats into actionable blocks and pipes them through the persistence layer (`alerts`) for Admin control. |

---

## 🚀 Quick Start (Local Setup)

To run the pipeline natively, follow these comprehensive startup instructions.

### 0. Prerequisites
Before running the pipeline, ensure your system has the following installed:
1. **Python 3.10+** (For the FastAPI Backend & Endpoint Agent)
2. **Node.js v18+** (For the React Frontend Dashboard)
3. **MongoDB Community Server** (Used for persistence and context memory)
   - Download and install [MongoDB Community Server](https://www.mongodb.com/try/download/community).
   - Ensure the MongoDB service is actively running on the default port `localhost:27017`.

### 1. Install Dependencies
You must install the required dependencies for both the backend and frontend.

**Backend & Agent (Python):**
Open a terminal in the root `insider` directory and run:
```bash
pip install -r requirements.txt
pip install -r endpoint_agent/requirements.txt
```

**Frontend (Node.js):**
Navigate into the `frontend` folder and install the NPM packages:
```bash
cd frontend
npm install
cd ..
```

### 2. Configure Environment Variables
By default, the application expects MongoDB to be running locally. If you need to change this, create or modify the `.env` file in the root `insider` directory:
```env
MONGO_URI=mongodb://localhost:27017
MONGO_DB=Vigil-Ai
```

### 3. Launch the Pipeline Orchestrator
Instead of manually opening multiple terminals, navigate to the `insider` root directory and simply execute the orchestrator script:
```bash
.\start_pipeline.bat
```
*(You can also double-click the `start_pipeline.bat` file natively from your Windows Desktop!)*

This cleanly initiates the 3 Core Modules concurrently:
- `[PORT 8001]` **Sentinel ML Backend** (receives and processes logs natively)
- `[PORT 5173]` **React Live Dashboard** (admin interface)
- **Monitoring Agent** (The active filesystem watcher tracking directory events organically in the background)

### 4. View the Live Dashboard
Navigate to **[http://localhost:5173](http://localhost:5173)** in your web browser. You will see the Restricted Access login screen.

---

## 🔒 Dashboard Authentication

The Sentinel UI is restricted by a JWT authentication layer to prevent unauthorized access to your system's telemetry.

By default, the credentials are:
- **Username:** `admin`
- **Password:** `admin`

You can change these credentials at any time by updating your `.env` file in the root `insider` directory:
```env
ADMIN_USER=your_new_username
ADMIN_PASS=your_new_secure_password
```
*Note: Modifying the `.env` file requires you to restart the pipeline (close the terminal and run `start_pipeline.bat` again) for the changes to take effect.*

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

Your Endpoint Agent relies on its respective `config.json` inside the `endpoint_agent/agent` directory to dictate where traffic is streamed:

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
