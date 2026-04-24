# agent/utils.py
"""
Utility helpers for the monitoring agent.
Provides timestamp, username, device ID, and safe file stat functions.
"""

import os
import socket
import getpass
from datetime import datetime, timezone


def iso_now() -> str:
    """Return current UTC time in ISO 8601 format."""
    return datetime.now(timezone.utc).isoformat()


def get_username() -> str:
    """Return the OS login username (not password or any sensitive data)."""
    try:
        return getpass.getuser()
    except Exception:
        return os.environ.get("USERNAME", os.environ.get("USER", "unknown"))


def get_hostname() -> str:
    """Return the machine's hostname."""
    try:
        return socket.gethostname()
    except Exception:
        return "unknown_host"


def get_device_id(config: dict) -> str:
    """
    Return device ID from config or auto-generate from hostname.
    Config value takes priority over auto-generation.
    """
    device_id = config.get("device_id", "").strip()
    if device_id and device_id != "PC_001":
        return device_id
    hostname = get_hostname()
    return f"PC_{hostname}"


def safe_stat(path: str) -> int:
    """
    Return file size in bytes without raising on access errors.
    Returns -1 if the file cannot be stat'd.
    Does NOT read any file content.
    """
    try:
        return os.path.getsize(path)
    except (OSError, PermissionError, FileNotFoundError):
        return -1


def sanitize_path(path: str) -> str:
    """
    Normalize path separators and remove any potential PII segments.
    Replaces the actual username in paths with a generic placeholder
    only if it appears as a directory component (not in filenames).
    """
    normalized = path.replace("\\", "/")
    username = get_username()
    # Replace only directory-level occurrences (e.g., /Users/ayush/ → /Users/<user>/)
    if username and username.lower() not in {"system", "administrator", "root"}:
        normalized = normalized.replace(f"/Users/{username}/", "/Users/<user>/")
        normalized = normalized.replace(f"/users/{username}/", "/users/<user>/")
    return normalized


def format_bytes(size: int) -> str:
    """Human-readable file size string."""
    if size < 0:
        return "unknown"
    for unit in ("B", "KB", "MB", "GB", "TB"):
        if size < 1024.0:
            return f"{size:.1f} {unit}"
        size /= 1024.0
    return f"{size:.1f} PB"
