"""MCP Server ArduBuddy.

Transport default adalah stdio (dipakai executable connector WorkBuddy).
Transport http tetap tersedia untuk pengembangan dan pengujian lokal.

Semua tool mengembalikan dict terstruktur. Kegagalan perangkat tidak pernah
dilaporkan sebagai sukses.
"""

from __future__ import annotations

import logging
from typing import Any

from fastmcp import FastMCP

from . import config as cfg
from .ardubuddy_client import ArduBuddyClient
from .scenes import ALLOWED_STATES, SCENES, validate_scene

logger = logging.getLogger("ardubuddy.server")

mcp = FastMCP(
    "ArduBuddy",
    instructions=(
        "Tools untuk mengontrol perangkat kantor berbasis ESP32 yang menjalankan firmware ArduBuddy. "
        "Selalu gunakan nama perangkat logis dari list_devices, jangan pernah mengirim nomor GPIO. "
        "Laporkan hasil apa adanya dari field success/actual_state; jangan mengklaim berhasil "
        "jika success bernilai false atau mode bernilai mock."
    ),
)

try:
    client = ArduBuddyClient()
    CLIENT_ERROR: str | None = None
except Exception as exc:  # konfigurasi pin tidak valid, dll.
    client = None
    CLIENT_ERROR = str(exc)


def _unavailable() -> dict[str, Any]:
    return {"success": False, "error": f"Adapter tidak siap: {CLIENT_ERROR}"}


def _device_mismatch(device_id: str | None) -> dict[str, Any] | None:
    if device_id is None or device_id == cfg.DEVICE_ID:
        return None
    return {
        "success": False,
        "error": (
            f"device_id '{device_id}' tidak dikenal. "
            f"Connector ini terikat ke '{cfg.DEVICE_ID}'."
        ),
    }


@mcp.tool()
async def list_devices() -> dict:
    """Daftar perangkat dan sensor yang diizinkan, beserta mode koneksi saat ini."""
    if client is None:
        return _unavailable()
    return {"success": True, **client.describe()}


@mcp.tool()
async def get_device_status(device_id: str | None = None) -> dict:
    """Periksa status koneksi perangkat ArduBuddy (online, IP, WiFi, uptime)."""
    mismatch = _device_mismatch(device_id)
    if mismatch:
        return mismatch
    if client is None:
        return _unavailable()
    try:
        return await client.status()
    except Exception as exc:
        logger.exception("get_device_status gagal")
        return {"success": False, "error": f"Device status unavailable: {exc}"}


@mcp.tool()
async def control_device(device_name: str, state: str, device_id: str | None = None) -> dict:
    """Nyalakan/matikan satu perangkat yang terdaftar. State hanya 'on' atau 'off'."""
    mismatch = _device_mismatch(device_id)
    if mismatch:
        return mismatch
    if client is None:
        return _unavailable()
    if device_name not in client.outputs:
        return {
            "success": False,
            "error": (
                f"Perangkat '{device_name}' tidak ada dalam allowlist. "
                f"Tersedia: {', '.join(sorted(client.outputs))}"
            ),
        }
    if state not in ALLOWED_STATES:
        return {"success": False, "error": "State harus 'on' atau 'off'."}
    try:
        return {"device_id": cfg.DEVICE_ID, **await client.set_output(device_name, state)}
    except Exception as exc:
        logger.exception("control_device gagal")
        return {"success": False, "device_name": device_name, "error": str(exc)}


@mcp.tool()
async def read_sensor(sensor_name: str, device_id: str | None = None) -> dict:
    """Baca sensor yang benar-benar tersedia pada perangkat (ADC)."""
    mismatch = _device_mismatch(device_id)
    if mismatch:
        return mismatch
    if client is None:
        return _unavailable()
    try:
        return {"device_id": cfg.DEVICE_ID, **await client.read_sensor(sensor_name)}
    except Exception as exc:
        logger.exception("read_sensor gagal")
        return {"success": False, "sensor_name": sensor_name, "error": str(exc)}


@mcp.tool()
async def set_room_scene(scene: str, device_id: str | None = None) -> dict:
    """Jalankan preset ruangan: 'meeting' atau 'eco'. Hasil dilaporkan per perangkat."""
    mismatch = _device_mismatch(device_id)
    if mismatch:
        return mismatch
    if client is None:
        return _unavailable()

    allowed = client.outputs.keys() if client else set()
    error = validate_scene(scene, allowed)
    if error:
        return {"success": False, "error": error}

    actions = SCENES[scene]["actions"]
    try:
        results = await client.run_chain(actions)
    except Exception as exc:
        logger.exception("set_room_scene gagal")
        return {"success": False, "scene": scene, "error": str(exc)}

    all_ok = all(item.get("success") is True for item in results)
    response = {
        "success": all_ok,
        "scene": scene,
        "description": SCENES[scene]["description"],
        "results": results,
    }
    if not all_ok:
        response["note"] = "Sebagian aksi gagal; jangan laporkan scene sebagai berhasil seluruhnya."
    return response


def run_server() -> None:
    cfg.setup_logging()
    logger.info(
        "ArduBuddy MCP start transport=%s mode=%s base_url=%s",
        cfg.MCP_TRANSPORT,
        "mock" if cfg.MOCK_MODE else "real",
        cfg.ARDUBUDDY_BASE_URL,
    )
    if cfg.MCP_TRANSPORT == "stdio":
        mcp.run(transport="stdio", show_banner=False)
    elif cfg.MCP_TRANSPORT in {"http", "streamable-http"}:
        mcp.run(transport="http", host=cfg.MCP_HOST, port=cfg.MCP_PORT, show_banner=False)
    else:
        raise ValueError(
            f"MCP_TRANSPORT '{cfg.MCP_TRANSPORT}' tidak dikenal. Gunakan 'stdio' atau 'http'."
        )


if __name__ == "__main__":
    run_server()
