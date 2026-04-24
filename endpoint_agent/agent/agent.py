# agent/agent.py
"""
Main entry point for the Endpoint Monitoring Agent.

Usage:
    python agent.py                 # Normal monitoring mode
    python agent.py --simulate      # Send synthetic burst events and exit
    python agent.py --snapshot      # Take one system snapshot and exit

The agent:
  1. Loads config.json
  2. Starts watchdog file monitoring on configured paths
  3. Periodically snapshots system info (process list, CPU, memory)
  4. Batches all events and sends them to the backend via LogSender
  5. Runs until interrupted (Ctrl+C)
"""

import argparse
import json
import os
import signal
import sys
import threading
import time

# Make sure the project root is on sys.path when running as `python agent/agent.py`
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from agent.collector import FileMonitor, generate_simulation_events, get_system_snapshot
from agent.sender import LogSender
from agent.utils import get_device_id, get_hostname, get_username, iso_now

# ── Config ─────────────────────────────────────────────────────────────────────

CONFIG_PATH = os.path.join(os.path.dirname(__file__), "config.json")


def load_config(path: str = CONFIG_PATH) -> dict:
    """Load and validate config.json."""
    if not os.path.exists(path):
        print(f"[Agent] Config not found at {path}. Using defaults.")
        return {}
    with open(path, "r", encoding="utf-8") as f:
        config = json.load(f)
    return config


# ── Boot Banner ────────────────────────────────────────────────────────────────

BANNER = """
+----------------------------------------------------------+
|      [VIGILAI]  Endpoint Monitoring Agent                |
|      Data Exfiltration Detection System                  |
|      Metadata only - No content captured                 |
+----------------------------------------------------------+
"""


# ── Agent ──────────────────────────────────────────────────────────────────────


class MonitoringAgent:
    """
    Orchestrates file monitoring, system snapshots, and log shipping.
    """

    def __init__(self, config: dict):
        self.config = config
        self.device_id = get_device_id(config)
        self.server_url = config.get("server_url", "http://localhost:8000")
        self.log_interval = int(config.get("log_interval", 5))
        self.watch_paths = config.get("watch_paths", ["C:/Users"])
        self.batch_size = int(config.get("batch_size", 50))
        self.retry_attempts = int(config.get("retry_attempts", 3))
        self.retry_backoff = int(config.get("retry_backoff_seconds", 2))

        # Components
        self.sender = LogSender(
            server_url=self.server_url,
            device_id=self.device_id,
            log_interval=self.log_interval,
            batch_size=self.batch_size,
            retry_attempts=self.retry_attempts,
            retry_backoff=self.retry_backoff,
        )
        self.monitor = FileMonitor(
            device_id=self.device_id,
            watch_paths=self.watch_paths,
            on_event=self.sender.add_event,
        )

        self._running = False
        self._snapshot_thread: threading.Thread | None = None
        self._stop_event = threading.Event()

    def start(self):
        """Start all agent components."""
        print(BANNER)
        print(f"[Agent] Device ID  : {self.device_id}")
        print(f"[Agent] Hostname   : {get_hostname()}")
        print(f"[Agent] User       : {get_username()}")
        print(f"[Agent] Backend    : {self.server_url}")
        print(f"[Agent] Watch paths: {', '.join(self.watch_paths)}")
        print(f"[Agent] Interval   : {self.log_interval}s")
        print(f"[Agent] Started at : {iso_now()}")
        print("-" * 60)

        self._running = True
        self.sender.start()
        self.monitor.start()

        # Background thread for periodic system snapshots
        self._snapshot_thread = threading.Thread(
            target=self._snapshot_loop, daemon=True, name="SnapshotLoop"
        )
        self._snapshot_thread.start()

        # Register signal handlers for graceful shutdown
        signal.signal(signal.SIGINT, self._handle_shutdown)
        signal.signal(signal.SIGTERM, self._handle_shutdown)

        print("[Agent] [ACTIVE] Monitoring active. Press Ctrl+C to stop.")
        print("[Monitor] TYPE     FILE                                SIZE        PATH")
        print("-" * 90)

    def run_forever(self):
        """Block until shutdown signal is received."""
        self.start()
        try:
            while self._running:
                time.sleep(1)
        except KeyboardInterrupt:
            pass
        finally:
            self.stop()

    def stop(self):
        """Gracefully stop all components."""
        if not self._running:
            return
        self._running = False
        self._stop_event.set()
        print("\n[Agent] Shutting down...")
        self.monitor.stop()
        self.sender.stop()
        print(f"[Agent] Final stats: {self.sender.status()}")
        print("[Agent] Goodbye.")

    # ── Internal ───────────────────────────────────────────────────────────────

    def _snapshot_loop(self):
        """Periodically capture and enqueue system snapshots."""
        # First snapshot after a short warm-up delay
        time.sleep(3)
        while self._running and not self._stop_event.is_set():
            snapshot = get_system_snapshot(self.device_id)
            self.sender.add_event(snapshot)
            # Snapshot every 3× the log interval (less frequent than file events)
            self._stop_event.wait(timeout=self.log_interval * 3)

    def _handle_shutdown(self, signum, frame):
        """Signal handler for SIGINT / SIGTERM."""
        print(f"\n[Agent] Received signal {signum}. Initiating shutdown...")
        self._running = False


