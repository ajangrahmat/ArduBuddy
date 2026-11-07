"""Bangun ArduBuddy.exe dengan PyInstaller.

Jalankan:  python build_exe.py
Hasil:     dist/ArduBuddy.exe
"""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SPEC = ROOT / "ardubuddy_connector.spec"
OUTPUT = ROOT / "dist" / "ArduBuddy.exe"


def main() -> int:
    try:
        import PyInstaller  # noqa: F401
    except ImportError:
        print("PyInstaller belum terpasang. Jalankan: pip install -r requirements-build.txt")
        return 1

    print(f"Building {OUTPUT.name} ...")
    subprocess.check_call(
        [sys.executable, "-m", "PyInstaller", "--noconfirm", "--clean", str(SPEC)],
        cwd=ROOT,
    )
    if OUTPUT.is_file():
        print(f"Selesai: {OUTPUT} ({OUTPUT.stat().st_size / 1024 / 1024:.1f} MB)")
        return 0
    print("Build selesai tetapi executable tidak ditemukan.")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
