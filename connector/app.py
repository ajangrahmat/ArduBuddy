"""Entry point executable ArduBuddy.

Satu file exe, tiga peran:
  ArduBuddy.exe                 -> installer GUI (dobel klik)
  ArduBuddy.exe --serve         -> MCP server stdio (dipanggil WorkBuddy)
  ArduBuddy.exe --check         -> diagnostik JSON ke konsol
  ArduBuddy.exe --uninstall     -> hapus pendaftaran connector
  ArduBuddy.exe --version       -> versi
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

# Saat dijalankan sebagai script (python connector/app.py), root proyek
# belum ada di sys.path sehingga paket mcp_server/connector tidak ditemukan.
if __package__ in (None, ""):
    sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

VERSION = "1.0.0"


def detach_console() -> None:
    """Lepas console saat mode GUI agar tidak ada jendela hitam mengganggu.

    FreeConsole hanya melepaskan proses ini; console milik terminal lain
    (mis. cmd) tetap utuh.
    """
    if sys.platform != "win32":
        return
    try:
        import ctypes

        ctypes.windll.kernel32.FreeConsole()
    except Exception:
        pass


def main(argv: list[str] | None = None) -> int:
    args = list(sys.argv[1:] if argv is None else argv)

    if "--version" in args:
        print(f"ArduBuddy connector {VERSION}")
        return 0

    if "--serve" in args:
        from mcp_server.server import run_server

        run_server()
        return 0

    if "--check" in args:
        from connector.installer import diagnose

        print(json.dumps(diagnose(), indent=2, ensure_ascii=False))
        return 0

    if "--uninstall" in args:
        from connector.installer import unregister_connector

        print(json.dumps(unregister_connector(), indent=2, ensure_ascii=False))
        return 0

    detach_console()
    from connector.gui import launch

    launch()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
