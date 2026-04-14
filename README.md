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

## 🚀 Quick Start (Local Setup)

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Generate Synthetic Test Data
```bash
python generate_test_data.py
```
Creates the 3 scenario directories under `data/test_scenarios/`.

### 3. Train the Model
```bash
python models/train_model.py
```
Reads all 5 CERT CSVs, engineers features, and saves `models/isolation_forest.pkl`.  
*(Takes ~15–20 min depending on hardware due to the 28M-row http.csv)*

### 4. Run the Full Pipeline (CLI)
```bash
python pipeline.py
```

### 5. Start the FastAPI Backend
```bash
# MacOS/Linux
./scripts/run_backend.sh

# Windows (Powershell)
.\scripts\run_backend.ps1
```
API docs available at **http://localhost:8000/docs**

### 6. Launch the React Dashboard
```bash
# MacOS/Linux
./scripts/run_frontend.sh

# Windows (Powershell)
.\scripts\run_frontend.ps1
```
Open **http://localhost:5173** in your browser.

---

## 🐳 Docker Deployment

You can run the entire application stack using Docker Compose:

1. Copy the `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Generate the test data and train the model locally as seen in Quick Start.

3. Start the services:
   ```bash
   docker-compose up --build
   ```
- Frontend available at **http://localhost:5173**
- Backend API at **http://localhost:8000**

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

---

## 📂 Project Structure

```
insider/
├── Dockerfile                  # Backend API Dockerfile
├── docker-compose.yml          # Container configuration for backend + frontend
├── .env.example                # Environment variables reference
├── agents/
│   ├── monitoring_agent.py     # Load 5 CERT CSVs or synthetic scenario CSVs
│   ├── analysis_agent.py       # Feature engineering (12 features, per-user-hour)
│   ├── detection_agent.py      # Isolation Forest scoring
│   ├── verification_agent.py   # Rule-based verification (6 heuristics)
│   ├── response_agent.py       # Alert logging to data/alerts.jsonl
│   └── learning_agent.py       # On-demand model retraining
├── api/
│   └── main.py                 # FastAPI REST API (React-ready, CORS enabled)
├── frontend/                   # React + Vite dashboard
│   ├── src/
│   │   ├── App.jsx             # Main app with all views and charts
│   │   ├── index.css           # Global styles
│   │   └── main.jsx            # React entry point
│   ├── Dockerfile              # Frontend container file
│   └── package.json
├── models/
│   ├── train_model.py          # Training script (saves isolation_forest.pkl)
│   └── isolation_forest.pkl    # Trained model (not in repo)
├── scripts/                    # Helper scripts for startup
├── data/
│   ├── cert_r4.2/              # ← Place real CERT dataset here (not in repo)
│   ├── test_scenarios/         # Generated synthetic datasets
│   └── alerts.jsonl            # Persistent alert log
├── generate_test_data.py       # Generates all 3 synthetic test scenarios
├── pipeline.py                 # End-to-end pipeline orchestrator
├── recheck_pipeline.py         # Re-runs pipeline for debugging / validation
└── requirements.txt            # Streamlined Python dependencies
```

---

## 📜 License

Dataset: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) — Carnegie Mellon University SEI  
Code: MIT