# ── CLI ────────────────────────────────────────────────────────────────────────


def cli():
    parser = argparse.ArgumentParser(
        description="VigilAI Endpoint Monitoring Agent",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python agent.py                  # Start continuous monitoring
  python agent.py --simulate       # Send 30 synthetic test events
  python agent.py --snapshot       # Take one system snapshot
  python agent.py --config custom.json  # Use a custom config file
        """,
    )
    parser.add_argument("--config", default=CONFIG_PATH, help="Path to config.json")
    parser.add_argument(
        "--simulate",
        action="store_true",
        help="Generate and send synthetic burst events for testing",
    )
    parser.add_argument(
        "--snapshot",
        action="store_true",
        help="Take one system snapshot, send it, and exit",
    )
    parser.add_argument(
        "--count",
        type=int,
        default=None,
        help="Number of simulation events (default: from config)",
    )
    args = parser.parse_args()

    config = load_config(args.config)
    device_id = get_device_id(config)

    # ── Simulation mode ────────────────────────────────────────────────────────
    if args.simulate:
        count = args.count or int(config.get("simulation_events", 30))
        print(BANNER)
        print(f"[Simulate] Generating {count} synthetic events for device: {device_id}")
        sender = LogSender(
            server_url=config.get("server_url", "http://localhost:8000"),
            device_id=device_id,
            retry_attempts=int(config.get("retry_attempts", 3)),
        )
        events = generate_simulation_events(device_id=device_id, count=count)
        print(f"[Simulate] Patterns: large_file_exfiltration, burst_file_access, "
              f"suspicious_executable, normal_baseline")
        sender.add_events(events)
        sender.flush()
        print(f"[Simulate] Done. Stats: {sender.status()}")
        return

    # ── Snapshot mode ──────────────────────────────────────────────────────────
    if args.snapshot:
        print(BANNER)
        print(f"[Snapshot] Capturing system snapshot for device: {device_id}")
        snapshot = get_system_snapshot(device_id)
        import pprint
        pprint.pprint(snapshot)
        sender = LogSender(
            server_url=config.get("server_url", "http://localhost:8000"),
            device_id=device_id,
        )
        sender.add_event(snapshot)
        sender.flush()
        print(f"[Snapshot] Sent. Stats: {sender.status()}")
        return

    # ── Normal monitoring mode ─────────────────────────────────────────────────
    agent = MonitoringAgent(config)
    agent.run_forever()


if __name__ == "__main__":
    cli()
