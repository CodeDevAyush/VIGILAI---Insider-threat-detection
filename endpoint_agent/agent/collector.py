# agent/collector.py
"""
Activity collector for the endpoint monitoring agent.

Monitors file-system events via watchdog and captures system snapshots
via psutil. Only metadata is collected — no file contents are read.

Also provides a simulation mode to generate artificial burst activity
for testing the detection pipeline.
"""

import os
import random
import threading
import time
from datetime import datetime, timezone
from typing import Callable, List, Optional

import psutil
from watchdog.events import FileSystemEvent, FileSystemEventHandler
from watchdog.observers import Observer

from agent.utils import get_username, iso_now, safe_stat, sanitize_path

# ── Constants ──────────────────────────────────────────────────────────────────

# Extensions that are flagged as higher-risk if found outside expected locations
HIGH_RISK_EXTENSIONS = {
    ".exe", ".bat", ".cmd", ".ps1", ".vbs", ".js", ".jar",
    ".zip", ".rar", ".7z", ".tar", ".gz",
    ".db", ".sqlite", ".sql", ".bak",
}

SENSITIVE_PATH_KEYWORDS = [
    "downloads", "desktop", "temp", "tmp", "appdata",
    "documents", "onedrive", "dropbox", "google drive",
]

# ── Noise Filter ── Paths to ALWAYS IGNORE (system/game/AV noise) ──────────────
# These generate thousands of irrelevant events — block them at collection time.
NOISE_PATH_FRAGMENTS = [
    # Windows system directories
    "\\windows\\", "\\windows\\system32", "\\windows\\syswow64",
    "\\appdata\\local\\temp\\", "\\appdata\\locallow\\",
    "\\appdata\\local\\microsoft\\", "\\appdata\\roaming\\microsoft\\",
    "\\programdata\\", "\\program files\\common files\\",
    "\\system volume information\\", "\\$recycle.bin\\",
    "\\winsxs\\", "\\softwaredistribution\\",
    # Python / IDE / dev tool noise
    "\\__pycache__\\", "\\.gemini\\", "\\.vscode\\", "\\.idea\\",
    "\\site-packages\\", "\\jedi\\", "\\jedilsp\\",
    "\\node_modules\\", "\\.git\\",
    # Antivirus / Security tools
    "\\easeus\\", "\\malwarebytes\\", "\\windows defender\\",
    "\\avg\\", "\\avast\\", "\\kaspersky\\", "\\eset\\", "\\bitdefender\\",
    # Games and launchers (huge binary updates = noise)
    "\\epic games\\", "\\steam\\", "\\origin\\", "\\battle.net\\",
    "\\pubg\\", "\\riot games\\", "\\valorant\\",
    # Browser cache and temp files
    "\\chrome\\user data\\default\\cache\\",
    "\\firefox\\profiles\\", "\\edge\\user data\\",
    # MongoDB data files (prevent feedback loop)
    "\\mongodb\\", "\\mongodbdata\\",
    # Monitoring Agent itself
    "\\monitoring agent\\",
    # Virtual machines
    "\\virtualbox\\", "\\vmware\\", "\\hyper-v\\",
]

# Extensions that are pure noise (logs, temp, lock files from system tools)
NOISE_EXTENSIONS = {
    ".log", ".tmp", ".temp", ".lock", ".lck",
    ".etl",  # Windows event trace logs
    ".wpn.js",  # EaseUS/antivirus files
}

# ── Event Handler ──────────────────────────────────────────────────────────────


