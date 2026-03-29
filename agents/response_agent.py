# Triggers automated responses (alerts, account locks, notifications) for confirmed threats.

import json
import pandas as pd
from datetime import datetime


class ResponseAgent:
    def __init__(self, alert_log: str = "data/alerts.jsonl"):
        self.alert_log = alert_log

    def _write_alert(self, record: dict):
        record["alerted_at"] = datetime.utcnow().isoformat()
        with open(self.alert_log, "a") as f:
            f.write(json.dumps(record) + "\n")

    def respond(self, df: pd.DataFrame):
        threats = df[df.get("confirmed_threat", False)]  # type: ignore
        for _, row in threats.iterrows():
            alert = row.to_dict()
            self._write_alert(alert)
            user = alert.get("user", "unknown")
            print(f"[ResponseAgent] ALERT — Suspicious activity by '{user}'. Alert logged.")

    def run(self, df: pd.DataFrame):
        self.respond(df)
        print(f"[ResponseAgent] Response cycle complete.")


if __name__ == "__main__":
    print("[ResponseAgent] Run via pipeline.py")
