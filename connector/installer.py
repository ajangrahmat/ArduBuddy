"""Instalasi connector: simpan konfigurasi dan daftarkan ke WorkBuddy.

Prinsip: tidak pernah menimpa konfigurasi pengguna. File mcp.json dibaca,
key milik kita saja yang ditambahkan/diperbarui, dan salinan lama disimpan
sebagai backup sebelum penulisan.
"""

from __future__ import annotations

import json
import os
import shutil
import sys
from datetime import datetime
from pathlib import Path

import httpx

from mcp_server import config as cfg
from mcp_server.network_guard import NetworkGuardError, validate_base_url

SERVER_KEY = cfg.MCP_SERVER_KEY
WEBSITE_URL = "https://avisha.id/ardubuddy/"


def mcp_config_path() -> Path:
    override = os.getenv("WORKBUDDY_MCP_CONFIG")
    return Path(override) if override else Path.home() / ".workbuddy-ai" / "mcp.json"


def _read_json(path: Path) -> dict:
    if not path.is_file():
        return {}
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        return data if isinstance(data, dict) else {}
    except (OSError, json.JSONDecodeError) as exc:
        raise ValueError(f"File konfigurasi tidak dapat dibaca: {path} ({exc})") from exc


def _write_json_atomic(path: Path, data: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_name(path.name + ".tmp")
    tmp.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    tmp.replace(path)


def save_user_config(values: dict) -> Path:
    """Gabungkan nilai baru ke config.json milik connector."""
    path = cfg.config_file_path()
    existing = _read_json(path)
    existing.update(values)
    _write_json_atomic(path, existing)
    return path


def read_user_config() -> dict:
    return _read_json(cfg.config_file_path())


def connector_command() -> tuple[str, list[str], dict]:
    """Tentukan command yang didaftarkan, baik saat frozen (exe) maupun source."""
    exe = str(Path(sys.executable).resolve())
    if getattr(sys, "frozen", False):
        return exe, ["--serve"], {}
    root = str(Path(__file__).resolve().parent.parent)
    return exe, ["-m", "mcp_server"], {"PYTHONPATH": root}


def register_connector() -> dict:
    command, args, env = connector_command()
    path = mcp_config_path()
    data = _read_json(path)
    backup = None
    if path.is_file():
        stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
        backup = path.with_name(f"mcp.json.{stamp}.bak")
        shutil.copy2(path, backup)

    servers = data.setdefault("mcpServers", {})
    if not isinstance(servers, dict):
        raise ValueError("mcpServers pada mcp.json bukan objek; tidak diubah.")

    entry = {"command": command, "args": args}
    if env:
        entry["env"] = env
    servers[SERVER_KEY] = entry
    _write_json_atomic(path, data)
    return {"mcp_config": str(path), "backup": str(backup) if backup else None, "entry": entry}


def unregister_connector() -> dict:
    path = mcp_config_path()
    data = _read_json(path)
    servers = data.get("mcpServers")
    removed = False
    if isinstance(servers, dict) and SERVER_KEY in servers:
        del servers[SERVER_KEY]
        removed = True
        _write_json_atomic(path, data)
    return {"mcp_config": str(path), "removed": removed}


def is_registered() -> bool:
    data = _read_json(mcp_config_path())
    servers = data.get("mcpServers", {})
    return isinstance(servers, dict) and SERVER_KEY in servers


def test_connection(base_url: str | None = None, timeout: float | None = None) -> dict:
    url = (base_url or cfg.ARDUBUDDY_BASE_URL).rstrip("/")
    seconds = timeout or cfg.ARDUBUDDY_TIMEOUT
    try:
        validate_base_url(url, cfg.ALLOW_PUBLIC_BASE_URL)
    except NetworkGuardError as exc:
        return {"reachable": False, "error": str(exc)}
    try:
        response = httpx.get(f"{url}/api/status", timeout=seconds)
        response.raise_for_status()
        data = response.json()
    except httpx.TimeoutException:
        return {"reachable": False, "error": f"Timeout {seconds:g} detik: {url}"}
    except (httpx.HTTPError, ValueError) as exc:
        return {"reachable": False, "error": f"Tidak dapat menghubungi {url}: {exc}"}
    return {
        "reachable": True,
        "url": url,
        "ok": bool(data.get("ok")),
        "connected": data.get("connected"),
        "ip": data.get("ip"),
        "ssid": data.get("ssid"),
        "skill_count": data.get("skill_count"),
    }


def diagnose(do_connection_test: bool = False) -> dict:
    command, args, env = connector_command()
    info = {
        "server_key": SERVER_KEY,
        "frozen": bool(getattr(sys, "frozen", False)),
        "executable": command,
        "args": args,
        "env": env,
        "config_file": str(cfg.config_file_path()),
        "config_exists": cfg.config_file_path().is_file(),
        "log_file": str(cfg.log_file_path()),
        "mcp_config": str(mcp_config_path()),
        "registered": is_registered(),
        "transport": cfg.MCP_TRANSPORT,
        "mock_mode": cfg.MOCK_MODE,
        "base_url": cfg.ARDUBUDDY_BASE_URL,
        "allow_public_base_url": cfg.ALLOW_PUBLIC_BASE_URL,
        "device_id": cfg.DEVICE_ID,
        "website": WEBSITE_URL,
    }
    if do_connection_test and not cfg.MOCK_MODE:
        info["device"] = test_connection()
    return info
