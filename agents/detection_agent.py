# detection_agent.py
# Runs the trained Isolation Forest model to score each log entry.

import joblib
import pandas as pd


class DetectionAgent:
    def __init__(self, model_path: str = "models/isolation_forest.pkl"):
        self.model_path = model_path
        self.model = None

    def load_model(self):
        self.model = joblib.load(self.model_path)
        print(f"[DetectionAgent] Model loaded from {self.model_path}")

    def predict(self, df: pd.DataFrame) -> pd.DataFrame:
        if self.model is None:
            raise RuntimeError("Model not loaded. Call load_model() first.")
        feature_cols = [c for c in df.columns if c not in ("timestamp", "user", "action")]
        scores = self.model.decision_function(df[feature_cols])
        df = df.copy()
        df["anomaly_score"] = scores
        df["is_anomaly"] = self.model.predict(df[feature_cols]) == -1
        return df

    def run(self, df: pd.DataFrame) -> pd.DataFrame:
        self.load_model()
        result = self.predict(df)
        anomalies = result["is_anomaly"].sum()
        print(f"[DetectionAgent] {anomalies} anomalies detected out of {len(result)} records.")
        return result


if __name__ == "__main__":
    print("[DetectionAgent] Run via pipeline.py")
