# monitoring_agent.py
# Collects raw log data from various sources (file, syslog, DB, etc.)

class MonitoringAgent:
    def __init__(self, log_source: str = "data/logs.csv"):
        self.log_source = log_source

    def collect_logs(self):
        """Read and yield raw log entries from the configured source."""
        import pandas as pd
        df = pd.read_csv(self.log_source)
        return df.to_dict(orient="records")

    def run(self):
        logs = self.collect_logs()
        print(f"[MonitoringAgent] Collected {len(logs)} log entries.")
        return logs


if __name__ == "__main__":
    agent = MonitoringAgent()
    agent.run()
