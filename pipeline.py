# pipeline.py
# Orchestrates all agents in sequence: Monitor → Analyse → Detect → Verify → Respond → Learn

from agents.monitoring_agent import MonitoringAgent
from agents.analysis_agent import AnalysisAgent
from agents.detection_agent import DetectionAgent
from agents.verification_agent import VerificationAgent
from agents.response_agent import ResponseAgent
from agents.learning_agent import LearningAgent


def run_pipeline(
    log_source: str = "data/logs.csv",
    model_path: str = "models/isolation_forest.pkl",
    retrain: bool = False,
) -> dict:
    print("\n=== Insider Threat AI Pipeline ===\n")

    # 1. Collect logs
    monitor = MonitoringAgent(log_source=log_source)
    raw_logs = monitor.run()

    # 2. Pre-process & feature engineer
    analyser = AnalysisAgent()
    df_features = analyser.run(raw_logs)

    # 3. Detect anomalies
    detector = DetectionAgent(model_path=model_path)
    df_scored = detector.run(df_features)

    # 4. Verify flagged records with rule-based checks
    verifier = VerificationAgent()
    df_verified = verifier.run(df_scored)

    # 5. Respond to confirmed threats
    responder = ResponseAgent()
    responder.run(df_verified)

    # 6. Optionally retrain model with new data
    if retrain:
        learner = LearningAgent(model_path=model_path)
        learner.run(df_features)

    summary = {
        "total": len(df_features),
        "anomalies": int(df_scored["is_anomaly"].sum()),
        "confirmed": int(df_verified.get("confirmed_threat", False).sum()),
        "verified_df": df_verified,
    }

    print("\n=== Pipeline Complete ===")
    print(f"  Total records   : {summary['total']}")
    print(f"  Anomalies found : {summary['anomalies']}")
    print(f"  Confirmed threats: {summary['confirmed']}")
    return summary


if __name__ == "__main__":
    run_pipeline()
