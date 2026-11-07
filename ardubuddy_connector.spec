# -*- mode: python ; coding: utf-8 -*-
"""PyInstaller spec untuk ArduBuddy.exe (one-file, console)."""

from PyInstaller.building.build_main import Analysis, PYZ, EXE

hidden = [
    "fastmcp",
    "mcp",
    "httpx",
    "httpcore",
    "dotenv",
    "anyio",
    "sniffio",
    "pydantic",
    "pydantic_core",
    "rich",
    "uvicorn",
    "starlette",
    "tkinter",
    "tkinter.ttk",
    "tkinter.scrolledtext",
    "tkinter.messagebox",
    "mcp_server",
    "mcp_server.server",
    "mcp_server.config",
    "mcp_server.device_map",
    "mcp_server.scenes",
    "mcp_server.ardubuddy_client",
    "mcp_server.network_guard",
    "connector",
    "connector.app",
    "connector.gui",
    "connector.installer",
]
a = Analysis(
    ["connector/app.py"],
    pathex=["."],
    binaries=[],
    datas=[],
    hiddenimports=hidden,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=["pytest", "matplotlib", "numpy", "pandas", "PIL", "pillow"],
    noarchive=False,
)

pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name="ArduBuddy",
    icon="website/favicon.ico",
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=False,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
