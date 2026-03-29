# analysis_agent.py
# Pre-processes and feature-engineers raw log data for downstream detection.

import pandas as pd


class AnalysisAgent:
    def __init__(self):
        pass

    def preprocess(self, logs: list[dict]) -> pd.DataFrame:
        """Convert raw log dicts to a clean feature DataFrame."""
        df = pd.DataFrame(logs)
        # Example feature engineering placeholders
        if "timestamp" in df.columns:
            df["timestamp"] = pd.to_datetime(df["timestamp"])
            df["hour"] = df["timestamp"].dt.hour
        df = df.fillna(0)
        return df

    def run(self, logs: list[dict]) -> pd.DataFrame:
        df = self.preprocess(logs)
        print(f"[AnalysisAgent] Processed {len(df)} records, {df.shape[1]} features.")
        return df


if __name__ == "__main__":
    sample = [{"timestamp": "2024-01-01 09:00:00", "user": "alice", "action": "login"}]
    agent = AnalysisAgent()
    agent.run(sample)
