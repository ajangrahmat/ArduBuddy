from mcp_server.scenes import ALLOWED_DEVICES, ALLOWED_STATES, SCENES, validate_scene


def test_expected_scenes_exist():
    assert "meeting" in SCENES
    assert "eco" in SCENES


def test_scene_devices_are_allowlisted():
    for scene in SCENES.values():
        for action in scene["actions"]:
            assert action["device_name"] in ALLOWED_DEVICES


def test_scene_states_are_valid():
    for scene in SCENES.values():
        for action in scene["actions"]:
            assert action["state"] in ALLOWED_STATES


def test_validate_scene_accepts_known_scenes():
    for name in SCENES:
        assert validate_scene(name, ALLOWED_DEVICES) is None


def test_validate_scene_rejects_unknown_scene():
    assert "Unknown scene" in validate_scene("tidur", ALLOWED_DEVICES)


def test_validate_scene_rejects_missing_device():
    error = validate_scene("meeting", {"meeting_light"})
    assert "allowlist" in error


def test_meeting_and_eco_are_opposites():
    meeting = {a["device_name"]: a["state"] for a in SCENES["meeting"]["actions"]}
    eco = {a["device_name"]: a["state"] for a in SCENES["eco"]["actions"]}
    assert set(meeting) == set(eco)
    assert all(meeting[name] == "on" and eco[name] == "off" for name in meeting)
