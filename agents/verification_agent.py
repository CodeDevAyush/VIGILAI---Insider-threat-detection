# verification_agent.py
# Cross-validates flagged anomalies using rule-based heuristics to reduce false positives.

import pandas as pd


RULES = {
    "after_hours": lambda row: row.get("hour", 12) < 7 or row.get("hour", 12) > 20,
    "mass_download": lambda row: row.get("bytes_transferred", 0) > 500_000_000,
    "privilege_escalation": lambda row: row.get("action", "") in ("sudo", "su", "runas"),
}


class VerificationAgent:
    def __init__(self, rules: dict | None = None):
        self.rules = rules or RULES

    def verify(self, df: pd.DataFrame) -> pd.DataFrame:
        flagged = df[df["is_anomaly"]].copy()
        for rule_name, rule_fn in self.rules.items():
            flagged[f"rule_{rule_name}"] = flagged.apply(rule_fn, axis=1)
        rule_cols = [c for c in flagged.columns if c.startswith("rule_")]
        flagged["confirmed_threat"] = flagged[rule_cols].any(axis=1)
        return flagged

    def run(self, df: pd.DataFrame) -> pd.DataFrame:
        result = self.verify(df)
        confirmed = result["confirmed_threat"].sum()
        print(f"[VerificationAgent] {confirmed} confirmed threats after rule checks.")
        return result


if __name__ == "__main__":
    print("[VerificationAgent] Run via pipeline.py")
