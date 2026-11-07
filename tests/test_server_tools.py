import asyncio

from mcp_server import server
from mcp_server.scenes import SCENES


def run(coro):
    return asyncio.run(coro)


def test_list_devices():
    result = run(server.list_devices())
    assert result["success"] is True
    assert "meeting_light" in result["outputs"]
    assert result["mode"] == "mock"
    assert "MOCK MODE" in result["warning"]


def test_status_rejects_unknown_device_id():
    result = run(server.get_device_status("perangkat-lain"))
    assert result["success"] is False


def test_control_device_validates_allowlist_and_state():
    assert run(server.control_device("mesin_kopi", "on"))["success"] is False
    assert run(server.control_device("meeting_light", "REBOOT"))["success"] is False


def test_control_device_mock_is_simulated():
    result = run(server.control_device("meeting_light", "on"))
    assert result["success"] is True
    assert result["simulated"] is True
    assert result["actual_state"] == "on"


def test_read_sensor_in_mock_mode_fails_cleanly():
    result = run(server.read_sensor("room_light_adc"))
    assert result["success"] is False
    assert "Mock" in result["error"] or "mock" in result["error"]


def test_unknown_scene_is_rejected():
    assert run(server.set_room_scene("pesta"))["success"] is False


def test_scene_reports_each_device():
    result = run(server.set_room_scene("eco"))
    assert result["success"] is True
    assert len(result["results"]) == len(SCENES["eco"]["actions"])
    assert all(item["actual_state"] == "off" for item in result["results"])
