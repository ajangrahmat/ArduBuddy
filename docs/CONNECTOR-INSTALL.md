# Panduan Connector .exe

Satu file `ArduBuddy.exe` menjalankan dua peran:

| Cara menjalankan | Peran |
|---|---|
| Dobel klik (tanpa argumen) | Installer GUI: simpan konfigurasi + daftarkan connector ke WorkBuddy |
| `ArduBuddy.exe --serve` | MCP Server via **stdio** (dipanggil otomatis oleh WorkBuddy) |
| `ArduBuddy.exe --check` | Cetak diagnostik JSON |
| `ArduBuddy.exe --uninstall` | Hapus hanya key connector kita dari `mcp.json` |
| `ArduBuddy.exe --version` | Cetak versi |

## Build dari source

Disarankan memakai Python 3.11 dan virtual environment, agar Python global tidak berubah.

```bash
python -m venv .venv
.venv\Scripts\python.exe -m pip install -r requirements-build.txt
.venv\Scripts\python.exe build_exe.py
```

Hasil: `dist\ArduBuddy.exe`.
Untuk distribusi lewat website, salin ke `website\downloads\ArduBuddy.exe`.

Catatan: `requirements-build.txt` berisi `pyinstaller` dan `pytest` di samping dependensi runtime.
Jika PyInstaller lama gagal dengan `ModuleNotFoundError: pkg_resources`,
pastikan `setuptools` terpasang di venv.

## Pemasangan oleh pengguna akhir

**Prasyarat:** **WorkBuddy Desktop** terpasang dan sudah login. Versi web **tidak dapat** menjalankan custom MCP connector, jadi aplikasi desktop wajib. Daftar akun lewat <https://workbuddy.ai/invite?code=PHSPUBC8> (**+350 credits gratis**; tersedia juga model gratis), unduh installer dari <https://www.workbuddy.ai/> (Windows x64, Windows 10+), lalu login di klien dengan akun tersebut. Tidak diperlukan API key AI terpisah. Alur ringkas: **WorkBuddy Desktop → MCP → ESP32**.

