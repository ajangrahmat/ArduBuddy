"""Konfigurasi runtime ArduBuddy.

Urutan prioritas: environment variable -> config.json pengguna -> default.

PENTING: modul ini tidak boleh menulis ke stdout. Saat connector berjalan
dengan transport stdio, stdout adalah kanal JSON-RPC MCP. Semua log
dikirim ke file dan stderr.
"""

from __future__ import annotations

import json
import logging
import os
import sys
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

APP_NAME = "ArduBuddy"
MCP_SERVER_KEY = "ardubuddy"

# Sumber: docs/FIRMWARE-AND-FLASH.md (pemetaan perangkat)
STRAPPING_PINS = {0, 2, 5, 12, 15}
ADC_SAFE_PINS = set(range(32, 40))


def config_dir() -> Path:
    override = os.getenv("ARDUBUDDY_CONFIG_DIR")
    if override:
        return Path(override)
    base = os.getenv("APPDATA") or os.getenv("XDG_CONFIG_HOME") or (Path.home() / ".config")
    return Path(base) / APP_NAME


def config_file_path() -> Path:
    return config_dir() / "config.json"


def log_file_path() -> Path:
    return config_dir() / "connector.log"


def load_user_config() -> dict:
    path = config_file_path()
    try:
        if path.is_file():
            data = json.loads(path.read_text(encoding="utf-8"))
            return data if isinstance(data, dict) else {}
    except (OSError, json.JSONDecodeError):
        pass
    return {}


USER_CONFIG = load_user_config()


def _as_bool(value) -> bool:
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.strip().lower() in {"1", "true", "yes", "on"}
    return bool(value)


def setting(key: str, env_key: str, default, cast=None):
    raw = os.getenv(env_key)
    if raw is None:
        raw = USER_CONFIG.get(key, default)
    if cast is bool:
        return _as_bool(raw)
    if cast is None or isinstance(raw, cast):
        return raw
    return cast(raw)


MOCK_MODE = setting("mock_mode", "MOCK_MODE", True, bool)
ARDUBUDDY_BASE_URL = str(setting("base_url", "ARDUBUDDY_BASE_URL", "http://192.168.1.100")).rstrip("/")
ARDUBUDDY_TIMEOUT = setting("timeout", "ARDUBUDDY_TIMEOUT", 5.0, float)
ARDUBUDDY_TOKEN = str(setting("token", "ARDUBUDDY_TOKEN", ""))
VERIFY_AFTER_WRITE = setting("verify_after_write", "VERIFY_AFTER_WRITE", True, bool)
ALLOW_STRAPPING_PINS = setting("allow_strapping_pins", "ALLOW_STRAPPING_PINS", False, bool)
ALLOW_PUBLIC_BASE_URL = setting("allow_public_base_url", "ALLOW_PUBLIC_BASE_URL", False, bool)

MCP_TRANSPORT = str(setting("transport", "MCP_TRANSPORT", "stdio")).lower()
MCP_HOST = str(setting("host", "MCP_HOST", "127.0.0.1"))
MCP_PORT = setting("port", "MCP_PORT", 8000, int)
DEVICE_ID = str(setting("device_id", "DEVICE_ID", "office-main"))

DEVICE_OVERRIDES = USER_CONFIG.get("devices")
SENSOR_OVERRIDES = USER_CONFIG.get("sensors")
LOG_LEVEL = str(setting("log_level", "LOG_LEVEL", "INFO")).upper()


def setup_logging() -> logging.Logger:
    """Siapkan logger ke file + stderr. Tidak pernah ke stdout."""
    logger = logging.getLogger("ardubuddy")
    if logger.handlers:
        return logger
    logger.setLevel(getattr(logging, LOG_LEVEL, logging.INFO))
    logger.propagate = False
    fmt = logging.Formatter("%(asctime)s %(levelname)s %(name)s %(message)s")
    try:
        config_dir().mkdir(parents=True, exist_ok=True)
        file_handler = logging.FileHandler(log_file_path(), encoding="utf-8")
        file_handler.setFormatter(fmt)
        logger.addHandler(file_handler)
    except OSError:
        pass
    stderr_handler = logging.StreamHandler(sys.stderr)
    stderr_handler.setFormatter(fmt)
    logger.addHandler(stderr_handler)
    return logger
