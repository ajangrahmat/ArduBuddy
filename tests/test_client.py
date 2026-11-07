import asyncio

import pytest

from mcp_server import config as cfg
from mcp_server.ardubuddy_client import ArduBuddyClient, ArduBuddyError, _parse_state
from tests.fake_ardubuddy import FakeArduBuddy


def run(coro):
    return asyncio.run(coro)


@pytest.fixture
def real(monkeypatch):
    with FakeArduBuddy() as fake:
        monkeypatch.setattr(cfg, "MOCK_MODE", False)
        monkeypatch.setattr(cfg, "ARDUBUDDY_BASE_URL", fake.base_url)
        monkeypatch.setattr(cfg, "VERIFY_AFTER_WRITE", True)
        yield ArduBuddyClient(), fake


def test_parse_state_from_device_message():
    assert _parse_state("GPIO 4 → HIGH (ON)") == "on"
    assert _parse_state("GPIO 4 = LOW") == "off"
    assert _parse_state("ADC pin 34: raw=2840 voltage=2.290V") is None


def test_mock_status_is_explicitly_simulated():
    result = run(ArduBuddyClient().status())
    assert result["success"] is True
    assert result["simulated"] is True
    assert result["status"] == "mock"


def test_mock_write_is_explicitly_simulated():
    result = run(ArduBuddyClient().set_output("meeting_light", "on"))
    assert result["success"] is True and result["simulated"] is True
    assert result["actual_state"] == "on"


def test_mock_sensor_never_reports_fake_data():
    result = run(ArduBuddyClient().read_sensor("room_light_adc"))
    assert result["success"] is False
    assert result["simulated"] is True


def test_unsupported_sensor_has_clear_error():
    result = run(ArduBuddyClient().read_sensor("room_temperature"))
    assert result["success"] is False
    assert "v1.0" in result["error"]


def test_unknown_device_is_rejected():
    with pytest.raises(ArduBuddyError):
        run(ArduBuddyClient().set_output("mesin_kopi", "on"))


def test_real_status(real):
    client, _ = real
    result = run(client.status())
    assert result["success"] is True
    assert result["status"] == "online"
    assert result["mode"] == "real" and result["simulated"] is False
    assert result["ip"] == "127.0.0.1"


def test_real_write_is_verified_by_gpio_read(real):
    client, fake = real
    result = run(client.set_output("meeting_light", "on"))
    assert result["success"] is True
    assert result["actual_state"] == "on"
    assert result["verified"] is True
    assert result["verified_by"] == "gpio.read"
    assert fake.outputs[4] is True


def test_real_write_failure_is_not_reported_as_success(real):
    client, fake = real
    fake.fail_next_write = True
    result = run(client.set_output("meeting_light", "on"))
    assert result["success"] is False
    assert result["error"]


def test_real_sensor_parses_adc_message(real):
    client, _ = real
    result = run(client.read_sensor("room_light_adc"))
    assert result["success"] is True
    assert result["value"] == 2.29
    assert result["unit"] == "V"
    assert result["raw"] == 2840
    assert result["simulated"] is False


def test_real_chain_reports_each_device(real):
    client, _ = real
    results = run(client.run_chain([
        {"device_name": "meeting_light", "state": "off"},
        {"device_name": "projector_indicator", "state": "off"},
    ]))
    assert len(results) == 2
    assert all(item["success"] is True for item in results)
    assert all(item["actual_state"] == "off" for item in results)


def test_real_chain_partial_failure_is_visible(real):
    client, fake = real
    fake.partial_chain_failure = True
    results = run(client.run_chain([
        {"device_name": "meeting_light", "state": "on"},
        {"device_name": "projector_indicator", "state": "on"},
    ]))
    assert [item["success"] for item in results] == [True, False]
