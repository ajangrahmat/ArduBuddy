"""Safety guard for the ESP32 address.

ArduBuddy v1.0 has no authentication on its HTTP API. Sending commands to a
public address would expose a device (or hit the wrong host) with no protection.
By default the connector therefore only accepts loopback, private/link-local
IPs and common LAN hostnames. Set ALLOW_PUBLIC_BASE_URL=true to override.
"""

from __future__ import annotations

import ipaddress
from urllib.parse import urlparse

LAN_SUFFIXES = (".local", ".lan", ".internal", ".home.arpa")


class NetworkGuardError(Exception):
    """The configured device address is not safe to use by default."""


def validate_base_url(url: str, allow_public: bool = False) -> str:
    """Return the URL if acceptable, otherwise raise NetworkGuardError."""
    if allow_public:
        return url

    parsed = urlparse((url or "").strip())
    if parsed.scheme not in {"http", "https"}:
        raise NetworkGuardError(
            "ESP32 address must start with http:// or https://."
        )
    host = (parsed.hostname or "").lower()
    if not host:
        raise NetworkGuardError("ESP32 address has no host name.")

    if host in {"localhost", "127.0.0.1", "::1"}:
        return url
    if "." not in host or host.endswith(LAN_SUFFIXES):
        return url

    try:
        address = ipaddress.ip_address(host)
    except ValueError:
        raise NetworkGuardError(
            f"'{host}' is not a private LAN address. Use an IP like 192.168.1.50, "
            "a .local hostname, or set ALLOW_PUBLIC_BASE_URL=true deliberately."
        ) from None

    if address.is_private or address.is_loopback or address.is_link_local:
        return url
    raise NetworkGuardError(
        f"'{host}' is a public address. ArduBuddy v1.0 has no authentication, so "
        "only LAN targets are allowed. Set ALLOW_PUBLIC_BASE_URL=true only if you "
        "fully control the network path."
    )
