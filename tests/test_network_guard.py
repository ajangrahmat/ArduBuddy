import pytest

from mcp_server.network_guard import NetworkGuardError, validate_base_url


@pytest.mark.parametrize(
    "url",
    [
        "http://192.168.1.50",
        "http://10.0.0.7:8080",
        "http://172.16.4.2",
        "http://169.254.1.5",
        "http://127.0.0.1:8765",
        "http://localhost",
        "http://ardubuddy.local",
        "http://office.lan",
        "http://esp32",
    ],
)
def test_allows_lan_targets(url):
    assert validate_base_url(url) == url


@pytest.mark.parametrize(
    "url",
    [
        "http://8.8.8.8",
        "https://1.1.1.1",
        "https://ardubuddy.example.com",
        "ftp://192.168.1.5",
        "http://",
        "not-a-url",
    ],
)
def test_blocks_public_or_invalid_targets(url):
    with pytest.raises(NetworkGuardError):
        validate_base_url(url)


def test_override_allows_public_target():
    url = "https://ardubuddy.example.com"
    assert validate_base_url(url, allow_public=True) == url


def test_public_ip_error_mentions_auth_limit():
    with pytest.raises(NetworkGuardError) as exc:
        validate_base_url("http://8.8.8.8")
    assert "authentication" in str(exc.value)
