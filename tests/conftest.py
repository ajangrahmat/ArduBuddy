"""Isolasi tes: jangan pernah menyentuh config asli pengguna."""

import os
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

TMP = Path(tempfile.gettempdir()) / "ardubuddy-pytest"
os.environ["ARDUBUDDY_CONFIG_DIR"] = str(TMP / "config")
os.environ["WORKBUDDY_MCP_CONFIG"] = str(TMP / "mcp.json")
os.environ["MOCK_MODE"] = "true"
os.environ["MCP_TRANSPORT"] = "stdio"
