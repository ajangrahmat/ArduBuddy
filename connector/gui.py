"""Simple setup window for the ArduBuddy connector.

Opened when the executable is double-clicked. No internet required; the only
files touched are the connector config and WorkBuddy's mcp.json.
"""

from __future__ import annotations

import json
import tkinter as tk
import webbrowser
from tkinter import messagebox, scrolledtext, ttk

from . import installer
from mcp_server.device_map import DEFAULT_OUTPUTS, DEFAULT_SENSORS

VERSION = "1.0.0"

DEVICE_LABELS = {
    "meeting_light": "Meeting-room lamp (relay 1)",
    "projector_indicator": "Projector lamp (relay 2)",
    "room_fan": "Room fan (relay 3)",
    "desk_lamp": "Desk lamp (relay 4)",
}
SENSOR_LABEL = "ADC1 (GPIO 32-39), reported in volts"


def _pin_of(saved: dict, group: str, name: str, fallback: dict) -> int:
    entry = (saved.get(group) or {}).get(name)
    if isinstance(entry, dict) and isinstance(entry.get("pin"), int):
        return entry["pin"]
    if isinstance(entry, int):
        return entry
    return fallback[name]["pin"]


def launch() -> None:
    saved = installer.read_user_config()
    root = tk.Tk()
    root.title(f"ArduBuddy — Connector Setup v{VERSION}")
    root.geometry("720x690")
    root.minsize(680, 630)

    frame = ttk.Frame(root, padding=16)
    frame.pack(fill="both", expand=True)

    ttk.Label(frame, text="ArduBuddy", font=("Segoe UI", 16, "bold")).pack(anchor="w")
    ttk.Label(
        frame,
        text="One file that registers the MCP connector in WorkBuddy and links it to your ESP32.",
        wraplength=670,
    ).pack(anchor="w", pady=(2, 14))

    form = ttk.LabelFrame(frame, text="Device connection", padding=12)
    form.pack(fill="x")
    form.columnconfigure(1, weight=1)

    base_var = tk.StringVar(value=str(saved.get("base_url", "http://192.168.1.100")))
    device_var = tk.StringVar(value=str(saved.get("device_id", "office-main")))
    mock_var = tk.BooleanVar(value=bool(saved.get("mock_mode", True)))

    ttk.Label(form, text="ESP32 address").grid(row=0, column=0, sticky="w", pady=4)
    ttk.Entry(form, textvariable=base_var).grid(row=0, column=1, sticky="ew", pady=4)
    ttk.Label(form, text="Device ID").grid(row=1, column=0, sticky="w", pady=4)
    ttk.Entry(form, textvariable=device_var).grid(row=1, column=1, sticky="ew", pady=4)
    ttk.Checkbutton(
        form,
        text="Mock mode (try it without a board)",
        variable=mock_var,
    ).grid(row=2, column=0, columnspan=2, sticky="w", pady=6)

    mock_banner = tk.Label(
        form,
        text="MOCK MODE ON — all results are simulated. No real device is contacted.",
        background="#fff4de",
        foreground="#7a4d05",
        font=("Segoe UI", 9, "bold"),
        anchor="w",
        padx=10,
        pady=7,
    )

    def refresh_mock_banner(*_args) -> None:
        if mock_var.get():
            mock_banner.grid(row=3, column=0, columnspan=2, sticky="ew", pady=(0, 8))
        else:
            mock_banner.grid_remove()

    mock_var.trace_add("write", refresh_mock_banner)

    pin_frame = ttk.LabelFrame(frame, text="GPIO mapping (match your wiring)", padding=12)
    pin_frame.pack(fill="x", pady=(12, 0))
    pin_vars: dict[str, tk.StringVar] = {}
    for index, name in enumerate(DEFAULT_OUTPUTS):
        ttk.Label(pin_frame, text=name).grid(row=index, column=0, sticky="w", padx=(0, 12), pady=3)
        var = tk.StringVar(value=str(_pin_of(saved, "devices", name, DEFAULT_OUTPUTS)))
        ttk.Entry(pin_frame, textvariable=var, width=8).grid(row=index, column=1, sticky="w", pady=3)
        ttk.Label(pin_frame, text=DEVICE_LABELS.get(name, ""), foreground="#666666").grid(
            row=index, column=2, sticky="w", padx=(12, 0), pady=3
        )
        pin_vars[name] = var

    sensor_name = "room_light_adc"
    ttk.Label(pin_frame, text=sensor_name).grid(row=len(pin_vars), column=0, sticky="w", padx=(0, 12), pady=3)
    sensor_var = tk.StringVar(value=str(_pin_of(saved, "sensors", sensor_name, DEFAULT_SENSORS)))
    ttk.Entry(pin_frame, textvariable=sensor_var, width=8).grid(
        row=len(pin_vars), column=1, sticky="w", pady=3
    )
    ttk.Label(pin_frame, text=SENSOR_LABEL, foreground="#666666").grid(
        row=len(pin_vars), column=2, sticky="w", padx=(12, 0), pady=3
    )

    log = scrolledtext.ScrolledText(frame, height=12, font=("Consolas", 9), state="disabled")
    log.pack(fill="both", expand=True, pady=(12, 8))

    def write(message: str) -> None:
        log.configure(state="normal")
        log.insert("end", message.rstrip() + "\n")
        log.see("end")
        log.configure(state="disabled")
        root.update_idletasks()

    def collect_values() -> dict:
        devices = {}
        for name, var in pin_vars.items():
            devices[name] = {"pin": int(var.get().strip())}
        return {
            "base_url": base_var.get().strip().rstrip("/"),
            "device_id": device_var.get().strip() or "office-main",
            "mock_mode": bool(mock_var.get()),
            "transport": "stdio",
            "devices": devices,
            "sensors": {
                sensor_name: {
                    "pin": int(sensor_var.get().strip()),
                    "kind": "adc",
                    "unit": "V",
                }
            },
        }

    def do_test() -> None:
        write(f"Checking {base_var.get().strip()}/api/status ...")
        result = installer.test_connection(base_var.get().strip())
        write(json.dumps(result, indent=2, ensure_ascii=False))
        if result.get("reachable"):
            messagebox.showinfo("Connection", "The board responded. You are ready to register.")
        else:
            messagebox.showwarning("Connection", result.get("error", "No response from the board."))

    def do_install() -> None:
        try:
            values = collect_values()
        except ValueError as exc:
            messagebox.showerror("Invalid input", f"GPIO pins must be numbers: {exc}")
            return
        try:
            config_path = installer.save_user_config(values)
            write(f"Config saved: {config_path}")
            result = installer.register_connector()
            write(f"mcp.json updated: {result['mcp_config']}")
            if result["backup"]:
                write(f"Previous config backed up: {result['backup']}")
            write("Command: " + result["entry"]["command"] + " " + " ".join(result["entry"]["args"]))
        except Exception as exc:
            messagebox.showerror("Failed", f"Setup failed: {exc}")
            write(f"ERROR: {exc}")
            return
        messagebox.showinfo(
            "Done",
            "Connector registered.\n\n"
            "1. Close and reopen WorkBuddy.\n"
            "2. Open Connectors > Custom Connector.\n"
            "3. Click Trust on 'ardubuddy'.\n\n"
            "This same executable is the MCP server, so keep it where it is.",
        )

    def do_uninstall() -> None:
        result = installer.unregister_connector()
        write(f"Registration removed: {result['removed']} ({result['mcp_config']})")

    def do_diagnostics() -> None:
        write(json.dumps(installer.diagnose(), indent=2, ensure_ascii=False))

    def do_website() -> None:
        webbrowser.open(installer.WEBSITE_URL)

    buttons = ttk.Frame(frame)
    buttons.pack(fill="x")
    ttk.Button(buttons, text="Test connection", command=do_test).pack(side="left")
    ttk.Button(buttons, text="Save & register", command=do_install).pack(side="left", padx=6)
    ttk.Button(buttons, text="Diagnostics", command=do_diagnostics).pack(side="left")
    ttk.Button(buttons, text="Unregister", command=do_uninstall).pack(side="left", padx=6)
    ttk.Button(buttons, text="Open guide", command=do_website).pack(side="right")

    write("Ready. Enter the ESP32 address, test the connection, then click 'Save & register'.")
    write("Before testing: set up Wi-Fi in flash.html and press 'Connect my ESP32'.")
    write("That page sends {\"c\":\"start\"} to enable /api/* — no LLM or API key needed.")
    write("After a board reboot, send start again from the same page.")
    if mock_var.get():
        write("MOCK MODE is ON — results are simulated until you turn it off.")
    write("Firmware: ArduBuddy v1.0 — source: firmware/ardubuddy")
    refresh_mock_banner()
    root.mainloop()
