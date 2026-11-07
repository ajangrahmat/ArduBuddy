"""Pemetaan nama perangkat logis -> pin fisik ArduBuddy.

Nama logis yang dikirim LLM tetap menjadi satu-satunya yang boleh dipakai;
nomor GPIO tidak pernah diterima dari tool call.

Pin default diambil dari daftar pin aman pada dokumentasi resmi ArduBuddy:
docs/FIRMWARE-AND-FLASH.md (pemetaan perangkat)
Pin strapping: 0, 2, 5, 12, 15. ADC2 (25-27) tidak bisa dipakai saat WiFi aktif,
jadi sensor ADC memakai GPIO 32-39.

Nomor pin Tetap wajib dicek terhadap wiring fisik sebelum demo.
"""

from __future__ import annotations

from .config import (
    ADC_SAFE_PINS,
    ALLOW_STRAPPING_PINS,
    DEVICE_OVERRIDES,
    SENSOR_OVERRIDES,
    STRAPPING_PINS,
)

DEFAULT_OUTPUTS = {
    # Contoh pin aman (non-strapping). Firmware v1.0 dikirim dengan default
    # 5/16/17/4; GPIO 5 adalah strapping pin sehingga connector menolaknya
    # kecuali ALLOW_STRAPPING_PINS=true. Samakan peta ini dengan wiring-mu
    # lewat GUI installer atau ARDUBUDDY_DEVICE_OVERRIDES.
    "meeting_light": {"pin": 4, "label": "Lampu ruang rapat (relay 1)"},
    "projector_indicator": {"pin": 16, "label": "Lampu proyektor (relay 2)"},
    "room_fan": {"pin": 17, "label": "Kipas ruangan (relay 3)"},
    "desk_lamp": {"pin": 18, "label": "Lampu meja (relay 4)"},
}

DEFAULT_SENSORS = {
    "room_light_adc": {
        "pin": 34,
        "kind": "adc",
        "unit": "V",
        "label": "Tegangan ADC GPIO34 (sensor cahaya/potensiometer)",
    },
}

# Sensor yang sering diminta tetapi BELUM tersedia di ArduBuddy v1.0.
UNSUPPORTED_SENSORS = {
    "room_temperature": "ArduBuddy v1.0 belum mendaftarkan skill sensor suhu. Gunakan ADC atau tambahkan skill sensor terlebih dahulu.",
    "room_humidity": "ArduBuddy v1.0 belum mendaftarkan skill sensor kelembapan. Gunakan ADC atau tambahkan skill sensor terlebih dahulu.",
}


def _validate_pin(name: str, entry: dict, is_sensor: bool) -> dict:
    pin = entry.get("pin")
    if not isinstance(pin, int) or isinstance(pin, bool):
        raise ValueError(f"Pin untuk '{name}' harus berupa bilangan bulat.")
    if not 0 <= pin <= 39:
        raise ValueError(f"Pin {pin} untuk '{name}' di luar rentang GPIO ESP32 (0-39).")
    if pin in STRAPPING_PINS and not ALLOW_STRAPPING_PINS:
        raise ValueError(
            f"GPIO {pin} untuk '{name}' adalah strapping pin. "
            "Ganti pin atau aktifkan allow_strapping_pins secara sadar."
        )
    if is_sensor and entry.get("kind", "adc") == "adc" and pin not in ADC_SAFE_PINS:
        raise ValueError(
            f"GPIO {pin} untuk sensor '{name}' bukan ADC1. "
            "Saat WiFi aktif hanya GPIO 32-39 yang bisa dipakai ADC."
        )
    return entry


def _merge(defaults: dict, overrides, is_sensor: bool = False) -> dict:
    result = {name: dict(cfg) for name, cfg in defaults.items()}
    if not isinstance(overrides, dict):
        return {name: _validate_pin(name, cfg, is_sensor) for name, cfg in result.items()}

    for name, cfg in overrides.items():
        if not isinstance(name, str) or not name.replace("_", "").isalnum():
            continue
        if cfg is None or cfg is False:
            result.pop(name, None)
            continue
        if isinstance(cfg, int):
            cfg = {"pin": cfg}
        if not isinstance(cfg, dict):
            continue
        merged = dict(result.get(name, {}))
        merged.update(cfg)
        if merged.get("enabled") is False:
            result.pop(name, None)
            continue
        result[name] = merged

    return {
        name: _validate_pin(name, cfg, is_sensor)
        for name, cfg in result.items()
        if cfg.get("enabled") is not False
    }


def build_maps() -> tuple[dict, dict]:
    """Kembalikan (outputs, sensors) yang sudah divalidasi."""
    return _merge(DEFAULT_OUTPUTS, DEVICE_OVERRIDES), _merge(DEFAULT_SENSORS, SENSOR_OVERRIDES, True)
