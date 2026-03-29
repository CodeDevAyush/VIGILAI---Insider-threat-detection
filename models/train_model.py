# train_model.py
# Trains an Isolation Forest model on the simulated log data.

import os
import joblib
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.metrics import classification_report

FEATURE_COLS = ["hour", "bytes_transferred", "failed_logins"]
MODEL_PATH = "models/isolation_forest.pkl"
DATA_PATH = "data/logs.csv"


def load_data(path: str = DATA_PATH) -> pd.DataFrame:
    df = pd.read_csv(path)
    df["timestamp"] = pd.to_datetime(df["timestamp"])
    df["hour"] = df["timestamp"].dt.hour
    return df


def train(df: pd.DataFrame, contamination: float = 0.05) -> IsolationForest:
    X = df[FEATURE_COLS].fillna(0)
    model = IsolationForest(contamination=contamination, random_state=42, n_estimators=200)
    model.fit(X)
    return model


def evaluate(model: IsolationForest, df: pd.DataFrame):
    X = df[FEATURE_COLS].fillna(0)
    preds = model.predict(X)           # -1 = anomaly, 1 = normal
    y_pred = (preds == -1).astype(int) # 1 = anomaly
    y_true = df["label"].values
    print("[train_model] Classification Report:")
    print(classification_report(y_true, y_pred, target_names=["normal", "anomaly"]))


def main():
    os.makedirs("models", exist_ok=True)
    df = load_data()
    print(f"[train_model] Loaded {len(df)} records.")
    model = train(df)
    evaluate(model, df)
    joblib.dump(model, MODEL_PATH)
    print(f"[train_model] Model saved to '{MODEL_PATH}'.")


if __name__ == "__main__":
    main()
