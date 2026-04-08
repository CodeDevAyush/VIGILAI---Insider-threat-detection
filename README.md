# 🛡️ Insider Threat AI

An AI-powered multi-agent pipeline for detecting insider threats using the **CERT Insider Threat Dataset (Release 4.2)**. The system uses an **Isolation Forest** anomaly detection model combined with rule-based verification agents to identify suspicious employee behaviour across login, USB, file, web, and email activity logs. Results are exposed via a **FastAPI REST API** and visualised in a **React + Vite** dashboard.

---

## 🏗️ Architecture

```
Monitor → Analyse → Detect → Verify → Respond → Learn
```

| Agent | Role |
|-------|------|
| `MonitoringAgent` | Loads all 5 CERT r4.2 CSVs (or synthetic scenario CSVs) using chunked reading |
| `AnalysisAgent` | Engineers 12 per-user-hour features from raw logs |
| `DetectionAgent` | Scores each row with a trained Isolation Forest model |
| `VerificationAgent` | Cross-checks anomalies with 6 rule-based heuristics |
| `ResponseAgent` | Logs confirmed threats to `data/alerts.jsonl` |
| `LearningAgent` | Retrains the model on demand |

---

## 📁 Dataset

This project uses the **CERT Insider Threat Dataset (Release 4.2)** — a benchmark dataset from Carnegie Mellon University's Software Engineering Institute.

**Download:** https://www.kaggle.com/datasets/andrihjonior/cert-insider-threat-dataset-r4-2

After downloading, extract the 5 CSV files into:

```
data/
└── cert_r4.2/
    ├── logon.csv       (~855k rows)
    ├── device.csv      (~405k rows)
    ├── file.csv        (~446k rows)
    ├── http.csv        (~28.4M rows, 13.8 GB)
    └── email.csv       (~2.6M rows)
```

> ⚠️ The dataset files are NOT included in this repo due to their size.

The pipeline also ships with **3 synthetic test scenarios** (no dataset download required):

| Scenario | Location | Description |
|----------|----------|-------------|
| Data Exfiltration | `data/test_scenarios/exfiltration/` | 5 users — after-hours USB + mass file access + suspicious URLs |
| Email Leak | `data/test_scenarios/email_leak/` | 5 users — mass emails with large attachments |
| Normal Baseline | `data/test_scenarios/normal/` | 10 normal employees — model should NOT flag these |

---

## 🚀 Quick Start

### 1. Install Python dependencies
```bash
pip install -r requirements.txt
```

### 2. Generate synthetic test data
```bash
python generate_test_data.py
```
Creates the 3 scenario directories under `data/test_scenarios/`.

### 3. Train the model
```bash
python models/train_model.py
```
Reads all 5 CERT CSVs, engineers features, and saves `models/isolation_forest.pkl`.  
*(Takes ~15–20 min depending on hardware due to the 28M-row http.csv)*

### 4. Run the full pipeline (CLI)
```bash
python pipeline.py
```

### 5. Start the FastAPI backend
```bash
python -m uvicorn api.main:app --reload --port 8000
```
API docs available at **http://localhost:8000/docs**

### 6. Launch the React dashboard
```bash
cd frontend
npm install
npm run dev
```
Open **http://localhost:5173** in your browser.

### 7. (Optional) Launch the legacy Streamlit dashboard
```bash
python -m streamlit run dashboard/app.py --browser.gatherUsageStats false
```

---

## 🌐 API Endpoints

