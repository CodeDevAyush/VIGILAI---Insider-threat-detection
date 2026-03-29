# learning_agent.py
# Periodically retrains the model with new labelled data to adapt to evolving behaviour.

import joblib
import pandas as pd
from sklearn.ensemble import IsolationForest


class LearningAgent:
    def __init__(
        self,
        model_path: str = "models/isolation_forest.pkl",
        contamination: float = 0.05,
    ):
        self.model_path = model_path
        self.contamination = contamination

    def retrain(self, df: pd.DataFrame):
        feature_cols = [c for c in df.columns if c not in ("timestamp", "user", "action")]
        X = df[feature_cols].fillna(0)
        model = IsolationForest(contamination=self.contamination, random_state=42)
        model.fit(X)
        joblib.dump(model, self.model_path)
        print(f"[LearningAgent] Model retrained on {len(X)} samples and saved to {self.model_path}.")
        return model

    def run(self, df: pd.DataFrame):
        return self.retrain(df)


if __name__ == "__main__":
    print("[LearningAgent] Run via pipeline.py")