class FileEventHandler(FileSystemEventHandler):
    """
    Watchdog event handler that captures file system metadata.
    Emits structured event dicts — never reads file content.
    """

    def __init__(self, device_id: str, on_event: Callable[[dict], None], verbose: bool = True):
        super().__init__()
        self.device_id = device_id
        self.username = get_username()
        self.on_event = on_event
        self.verbose = verbose
        self._lock = threading.Lock()

    def _build_event(self, watchdog_event: FileSystemEvent, event_type: str) -> Optional[dict]:
        """Build a metadata-only event dict from a watchdog FileSystemEvent."""
        try:
            path = getattr(watchdog_event, "src_path", "")
            if not path:
                return None

            # Normalize separators — watchdog on Windows sometimes mixes \ and /
            path = os.path.normpath(path)

            if watchdog_event.is_directory:
                return None  # Skip directory events, only track files

            # ── NOISE FILTER: Block system/game/AV paths before any processing ──
            low_path = path.lower()
            if any(fragment in low_path for fragment in NOISE_PATH_FRAGMENTS):
                return None

            # Skip pure noise file extensions
            raw_ext = os.path.splitext(path)[1].lower()
            if raw_ext in NOISE_EXTENSIONS:
                return None

            # Skip hidden files (start with dot) — usually system artifacts
            if file_name := os.path.basename(path):
                if file_name.startswith(".") and len(file_name) > 1:
                    return None

            file_name = os.path.basename(path)
            extension = os.path.splitext(file_name)[1].lower()
            file_size = safe_stat(path)
            sanitized_path = sanitize_path(os.path.dirname(path))

            # Destination path for move events
            dest_path = getattr(watchdog_event, "dest_path", None)
            dest_sanitized = sanitize_path(os.path.normpath(dest_path)) if dest_path else None

            return {
                "device_id": self.device_id,
                "user": self.username,
                "event_type": event_type,
                "file_name": file_name,
                "file_extension": extension,
                "file_size": file_size,
                "path": sanitized_path,
                "dest_path": dest_sanitized,
                "is_high_risk_ext": extension in HIGH_RISK_EXTENSIONS,
                "is_sensitive_path": any(
                    kw in sanitized_path.lower() for kw in SENSITIVE_PATH_KEYWORDS
                ),
                "timestamp": iso_now(),
                "source": "watchdog",
            }
        except Exception as exc:
            print(f"[FileEventHandler] Error building event: {exc} | path={getattr(watchdog_event, 'src_path', '?')}")
            return None

    def _dispatch(self, event_dict: Optional[dict]):
        if not event_dict:
            return

        # ── ALWAYS forward to sender first — print errors must not block this ──
        try:
            with self._lock:
                self.on_event(event_dict)
        except Exception as exc:
            print(f"[FileEventHandler] on_event error: {exc}")

        # ── Verbose console output (best-effort — failure is silent) ──────────
        if self.verbose:
            try:
                import sys
                ev = event_dict["event_type"].replace("file_", "").upper()
                size = event_dict.get("file_size", -1)
                if size is None or size < 0:
                    size_str = "unknown"
                elif size == 0:
                    size_str = "0 B"
                elif size < 1024:
                    size_str = f"{size} B"
                elif size < 1024 * 1024:
                    size_str = f"{size/1024:.1f} KB"
                else:
                    size_str = f"{size/1024/1024:.1f} MB"
                flag = " [HIGH-RISK]" if event_dict.get("is_high_risk_ext") else ""
                dest = f" -> {event_dict['dest_path']}" if event_dict.get("dest_path") else ""
                line = (
                    f"[Monitor] {ev:<8} {event_dict['file_name']:<35} "
                    f"{size_str:>10}  {event_dict['path']}{dest}{flag}\n"
                )
                sys.stdout.buffer.write(line.encode("utf-8", errors="replace"))
                sys.stdout.buffer.flush()
            except Exception:
                pass  # Never let a print failure affect event dispatch

    def on_created(self, event: FileSystemEvent):
        try:
            self._dispatch(self._build_event(event, "file_created"))
        except Exception as exc:
            print(f"[FileEventHandler] on_created error: {exc}")

    def on_modified(self, event: FileSystemEvent):
        try:
            self._dispatch(self._build_event(event, "file_modified"))
        except Exception as exc:
            print(f"[FileEventHandler] on_modified error: {exc}")

    def on_deleted(self, event: FileSystemEvent):
        try:
            self._dispatch(self._build_event(event, "file_deleted"))
        except Exception as exc:
            print(f"[FileEventHandler] on_deleted error: {exc}")

    def on_moved(self, event: FileSystemEvent):
        try:
            self._dispatch(self._build_event(event, "file_moved"))
        except Exception as exc:
            print(f"[FileEventHandler] on_moved error: {exc}")


# ── File Monitor ───────────────────────────────────────────────────────────────


class FileMonitor:
    """
    Manages one or more watchdog Observers for the configured watch paths.
    """

    def __init__(self, device_id: str, watch_paths: List[str], on_event: Callable[[dict], None], verbose: bool = True):
        self.device_id = device_id
        self.watch_paths = watch_paths
        self.on_event = on_event
        self._observers: List[Observer] = []
        self._handler = FileEventHandler(device_id=device_id, on_event=on_event, verbose=verbose)

    def start(self):
        # Deduplicate paths that resolve to the same real location
        # (e.g., C:/Users/ASUS/Desktop and C:/Users/ASUS/OneDrive/Desktop
        actual_paths = []
        for p in self.watch_paths:
            if p == "ALL_DRIVES":
                for part in psutil.disk_partitions(all=False):
                    if part.fstype and part.mountpoint:  # Skip empty CD-ROM drives
                        actual_paths.append(part.mountpoint)
            else:
                actual_paths.append(p)

        seen_real: set = set()
        for path in actual_paths:
            if not os.path.exists(path):
                print(f"[FileMonitor] Watch path does not exist, skipping: {path}")
                continue
            real = os.path.realpath(path).lower()
            if real in seen_real:
                print(f"[FileMonitor] Skipping duplicate path (same folder): {path}")
                continue
            seen_real.add(real)
            # Use native fast Observer and enable RECURSIVE monitoring
            try:
                observer = Observer()
                observer.schedule(self._handler, path, recursive=True)
                observer.start()
                self._observers.append(observer)
                print(f"[FileMonitor] Watching (recursive): {path}")
            except Exception as e:
                print(f"[FileMonitor] Failed to watch {path} (Permission denied or invalid path) - {e}")

    def stop(self):
        for observer in self._observers:
            observer.stop()
        for observer in self._observers:
            observer.join()
        print("[FileMonitor] Stopped all observers.")


