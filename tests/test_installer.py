import json
import os
from pathlib import Path

from connector import installer
from mcp_server import config as cfg


def test_register_merges_without_overwriting(tmp_path, monkeypatch):
    path = tmp_path / "mcp.json"
    path.write_text(json.dumps({
        "mcpServers": {"playwright": {"command": "npx", "args": ["@playwright/mcp@latest"]}},
        "otherKey": 42,
    }), encoding="utf-8")
    monkeypatch.setenv("WORKBUDDY_MCP_CONFIG", str(path))

    result = installer.register_connector()
    data = json.loads(path.read_text(encoding="utf-8"))
    assert data["otherKey"] == 42
    assert "playwright" in data["mcpServers"]
    assert cfg.MCP_SERVER_KEY in data["mcpServers"]
    assert data["mcpServers"][cfg.MCP_SERVER_KEY]["args"] == ["-m", "mcp_server"]
    assert Path(result["backup"]).is_file()
    assert installer.is_registered() is True


def test_unregister_removes_only_our_key(tmp_path, monkeypatch):
    path = tmp_path / "mcp.json"
    path.write_text(json.dumps({
        "mcpServers": {
            "playwright": {"command": "npx"},
            cfg.MCP_SERVER_KEY: {"command": "ArduBuddy.exe", "args": ["--serve"]},
        }
    }), encoding="utf-8")
    monkeypatch.setenv("WORKBUDDY_MCP_CONFIG", str(path))

    result = installer.unregister_connector()
    assert result["removed"] is True
    data = json.loads(path.read_text(encoding="utf-8"))
    assert "playwright" in data["mcpServers"]
    assert cfg.MCP_SERVER_KEY not in data["mcpServers"]


def test_save_user_config_merges(tmp_path, monkeypatch):
    monkeypatch.setenv("ARDUBUDDY_CONFIG_DIR", str(tmp_path / "cfg"))
    path = Path(os.environ["ARDUBUDDY_CONFIG_DIR"]) / "config.json"
    installer.save_user_config({"base_url": "http://10.0.0.7"})
    installer.save_user_config({"device_id": "lab-main"})
    data = json.loads(path.read_text(encoding="utf-8"))
    assert data["base_url"] == "http://10.0.0.7"
    assert data["device_id"] == "lab-main"


def test_public_address_blocked_before_network_call(monkeypatch):
    monkeypatch.setattr(cfg, "ALLOW_PUBLIC_BASE_URL", False)
    result = installer.test_connection("http://8.8.8.8")
    assert result["reachable"] is False
    assert "authentication" in result["error"]
