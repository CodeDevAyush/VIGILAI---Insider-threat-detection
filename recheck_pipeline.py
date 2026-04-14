"""
recheck_pipeline.py
Full pipeline validation: runs every scenario + checks all components.
Run from project root: python recheck_pipeline.py
"""
import os, sys
sys.path.insert(0, ".")

from pipeline import run_pipeline

print("\n" + "="*60)
print("  INSIDER THREAT AI -- FULL PIPELINE RECHECK")
print("="*60)

# ── Model check ────────────────────────────────────────────────
import joblib
model_path = "models/isolation_forest.pkl"
if os.path.exists(model_path):
    m = joblib.load(model_path)
    print(f"\n[Model] isolation_forest.pkl loaded OK")
    print(f"        estimators={m.n_estimators}, contamination={m.contamination}, features={m.n_features_in_}")
else:
    print("[Model] MISSING — train first: python models/train_model.py")

# ── Scenario runs ──────────────────────────────────────────────
scenarios = [
    ("data/test_scenarios/exfiltration", "Exfiltration Scenario",  True),
    ("data/test_scenarios/email_leak",   "Email Leak Scenario",    True),
    ("data/test_scenarios/normal",       "Normal Baseline",        False),
    ("data/cert_r4.2",                   "Real CERT r4.2 Dataset", True),
]

results = []
for data_dir, label, expect_threats in scenarios:
    if not os.path.exists(data_dir):
        print(f"\n[SKIP] {label}: directory not found ({data_dir})")
        continue
    print(f"\n{'='*60}")
    print(f"  Running: {label}")
    print(f"{'='*60}")
    try:
        r = run_pipeline(data_dir=data_dir, score_percentile=20.0)
        status = "OK"
        results.append({
            "scenario": label,
            "total": r["total"],
            "anomalies": r["anomalies"],
            "confirmed": r["confirmed"],
            "status": status,
        })
    except Exception as e:
        print(f"  [ERROR] {e}")
        results.append({"scenario": label, "status": "ERROR", "error": str(e)})

# ── Summary table ──────────────────────────────────────────────
print("\n" + "="*60)
print("  RECHECK SUMMARY")
print("="*60)
print(f"  {'SCENARIO':<30} {'ROWS':>8} {'ANOM':>8} {'CONF':>8} {'STATUS'}")
print(f"  {'-'*30} {'-'*8} {'-'*8} {'-'*8} {'-'*8}")
for r in results:
    if r.get("status") == "OK":
        print(f"  {r['scenario']:<30} {r['total']:>8,} {r['anomalies']:>8,} {r['confirmed']:>8,}  OK")
    else:
        print(f"  {r['scenario']:<30} {'—':>8} {'—':>8} {'—':>8}  ERROR")
print()

# ── API check ──────────────────────────────────────────────────
print("[API] Checking FastAPI endpoints ...")
import urllib.request, json
try:
    with urllib.request.urlopen("http://localhost:8000/api/health", timeout=3) as resp:
        data = json.loads(resp.read())
        print(f"  /api/health       -> {data['status'].upper()}")
    with urllib.request.urlopen("http://localhost:8000/api/datasets", timeout=3) as resp:
        data = json.loads(resp.read())
        available = [d["id"] for d in data["datasets"] if d["available"]]
        unavailable = [d["id"] for d in data["datasets"] if not d["available"]]
        print(f"  /api/datasets     -> {len(data['datasets'])} datasets")
        print(f"    Available   : {available}")
        print(f"    Unavailable : {unavailable}")
    with urllib.request.urlopen("http://localhost:8000/api/model/info", timeout=3) as resp:
        data = json.loads(resp.read())
        print(f"  /api/model/info   -> {data['type']}, {data['n_estimators']} trees, {data['n_features']} features")
except Exception as e:
    print(f"  [WARNING] API not reachable: {e} — start with: python -m uvicorn api.main:app --reload")

print("\n[RECHECK COMPLETE]")
