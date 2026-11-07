"""Server HTTP tiruan yang meniru kontrak ArduBuddy v1.0 untuk integration test."""

from __future__ import annotations

import json
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer


class FakeArduBuddy:
    def __init__(self):
        self.outputs: dict[int, bool] = {}
        self.fail_next_write = False
        self.partial_chain_failure = False
        self._server = None
        self._thread = None

    def _handler(self):
        fake = self

        class Handler(BaseHTTPRequestHandler):
            def log_message(self, *args):
                pass

            def _send(self, status, payload):
                body = json.dumps(payload).encode("utf-8")
                self.send_response(status)
                self.send_header("Content-Type", "application/json")
                self.send_header("Content-Length", str(len(body)))
                self.end_headers()
                self.wfile.write(body)

            def do_GET(self):
                if self.path == "/api/status":
                    self._send(200, {
                        "ok": True, "connected": True, "ssid": "LAB", "ip": "127.0.0.1",
                        "uptime": 42, "heap": 120000, "min_heap": 110000, "skill_count": 31,
                    })
                elif self.path == "/api/skills":
                    self._send(200, {"ok": True, "skills": "gpio.write, gpio.read, adc.read"})
                else:
                    self._send(404, {"ok": False, "error": "not found"})

            def do_POST(self):
                length = int(self.headers.get("Content-Length", "0"))
                body = json.loads(self.rfile.read(length) or b"{}")

                if self.path == "/api/skill/execute":
                    tool = body.get("tool")
                    args = body.get("args", {})
                    if fake.fail_next_write and tool == "gpio.write":
                        fake.fail_next_write = False
                        return self._send(400, {"ok": False, "message": "Gagal write GPIO"})
                    if tool == "gpio.write":
                        pin = int(args["pin"])
                        fake.outputs[pin] = bool(args["value"])
                        state = "HIGH (ON)" if fake.outputs[pin] else "LOW (OFF)"
                        return self._send(200, {"ok": True, "message": f"GPIO {pin} → {state}"})
                    if tool == "gpio.read":
                        pin = int(args["pin"])
                        state = "HIGH" if fake.outputs.get(pin, False) else "LOW"
                        return self._send(200, {"ok": True, "message": f"GPIO {pin} = {state}"})
                    if tool == "adc.read":
                        pin = int(args["pin"])
                        return self._send(200, {
                            "ok": True,
                            "message": f"ADC pin {pin}: raw=2840 voltage=2.290V",
                        })
                    return self._send(400, {"ok": False, "message": "Unknown tool"})

                if self.path == "/api/skill/chain":
                    results = []
                    for index, item in enumerate(body):
                        args = item.get("args", {})
                        pin = int(args["pin"])
                        fail = fake.partial_chain_failure and index == 1
                        if fail:
                            results.append({"tool": item["tool"], "success": False, "message": "Gagal write GPIO"})
                        else:
                            fake.outputs[pin] = bool(args["value"])
                            state = "HIGH (ON)" if fake.outputs[pin] else "LOW (OFF)"
                            results.append({
                                "tool": item["tool"],
                                "success": True,
                                "message": f"GPIO {pin} → {state}",
                            })
                    ok = all(r["success"] for r in results)
                    return self._send(200 if ok else 207, {
                        "ok": ok, "count": len(results), "results": results,
                    })

                self._send(404, {"ok": False, "error": "not found"})

        return Handler

    @property
    def base_url(self):
        return f"http://127.0.0.1:{self._server.server_address[1]}"

    def __enter__(self):
        self._server = ThreadingHTTPServer(("127.0.0.1", 0), self._handler())
        self._thread = threading.Thread(target=self._server.serve_forever, daemon=True)
        self._thread.start()
        return self

    def __exit__(self, *args):
        self._server.shutdown()
        self._server.server_close()
        self._thread.join(timeout=2)
