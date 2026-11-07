"""Preset scene berbasis nama perangkat logis, bukan nomor GPIO bebas."""

from __future__ import annotations

SCENES = {
    "meeting": {
        "description": "Persiapan ruang rapat",
        "actions": [
            {"device_name": "meeting_light", "state": "on"},
            {"device_name": "projector_indicator", "state": "on"},
            {"device_name": "room_fan", "state": "on"},
            {"device_name": "desk_lamp", "state": "on"},
        ],
    },
    "eco": {
        "description": "Mode hemat energi",
        "actions": [
            {"device_name": "meeting_light", "state": "off"},
            {"device_name": "projector_indicator", "state": "off"},
            {"device_name": "room_fan", "state": "off"},
            {"device_name": "desk_lamp", "state": "off"},
        ],
    },
}

# Tetap dipertahankan untuk kompatibilitas dengan tes lama dan dokumentasi.
ALLOWED_DEVICES = {"meeting_light", "projector_indicator", "room_fan", "desk_lamp"}
ALLOWED_STATES = {"on", "off"}


def validate_scene(scene: str, allowed_devices) -> str | None:
    """Periksa isi scene sebelum ada perintah dikirim ke perangkat.

    Kembalikan pesan error, atau None jika aman dijalankan.
    """
    if scene not in SCENES:
        return f"Unknown scene. Available scenes: {', '.join(SCENES)}"
    for action in SCENES[scene]["actions"]:
        name = action.get("device_name")
        state = action.get("state")
        if name not in allowed_devices:
            return f"Scene '{scene}' memuat perangkat di luar allowlist: {name}"
        if state not in ALLOWED_STATES:
            return f"Scene '{scene}' memuat state tidak valid: {state}"
    return None
