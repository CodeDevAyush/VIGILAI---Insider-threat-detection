# agent/sender.py
"""
Log sender module for the endpoint monitoring agent.

Batches collected events and POSTs them to the backend API.
Implements retry logic with exponential back-off.
Thread-safe — safe to call from the collector thread.
"""

import json
import threading
import time
from collections import deque
from typing import Any, Dict, List, Optional

import requests

from agent.utils import iso_now

# ── Sender ─────────────────────────────────────────────────────────────────────


class LogSender:
    """
    Thread-safe log sender. Collects events in an internal queue,
    then flushes them to the backend API at a configurable interval.
    """

    def __init__(
        self,
        server_url: str,
        device_id: str,
        log_interval: int = 5,
        batch_size: int = 50,
        retry_attempts: int = 3,
        retry_backoff: int = 2,
    ):
        self.server_url = server_url.rstrip("/")
        self.device_id = device_id
        self.log_interval = log_interval
        self.batch_size = batch_size
        self.retry_attempts = retry_attempts
        self.retry_backoff = retry_backoff

        self._queue: deque = deque()
        self._lock = threading.Lock()
        self._stop_event = threading.Event()
        self._shutdown = False  # True only when stop() is called intentionally
        self._thread: Optional[threading.Thread] = None

        # Stats
        self.total_sent = 0
        self.total_failed = 0
        self.last_flush_at: Optional[str] = None

    # ── Public API ─────────────────────────────────────────────────────────────

    def add_event(self, event: Dict[str, Any]):
        """Enqueue a single event. Thread-safe."""
        with self._lock:
            self._queue.append(event)
            # Trigger immediate flush if queue exceeds batch_size
            if len(self._queue) >= self.batch_size:
                self._stop_event.set()

    def add_events(self, events: List[Dict[str, Any]]):
        """Enqueue multiple events at once. Thread-safe."""
        with self._lock:
            self._queue.extend(events)

    def start(self):
        """Start the background flush thread."""
        if self._thread and self._thread.is_alive():
            return
        self._stop_event.clear()
        self._thread = threading.Thread(target=self._run_loop, daemon=True, name="LogSender")
        self._thread.start()
        print(f"[LogSender] Started - flushing every {self.log_interval}s to {self.server_url}")

    def stop(self):
        """Stop the flush thread and perform a final flush."""
        self._shutdown = True
        self._stop_event.set()
        if self._thread:
            self._thread.join(timeout=10)
        self.flush()  # Drain remaining events
        print(f"[LogSender] Stopped. Sent: {self.total_sent} | Failed: {self.total_failed}")

    def flush(self):
        """Immediately drain the queue and send all pending events."""
        batch = self._drain_batch()
        if not batch:
            return
        self._send_with_retry(batch)

    def status(self) -> dict:
        """Return current sender statistics."""
        with self._lock:
            queue_len = len(self._queue)
        return {
            "device_id": self.device_id,
            "server_url": self.server_url,
            "queue_pending": queue_len,
            "total_sent": self.total_sent,
            "total_failed": self.total_failed,
            "last_flush_at": self.last_flush_at,
        }

    # -- Internal ---------------------------------------------------------------

    def _run_loop(self):
        """Main loop - flushes every log_interval seconds.

        The loop only exits when self._stop_event is set AND self._shutdown
        flag is True (set by stop()). Batch-size triggers also set _stop_event
        to wake the loop early, but they must NOT terminate the thread.
        """
        while True:
            self._stop_event.wait(timeout=self.log_interval)
            self._stop_event.clear()
            self.flush()
            # Check for real shutdown AFTER flushing remaining events
            if self._shutdown:
                break

    def _drain_batch(self) -> List[Dict[str, Any]]:
        """Atomically drain up to batch_size events from the queue."""
        with self._lock:
            batch = []
            for _ in range(min(self.batch_size, len(self._queue))):
                batch.append(self._queue.popleft())
        return batch

    def _send_with_retry(self, batch: List[Dict[str, Any]]):
        """POST batch to backend. Retries up to retry_attempts times with back-off."""
        url = f"{self.server_url}/logs"
        payload = {"events": batch, "sent_at": iso_now()}

        for attempt in range(1, self.retry_attempts + 1):
            try:
                response = requests.post(
                    url,
                    json=payload,
                    timeout=10,
                    headers={"Content-Type": "application/json"},
                )
                if response.status_code in (200, 201):
                    self.total_sent += len(batch)
                    self.last_flush_at = iso_now()
                    print(
                        f"[LogSender] [OK] Sent {len(batch)} events "
                        f"(total: {self.total_sent})"
                    )
                    return
                else:
                    print(
                        f"[LogSender] [FAIL] Attempt {attempt}/{self.retry_attempts} - "
                        f"HTTP {response.status_code}: {response.text[:200]}"
                    )
            except requests.exceptions.ConnectionError:
                print(
                    f"[LogSender] [FAIL] Attempt {attempt}/{self.retry_attempts} - "
                    f"Connection refused. Is the backend running at {self.server_url}?"
                )
            except requests.exceptions.Timeout:
                print(
                    f"[LogSender] [FAIL] Attempt {attempt}/{self.retry_attempts} - "
                    f"Request timed out."
                )
            except Exception as e:
                print(f"[LogSender] [FAIL] Unexpected error: {e}")

            if attempt < self.retry_attempts:
                backoff = self.retry_backoff * (2 ** (attempt - 1))
                print(f"[LogSender] Retrying in {backoff}s...")
                time.sleep(backoff)

        # All retries exhausted -- put events back at the front of the queue
        self.total_failed += len(batch)
        with self._lock:
            for event in reversed(batch):
                self._queue.appendleft(event)
        print(
            f"[LogSender] [FAIL] All {self.retry_attempts} attempts failed. "
            f"{len(batch)} events re-queued. Total failures: {self.total_failed}"
        )