# ── System Snapshot ────────────────────────────────────────────────────────────


def get_system_snapshot(device_id: str) -> dict:
    """
    Capture a lightweight system snapshot using psutil.
    Returns process names, CPU%, and memory% — no sensitive content.
    """
    try:
        processes = []
        for proc in psutil.process_iter(["pid", "name", "status"]):
            try:
                info = proc.info
                processes.append({
                    "pid": info["pid"],
                    "name": info["name"],
                    "status": info["status"],
                })
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                continue

        return {
            "device_id": device_id,
            "user": get_username(),          # ← required by LogEvent model
            "event_type": "system_snapshot",
            "cpu_percent": psutil.cpu_percent(interval=0.1),
            "memory_percent": psutil.virtual_memory().percent,
            "process_count": len(processes),
            "top_processes": processes[:20],  # Cap at 20 processes
            "timestamp": iso_now(),
            "source": "psutil",
        }
    except Exception as e:
        return {
            "device_id": device_id,
            "user": get_username(),
            "event_type": "system_snapshot",
            "error": str(e),
            "timestamp": iso_now(),
            "source": "psutil",
        }


# ── Simulation ─────────────────────────────────────────────────────────────────


def generate_simulation_events(device_id: str, count: int = 30) -> List[dict]:
    """
    Generate synthetic file events to simulate anomalous activity patterns.
    Used for end-to-end testing of the detection pipeline.

    Patterns generated:
    - Large file creation (>50 MB) in Downloads/Desktop  → exfiltration signal
    - Burst of rapid file modifications                   → mass access signal
    - Suspicious extension files (.zip, .exe)             → policy violation signal
    - After-hours timestamps                              → temporal anomaly signal
    - Normal baseline events                              → should NOT trigger alerts
    """
    user = get_username()
    events: List[dict] = []

    # Pattern 1: Large file creation (exfiltration)
    for _ in range(3):
        size_mb = random.randint(55, 250)
        events.append({
            "device_id": device_id,
            "user": user,
            "event_type": "file_created",
            "file_name": f"backup_{random.randint(1000, 9999)}.zip",
            "file_extension": ".zip",
            "file_size": size_mb * 1024 * 1024,
            "path": "C:/Users/<user>/Downloads",
            "dest_path": None,
            "is_high_risk_ext": True,
            "is_sensitive_path": True,
            "timestamp": _after_hours_timestamp(),
            "source": "simulation",
            "sim_pattern": "large_file_exfiltration",
        })

    # Pattern 2: Rapid burst of file modifications
    for i in range(15):
        events.append({
            "device_id": device_id,
            "user": user,
            "event_type": "file_modified",
            "file_name": f"report_{i:03d}.pdf",
            "file_extension": ".pdf",
            "file_size": random.randint(50_000, 500_000),
            "path": "C:/Users/<user>/Documents",
            "dest_path": None,
            "is_high_risk_ext": False,
            "is_sensitive_path": True,
            "timestamp": iso_now(),
            "source": "simulation",
            "sim_pattern": "burst_file_access",
        })

    # Pattern 3: Suspicious executable dropped
    for _ in range(2):
        events.append({
            "device_id": device_id,
            "user": user,
            "event_type": "file_created",
            "file_name": f"update_{random.randint(100, 999)}.exe",
            "file_extension": ".exe",
            "file_size": random.randint(1_000_000, 10_000_000),
            "path": "C:/Users/<user>/AppData/Local/Temp",
            "dest_path": None,
            "is_high_risk_ext": True,
            "is_sensitive_path": True,
            "timestamp": _after_hours_timestamp(),
            "source": "simulation",
            "sim_pattern": "suspicious_executable",
        })

    # Pattern 4: Normal baseline events (should not trigger alerts)
    normal_files = ["notes.txt", "meeting.docx", "budget.xlsx", "logo.png", "readme.md"]
    for i in range(count - len(events)):
        events.append({
            "device_id": device_id,
            "user": user,
            "event_type": random.choice(["file_created", "file_modified"]),
            "file_name": random.choice(normal_files),
            "file_extension": os.path.splitext(random.choice(normal_files))[1],
            "file_size": random.randint(1_000, 50_000),
            "path": "C:/Users/<user>/Documents/Work",
            "dest_path": None,
            "is_high_risk_ext": False,
            "is_sensitive_path": False,
            "timestamp": iso_now(),
            "source": "simulation",
            "sim_pattern": "normal_baseline",
        })

    random.shuffle(events)
    return events


def _after_hours_timestamp() -> str:
    """Generate a timestamp between 22:00 and 04:00 (after-hours window)."""
    now = datetime.now(timezone.utc)
    hour = random.choice(list(range(22, 24)) + list(range(0, 5)))
    minute = random.randint(0, 59)
    after_hours = now.replace(hour=hour, minute=minute, second=random.randint(0, 59))
    return after_hours.isoformat()