1. Unduh `ArduBuddy.exe`, simpan di lokasi permanen (mis. `C:\Tools\ArduBuddy\`).
   **Jangan pindahkan setelah terdaftar** — path absolutnya disimpan di `mcp.json`.
2. Dobel klik → akan muncul jendela setup.
3. Isi **Alamat ESP32** (`http://<IP-ESP32>`), **Device ID**, dan nomor GPIO sesuai wiring.
4. Matikan **Mock mode** bila perangkat sudah nyala, lalu klik **Uji koneksi**.
   Sebelum itu pastikan ESP32 sudah dikonfigurasi WiFi-nya dan perintah `{"c":"start"}`
   sudah dikirim lewat `flash.html#wifi` — tanpa itu endpoint `/api/*` belum aktif.
   Tidak ada LLM/API key yang diperlukan di board.
5. Klik **Simpan & daftarkan**.
6. Tutup dan buka kembali WorkBuddy.
7. Buka halaman **Connectors → Custom Connector**, klik **Trust** pada
   `ardubuddy`. Connector tidak aktif otomatis tanpa langkah ini.

## Apa yang ditulis installer

**Config connector** — `%APPDATA%\ArduBuddy\config.json`
(dapat dipindah dengan env `ARDUBUDDY_CONFIG_DIR`):

```json
{
  "base_url": "http://192.168.1.50",
  "device_id": "office-main",
  "mock_mode": false,
  "transport": "stdio",
  "devices": {
    "meeting_light": { "pin": 4 },
    "projector_indicator": { "pin": 16 },
    "room_fan": { "pin": 17 },
    "desk_lamp": { "pin": 18 }
  },
  "sensors": {
    "room_light_adc": { "pin": 34, "kind": "adc", "unit": "V" }
  }
}
```

**MCP config** — `~\.workbuddy-ai\mcp.json`, di-merge (bukan ditimpa):

```json
{
  "mcpServers": {
    "ardubuddy": {
      "command": "C:\\Tools\\ArduBuddy\\ArduBuddy.exe",
      "args": ["--serve"]
    }
  }
}
```

Sebelum menulis, installer menyalin `mcp.json` lama menjadi
`mcp.json.<YYYYMMDD-HHMMSS>.bak` di folder yang sama. Connector lain dan key
lain di file tersebut tetap dipertahankan. Saat menjalankan dari source
(bukan exe), installer memakai `python -m mcp_server` dengan `PYTHONPATH`.

## Transport

Default `transport: stdio`, sesuai kebutuhan custom connector WorkBuddy.
Untuk pengujian lokal, `MCP_TRANSPORT=http` menjalankan server di
`http://127.0.0.1:8000/mcp` (FastMCP streamable HTTP).

Semua log ditulis ke `%APPDATA%\ArduBuddy\connector.log` dan stderr.
**Tidak ada yang ditulis ke stdout**, karena stdout adalah kanal JSON-RPC MCP.

## Troubleshooting

| Gejala | Penyebab / tindakan |
|---|---|
| Tool tidak muncul di WorkBuddy | Restart aplikasi, lalu klik **Trust** pada custom connector |
| `Device status unavailable` | ESP32 mati / salah IP / beda WiFi / firewall. Uji `http://<IP>/api/status` di browser |
| IP sudah benar tapi `/api/status` gagal | Tunggu beberapa detik (API auto-start setelah WiFi). Kalau masih gagal, kirim `{"c":"start"}` lewat Serial |
| ESP32 belum punya IP | Buka `flash.html#wifi`, kirim `{"c":"ws","s":"SSID","p":"password"}` lewat Serial 115200 (WiFi wajib 2.4 GHz) |
| Semua hasil `simulated: true` | Mock mode masih aktif di `config.json` |
| Sensor selalu gagal | ArduBuddy v1.0 hanya punya `adc.read`. Pakai `room_light_adc` (GPIO 32–39) |
| `Pin ... adalah strapping pin` | Ganti ke GPIO 4, 16, 17, 18, 19, 21, 22, 23, 25, 26, 27, 32, 33 |
| Connector hilang setelah exe dipindah | Jalankan ulang installer dari lokasi baru (path lama tetap dibersihkan oleh `--uninstall`) |
| Windows menolak menjalankan exe | File belum di-*code sign*: cek SHA-256 di halaman unduh website, lalu **More info → Run anyway** |
| `tidak ada dalam allowlist jaringan` / alamat publik ditolak | Connector hanya mengizinkan IP privat/loopback dan hostname LAN (`.local`, `.lan`). Override sadar: `ALLOW_PUBLIC_BASE_URL=true` |
| Semua tool membalas `Adapter tidak siap` | Cek pesan error di `connector.log`; biasanya alamat ESP32 ditolak network guard atau pin tidak valid |

## Batas keamanan

Firmware ArduBuddy v1.0 **tidak memiliki autentikasi** pada HTTP API.
`ARDUBUDDY_TOKEN` dapat diisi dan akan dikirim sebagai header `Authorization`,
tetapi firmware v1.0 mengabaikannya. Jangan anggap itu proteksi: pakai hanya di
LAN tepercaya dan jangan membuka port ESP32 ke internet.

Sebagai pengaman tambahan, connector sekarang **menolak alamat publik** secara default
(`mcp_server/network_guard.py`): hanya loopback, IP privat/link-local, dan hostname
LAN seperti `ardubuddy.local` yang diterima. Override hanya jika jalur jaringannya
benar-benar kamu kuasai: `ALLOW_PUBLIC_BASE_URL=true`. GUI installer berbahasa
Inggris (selaras dengan website) dan menampilkan banner kuning ketika Mock mode aktif.