The FastAPI backend (`api/main.py`) exposes a full REST API for the React frontend.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/datasets` | List all registered datasets and availability |
| `GET` | `/api/model/info` | Isolation Forest model metadata |
| `POST` | `/api/pipeline/run` | Run detection pipeline on a chosen dataset |
| `GET` | `/api/results/summary` | KPI summary of latest pipeline run |
| `GET` | `/api/results/threats` | Individual threat records (confirmed or all) |
| `GET` | `/api/results/users` | Per-user aggregated threat statistics |
| `GET` | `/api/results/timeline` | Hourly threat timeline (for charting) |
| `GET` | `/api/results/scores` | Anomaly score distribution (for histogram) |

**Dataset IDs** accepted by `POST /api/pipeline/run`:

| `dataset_id` | Dataset |
|---|---|
| `cert_r42_1` | CERT r4.2-1 — Known Insider Cases (real data) |
| `exfiltration` | Synthetic — Data Exfiltration Scenario |
| `email_leak` | Synthetic — Email Leak Scenario |
| `normal` | Synthetic — Normal Behavior Baseline |

---

## 📊 Features Engineered

From the 5 raw CERT log files, the `AnalysisAgent` builds a **per-user × per-hour** feature table:

| Feature | Source |
|---------|--------|
| `hour` | All logs |
| `day_of_week` | All logs |
| `is_after_hours` | Derived (hour < 7 or > 20) |
| `logon_count` | `logon.csv` |
| `logoff_count` | `logon.csv` |
| `usb_connect` | `device.csv` |
| `usb_disconnect` | `device.csv` |
| `file_count` | `file.csv` |
| `http_count` | `http.csv` |
| `email_count` | `email.csv` |
| `email_size_total` | `email.csv` |
| `email_attachments_total` | `email.csv` |

---

## 🔍 Verification Rules

Anomalies are confirmed threats if **any** rule fires:

| Rule | Condition |
|------|-----------|
| After-hours activity | Hour < 7 or > 20 |
| USB device connected | `usb_connect > 0` |
| High file volume | `file_count > 50` |
| Mass email | `email_count > 20` |
| Large email size | `email_size_total > 5 MB` |
| Excessive browsing | `http_count > 100` |

---

## 📂 Project Structure

```
insider/
├── agents/
│   ├── monitoring_agent.py     # Load 5 CERT CSVs or synthetic scenario CSVs
│   ├── analysis_agent.py       # Feature engineering (12 features, per-user-hour)
│   ├── detection_agent.py      # Isolation Forest scoring
│   ├── verification_agent.py   # Rule-based verification (6 heuristics)
│   ├── response_agent.py       # Alert logging to data/alerts.jsonl
│   └── learning_agent.py       # On-demand model retraining
├── api/
│   └── main.py                 # FastAPI REST API (React-ready, CORS enabled)
├── dashboard/
│   └── app.py                  # Legacy Streamlit dashboard
├── frontend/                   # React + Vite dashboard
│   ├── src/
│   │   ├── App.jsx             # Main app with all views and charts
│   │   ├── index.css           # Global styles
│   │   └── main.jsx            # React entry point
│   ├── package.json
│   └── vite.config.js
├── models/
│   ├── train_model.py          # Training script (saves isolation_forest.pkl)
│   └── isolation_forest.pkl    # Trained model (not in repo)
├── data/
│   ├── cert_r4.2/              # ← Place real CERT dataset here (not in repo)
│   ├── r4.2-1/                 # Curated subset: 30 known insider cases
│   ├── test_scenarios/
│   │   ├── exfiltration/       # Synthetic: 5 exfiltration users
│   │   ├── email_leak/         # Synthetic: 5 email leak users
│   │   └── normal/             # Synthetic: 10 normal users
│   └── alerts.jsonl            # Persistent alert log
├── generate_test_data.py       # Generates all 3 synthetic test scenarios
├── pipeline.py                 # End-to-end pipeline orchestrator
├── recheck_pipeline.py         # Re-runs pipeline for debugging / validation
├── test_model.py               # Standalone model evaluation with per-user report
└── requirements.txt
```

---

## 🛠️ Tech Stack

### Backend
- **Python 3.10+**
- **scikit-learn** — Isolation Forest anomaly detection
- **pandas** — data processing (chunked reading for large files)
- **FastAPI** + **Uvicorn** — REST API server
- **joblib** — model persistence

### Frontend
- **React 19** + **Vite 8** — component-based UI
- **Recharts** — interactive charts (line, bar, scatter)
- **Lucide React** — icon library
- **Axios** — HTTP client for API calls
- **React Router v7** — client-side routing

### Legacy Dashboard
- **Streamlit** — Streamlit dashboard (superseded by React frontend)
- **Plotly** — interactive charts (used in Streamlit)

---

## 📜 License

Dataset: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) — Carnegie Mellon University SEI  
Code: MIT
