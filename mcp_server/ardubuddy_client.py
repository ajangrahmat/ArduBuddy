"""Adapter HTTP untuk ArduBuddy v1.0 (ESP32).

Kontrak diverifikasi dari source firmware di repo ini:
- firmware/ardubuddy/src/main.cpp (route HTTP + handler)

Endpoint yang dipakai:
  GET  /api/status                -> status perangkat
  POST /api/skill/execute         -> {"tool": "gpio.write", "args": {"pin": 4, "value": true}}
  POST /api/skill/chain           -> [{"tool": ...}, ...]
  GET  /api/skills                -> daftar skill yang terdaftar

CATATAN KEAMANAN: firmware v1.0 tidak menyediakan autentikasi pada HTTP API.
Adapter hanya boleh diarahkan ke perangkat di jaringan lokal tepercaya.
Header Authorization dikirim hanya jika token diisi, dan firmware v1.0
akan mengabaikannya — jangan menganggap ini sebagai pengaman.
"""

from __future__ import annotations

import logging
import re
import uuid
from typing import Any

import httpx

from . import config as cfg
from .device_map import UNSUPPORTED_SENSORS, build_maps
from .network_guard import validate_base_url

logger = logging.getLogger("ardubuddy.client")


class ArduBuddyError(Exception):
    """Kegagalan komunikasi atau respons perangkat yang tidak dapat dipakai."""


def _new_request_id() -> str:
    return uuid.uuid4().hex[:12]


def _parse_state(message: str) -> str | None:
    """Ambil state aktual dari pesan acknowledgement perangkat."""
    if not isinstance(message, str):
        return None
    match = re.search(r"\b(HIGH|LOW|ON|OFF)\b", message, re.IGNORECASE)
    if not match:
        return None
    token = match.group(1).upper()
    return "on" if token in {"HIGH", "ON"} else "off"


