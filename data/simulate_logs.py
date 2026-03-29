# simulate_logs.py
# Generates synthetic employee activity logs with injected anomalies.

import random
import pandas as pd
from datetime import datetime, timedelta

USERS = ["alice", "bob", "charlie", "diana", "eve"]
ACTIONS = ["login", "logout", "file_access", "email_sent", "download", "usb_insert", "sudo"]
RESOURCES = ["/hr/payroll", "/finance/reports", "/source_code", "/marketing", "/it/configs"]


def random_timestamp(start: datetime, end: datetime) -> datetime:
    delta = end - start
    return start + timedelta(seconds=random.randint(0, int(delta.total_seconds())))


def generate_normal_log(ts: datetime) -> dict:
    return {
        "timestamp": ts.strftime("%Y-%m-%d %H:%M:%S"),
        "user": random.choice(USERS),
        "action": random.choice(["login", "logout", "file_access", "email_sent"]),
        "resource": random.choice(RESOURCES),
        "bytes_transferred": random.randint(0, 10_000_000),
        "hour": ts.hour,
        "failed_logins": random.randint(0, 2),
        "label": 0,  # normal
    }


def generate_anomalous_log(ts: datetime) -> dict:
    ts = ts.replace(hour=random.choice([1, 2, 3, 23]))  # after-hours
    return {
        "timestamp": ts.strftime("%Y-%m-%d %H:%M:%S"),
        "user": random.choice(USERS),
        "action": random.choice(["download", "usb_insert", "sudo"]),
        "resource": "/finance/reports",
        "bytes_transferred": random.randint(600_000_000, 2_000_000_000),
        "hour": ts.hour,
        "failed_logins": random.randint(5, 20),
        "label": 1,  # anomaly
    }


def simulate(n_normal: int = 950, n_anomalies: int = 50, output: str = "data/logs.csv"):
    start = datetime(2024, 1, 1, 8, 0, 0)
    end = datetime(2024, 6, 30, 18, 0, 0)

    logs = [generate_normal_log(random_timestamp(start, end)) for _ in range(n_normal)]
    logs += [generate_anomalous_log(random_timestamp(start, end)) for _ in range(n_anomalies)]
    random.shuffle(logs)

    df = pd.DataFrame(logs)
    df.to_csv(output, index=False)
    print(f"[simulate_logs] Saved {len(df)} records to '{output}'.")
    return df


if __name__ == "__main__":
    simulate()