class ArduBuddyClient:
    def __init__(self):
        self.outputs, self.sensors = build_maps()
        self.base_url = cfg.ARDUBUDDY_BASE_URL
        validate_base_url(self.base_url, cfg.ALLOW_PUBLIC_BASE_URL)
        self.timeout = cfg.ARDUBUDDY_TIMEOUT
        self.mock_mode = cfg.MOCK_MODE
        self.verify_after_write = cfg.VERIFY_AFTER_WRITE
        self.device_id = cfg.DEVICE_ID
        self._mock_states: dict[str, str] = {}

    # ------------------------------------------------------------------ utils
    def _headers(self) -> dict[str, str]:
        headers = {"Accept": "application/json"}
        if cfg.ARDUBUDDY_TOKEN:
            headers["Authorization"] = f"Bearer {cfg.ARDUBUDDY_TOKEN}"
        return headers

    async def _request(self, method: str, path: str, payload: Any = None) -> tuple[int, dict]:
        url = f"{self.base_url}{path}"
        try:
            async with httpx.AsyncClient(timeout=self.timeout, headers=self._headers()) as client:
                if method == "GET":
                    response = await client.get(url)
                else:
                    response = await client.post(url, json=payload)
        except httpx.TimeoutException as exc:
            raise ArduBuddyError(
                f"Perangkat tidak merespons dalam {self.timeout:g} detik ({url})."
            ) from exc
        except httpx.HTTPError as exc:
            raise ArduBuddyError(f"Gagal menghubungi perangkat ({url}): {exc}") from exc

        try:
            data = response.json()
        except ValueError as exc:
            raise ArduBuddyError(
                f"Perangkat membalas HTTP {response.status_code} bukan JSON."
            ) from exc
        if not isinstance(data, dict):
            raise ArduBuddyError("Format balasan perangkat tidak dikenal.")
        if response.status_code >= 400 and not data:
            raise ArduBuddyError(f"Perangkat membalas HTTP {response.status_code}.")
        return response.status_code, data

    def _skill_payload(self, tool: str, args: dict) -> dict:
        return {"tool": tool, "args": args}

    def _output_pin(self, device_name: str) -> int:
        if device_name not in self.outputs:
            raise ArduBuddyError(
                f"Perangkat '{device_name}' tidak ada dalam allowlist. "
                f"Tersedia: {', '.join(sorted(self.outputs))}"
            )
        return int(self.outputs[device_name]["pin"])

    def describe(self) -> dict:
        info = {
            "device_id": self.device_id,
            "base_url": self.base_url,
            "mode": "mock" if self.mock_mode else "real",
            "transport": "http/ardubuddy-v1.0",
            "outputs": {name: cfg["pin"] for name, cfg in self.outputs.items()},
            "sensors": {name: cfg["pin"] for name, cfg in self.sensors.items()},
            "unsupported_sensors": sorted(UNSUPPORTED_SENSORS),
        }
        if self.mock_mode:
            info["warning"] = (
                "MOCK MODE ACTIVE — all results are simulated. "
                "No physical device is contacted and sensor data is unavailable."
            )
        return info

    # ----------------------------------------------------------------- status
    async def status(self) -> dict:
        request_id = _new_request_id()
        if self.mock_mode:
            result = {
                "success": True,
                "device_id": self.device_id,
                "reachable": True,
                "status": "mock",
                "mode": "mock",
                "simulated": True,
                "note": "Mock mode: tidak ada perangkat fisik yang dihubungi.",
            }
        else:
            _, data = await self._request("GET", "/api/status")
            if not data.get("ok"):
                raise ArduBuddyError("Perangkat menolak permintaan status.")
            connected = bool(data.get("connected"))
            result = {
                "success": True,
                "device_id": self.device_id,
                "reachable": True,
                "status": "online" if connected else "wifi_disconnected",
                "mode": "real",
                "simulated": False,
                "connected": connected,
                "ip": data.get("ip"),
                "ssid": data.get("ssid"),
                "uptime_seconds": data.get("uptime"),
                "free_heap": data.get("heap"),
                "skill_count": data.get("skill_count"),
            }
        result["request_id"] = request_id
        logger.info("status %s result=%s", request_id, result.get("status"))
        return result

    # ---------------------------------------------------------------- outputs
    async def set_output(self, device_name: str, state: str) -> dict:
        if state not in {"on", "off"}:
            raise ArduBuddyError("State harus 'on' atau 'off'.")
        pin = self._output_pin(device_name)
        request_id = _new_request_id()

        if self.mock_mode:
            self._mock_states[device_name] = state
            result = {
                "success": True,
                "device_name": device_name,
                "actual_state": state,
                "mode": "mock",
                "simulated": True,
                "verified": True,
                "verified_by": "mock_state",
                "note": "Mock mode: tidak ada perangkat fisik yang dihubungi.",
            }
        else:
            payload = self._skill_payload(
                "gpio.write", {"pin": pin, "value": state == "on"}
            )
            status_code, data = await self._request("POST", "/api/skill/execute", payload)
            ok = bool(data.get("ok")) and status_code < 400
            message = str(data.get("message", ""))
            if not ok:
                logger.warning("write %s %s=%s GAGAL: %s", request_id, device_name, state, message)
                return {
                    "success": False,
                    "device_name": device_name,
                    "error": message or "Perangkat menolak perintah gpio.write.",
                    "mode": "real",
                    "request_id": request_id,
                }

            actual_state = _parse_state(message)
            verified_by = "device_ack"
            verified = actual_state is not None
            if self.verify_after_write:
                _, read_data = await self._request(
                    "POST", "/api/skill/execute",
                    self._skill_payload("gpio.read", {"pin": pin}),
                )
                if read_data.get("ok"):
                    confirmed = _parse_state(str(read_data.get("message", "")))
                    if confirmed:
                        actual_state = confirmed
                        verified_by = "gpio.read"
                        verified = True

            result = {
                "success": True,
                "device_name": device_name,
                "requested_state": state,
                "actual_state": actual_state,
                "mode": "real",
                "simulated": False,
                "verified": verified,
                "verified_by": verified_by,
                "device_message": message,
            }

        result["request_id"] = request_id
        logger.info(
            "write %s %s=%s -> %s", request_id, device_name, state, result.get("actual_state")
        )
        return result

    # ---------------------------------------------------------------- sensors
    async def read_sensor(self, sensor_name: str) -> dict:
        request_id = _new_request_id()
        base = {"sensor_name": sensor_name, "request_id": request_id}

        if sensor_name in UNSUPPORTED_SENSORS:
            return {**base, "success": False, "error": UNSUPPORTED_SENSORS[sensor_name]}
        if sensor_name not in self.sensors:
            return {
                **base,
                "success": False,
                "error": (
                    f"Sensor '{sensor_name}' tidak terdaftar. "
                    f"Tersedia: {', '.join(sorted(self.sensors))}"
                ),
            }
        if self.mock_mode:
            # Sengaja gagal: mock tidak boleh menyajikan angka sebagai data real.
            return {
                **base,
                "success": False,
                "mode": "mock",
                "simulated": True,
                "error": "Mock mode tidak menyediakan data sensor. Matikan mock mode dan hubungkan ESP32.",
            }

        entry = self.sensors[sensor_name]
        if entry.get("kind", "adc") != "adc":
            return {**base, "success": False, "error": "Jenis sensor belum didukung adapter."}

        payload = self._skill_payload("adc.read", {"pin": int(entry["pin"])})
        status_code, data = await self._request("POST", "/api/skill/execute", payload)
        message = str(data.get("message", ""))
        if not data.get("ok") or status_code >= 400:
            return {
                **base,
                "success": False,
                "mode": "real",
                "error": message or "Perangkat menolak perintah adc.read.",
            }

        raw_match = re.search(r"raw=(\d+)", message)
        volt_match = re.search(r"voltage=([0-9]*\.?[0-9]+)V", message)
        if not volt_match:
            return {
                **base,
                "success": False,
                "mode": "real",
                "error": f"Nilai sensor tidak dapat dibaca dari balasan perangkat: {message}",
            }
        result = {
            **base,
            "success": True,
            "mode": "real",
            "simulated": False,
            "value": float(volt_match.group(1)),
            "unit": entry.get("unit", "V"),
            "raw": int(raw_match.group(1)) if raw_match else None,
            "device_message": message,
        }
        logger.info("sensor %s %s=%s%s", request_id, sensor_name, result["value"], result["unit"])
        return result

    # ------------------------------------------------------------------ scenes
    async def run_chain(self, actions: list[dict]) -> list[dict]:
        """Jalankan beberapa gpio.write dalam satu request /api/skill/chain."""
        request_id = _new_request_id()
        if self.mock_mode:
            results = []
            for action in actions:
                name, state = action["device_name"], action["state"]
                self._mock_states[name] = state
                results.append({
                    "device_name": name,
                    "success": True,
                    "actual_state": state,
                    "mode": "mock",
                    "simulated": True,
                    "verified": True,
                    "verified_by": "mock_state",
                })
            return results

        payload = [
            self._skill_payload("gpio.write", {
                "pin": self._output_pin(action["device_name"]),
                "value": action["state"] == "on",
            })
            for action in actions
        ]
        status_code, data = await self._request("POST", "/api/skill/chain", payload)
        raw_results = data.get("results")
        if not isinstance(raw_results, list) or len(raw_results) != len(actions):
            raise ArduBuddyError("Balasan /api/skill/chain tidak lengkap; hasil per perangkat tidak diketahui.")

        results = []
        for action, item in zip(actions, raw_results):
            message = str(item.get("message", "")) if isinstance(item, dict) else ""
            ok = bool(isinstance(item, dict) and item.get("success")) and status_code < 400
            results.append({
                "device_name": action["device_name"],
                "success": ok,
                "requested_state": action["state"],
                "actual_state": _parse_state(message) if ok else None,
                "mode": "real",
                "simulated": False,
                "device_message": message,
                "error": None if ok else (message or "Perangkat menolak perintah."),
            })
        logger.info("chain %s ok=%s/%s", request_id, sum(r["success"] for r in results), len(results))
        return results

    # ------------------------------------------------------------------ skills
    async def list_skills(self) -> dict:
        if self.mock_mode:
            return {"success": True, "mode": "mock", "skills": sorted(self.outputs)}
        _, data = await self._request("GET", "/api/skills")
        return {
            "success": True,
            "mode": "real",
            "skills": [s.strip() for s in str(data.get("skills", "")).split(",") if s.strip()],
        }
