# ArduBuddy

Integrasi **Tencent Cloud WorkBuddy + HTTP API + ArduBuddy firmware (ESP32)** untuk mengubah instruksi bahasa alami menjadi aksi pada perangkat fisik kantor.

**Target:** Tencent Cloud AI CAN DO IT Hackathon Indonesia 2026  
**Challenge:** B — The Office Agent  
**Status:** MVP berjalan — firmware siap flash, setup relay + prompt di web, dan website landing

**Repo:** <https://github.com/ajangrahmat/ArduBuddy>  
**Website:** <https://avisha.id/ardubuddy/>

> **Firmware:** **ArduBuddy firmware v1.0** adalah implementasi minimal di repo ini (`firmware/ardubuddy/`, PlatformIO, MIT). Tidak ada runtime LLM/agent — board hanya menerima perintah JSON dari WorkBuddy lewat HTTP (tanpa MCP).

Tiga hal yang bisa langsung dibagikan ke orang lain:

| Hasil | Lokasi |
|---|---|
| `ArduBuddy.exe` — connector MCP opsional (tidak perlu untuk alur prompt HTTP) | `dist/`, salinan di `website/downloads/` |
| Flasher firmware ArduBuddy v1.0 via Web Serial | `website/flash.html` |
| Landing page untuk `avisha.id/ardubuddy` | `website/index.html` (English/ID, alur 3 langkah untuk pemula) |

> Kontrak perangkat **sudah diverifikasi** dari source firmware ArduBuddy v1.0, bukan placeholder.
> Lihat [docs/FIRMWARE-AND-FLASH.md](docs/FIRMWARE-AND-FLASH.md). Source firmware ada di
> `firmware/ardubuddy/`; binary di `website/firmware/`.

## Untuk pengguna akhir (tanpa Python)

Prasyarat: **WorkBuddy Desktop terpasang dan sudah login** (versi web **tidak bisa** menjalankan agen desktop). Daftar akun lewat <https://workbuddy.ai/invite?code=PHSPUBC8> untuk mendapat **+350 credits gratis**; WorkBuddy juga punya model gratis. Tidak perlu API key AI tambahan. Alur ringkas: **WorkBuddy → HTTP → ESP32**.

1. Buka `website/flash.html` lewat **HTTPS** di Chrome/Edge, colok ESP32, klik **Flash firmware**.
2. Tekan RESET, lalu di langkah **Connect to Wi-Fi** kirim SSID/password (2.4 GHz).
   API lokal menyala otomatis setelah WiFi tersambung — **tanpa LLM dan tanpa API key**.
3. Di langkah **Atur relay & prompt**, tentukan nama + GPIO tiap relay, klik **Simpan ke board**.
4. Salin **prompt WorkBuddy** dari halaman itu, tempel ke WorkBuddy Desktop.
   WorkBuddy memanggil API HTTP ESP32 langsung — **tanpa MCP, tanpa connector**.
5. Coba: `Nyalakan lampu meja.` / `Matikan semua lampu.` / `Baca sensor ruangan.`

Detail: [docs/FIRMWARE-AND-FLASH.md](docs/FIRMWARE-AND-FLASH.md) dan [docs/DEPLOY-WEBSITE.md](docs/DEPLOY-WEBSITE.md).

## Untuk pengembang

Python 3.11+ direkomendasikan.

```bash
python -m venv .venv
.venv\Scripts\python.exe -m pip install -r requirements-build.txt
.venv\Scripts\python.exe -m pytest -q          # 47 tes
.venv\Scripts\python.exe -m mcp_server          # MCP via stdio
.venv\Scripts\python.exe build_exe.py           # -> dist\ArduBuddy.exe
```

Mock mode aktif default (`MOCK_MODE=true`), jadi aman dicoba tanpa ESP32.
Untuk pengujian local website: `python -m http.server 8080 --directory website`.

Transport:
- WorkBuddy → connector: **stdio** (default, dipakai exe).
- Connector → ESP32: **HTTP** ke API ArduBuddy v1.0.
- Opsi `MCP_TRANSPORT=http` menjalankan MCP di `http://127.0.0.1:8000/mcp` untuk debugging.

Konfigurasi diambil dari environment variable, lalu `%APPDATA%\ArduBuddy\config.json`.
Contoh lengkap ada di `.env.example`.

## MCP tools

| Tool | Fungsi |
|---|---|
| `list_devices` | Daftar perangkat/sensor yang diizinkan + mode koneksi |
| `get_device_status` | Status perangkat (online, IP, WiFi, uptime) |
| `control_device` | Nyalakan/matikan output allowlisted, diverifikasi lewat `gpio.read` |
| `read_sensor` | Baca ADC (nilai Volt + raw) dari sensor yang benar-benar ada |
| `set_room_scene` | Preset `meeting` / `eco`, hasil dilaporkan per perangkat |

## Kontrak perangkat (ringkasan)

```
GET  /api/status                -> ok, connected, ip, ssid, ...
POST /api/skill/execute         -> {"tool":"gpio.write","args":{"pin":4,"value":true}}
POST /api/skill/chain           -> [{...}, ...] -> results per skill
GET  /api/skills                -> daftar skill terdaftar
```

State aktual diambil dari acknowledgement perangkat, lalu dikonfirmasi ulang via `gpio.read`.
Mock mode selalu menandai `simulated: true` dan **tidak** menyajikan angka sensor palsu.

## Struktur

```text
├── firmware/ardubuddy/  firmware ArduBuddy v1.0 (PlatformIO: Wi-Fi + HTTP API + 4 relay)
├── mcp_server/          server MCP opsional, adapter firmware, config, device map, scenes
├── connector/           entry point exe, installer GUI, merge mcp.json
├── website/             landing + flasher Web Serial + firmware + logo/ikon + unduhan exe
├── ardubuddy/           catatan wiring & pemetaan logis (bukan firmware)
├── docs/                PRD, arsitektur, install, flashing, deploy, submission
├── demo/                checklist & tautan video
├── tests/               47 tes (mock + server HTTP tiruan + installer + network guard)
├── ardubuddy_connector.spec
└── build_exe.py
```

Aset identitas ada di `website/assets/ardubuddy-*`: logo horizontal (terang/gelap), icon SVG,
dan turunan PNG 64/192/256/512. `website/favicon.svg` + `website/favicon.ico` dipakai browser
**dan** sebagai icon `ArduBuddy.exe` (lihat `ardubuddy_connector.spec`). Untuk membuat ulang PNG/ICO
dari SVG: render SVG lewat Chrome headless dengan background transparan, lalu resize/Pillow.

## Keselamatan

- Proyek ini memakai **shield relay 4 channel** untuk mengendalikan lampu/beban AC. Sisi AC bertegangan tinggi dan berbahaya.
- Jangan menghubungkan ESP32 langsung ke beban AC. Gunakan modul relay bersertifikat, enclosure, fuse, dan isolasi; pemasangan sisi AC oleh teknisi listrik kompeten.
- Matikan listrik sebelum memasang kabel. Jangan pernah menyentuh kabel yang masih dialiri listrik.
- Hindari GPIO strapping 0, 2, 12, 15 dan ADC2 (25–27) saat WiFi aktif. GPIO 5 juga strapping; default firmware memakainya untuk relay 1, jadi channel itu bisa berkedip sesaat saat board boot.
- **Firmware v1.0 tidak punya autentikasi HTTP** — pakai hanya di LAN tepercaya, jangan buka ke internet. Connector menolak alamat publik default (`ALLOW_PUBLIC_BASE_URL=true` untuk override sadar).
- Jangan menyatakan aksi berhasil tanpa acknowledgement dari perangkat.
- Installer GUI berbahasa Inggris, selaras dengan website; Mock mode diberi banner peringatan.

Dokumen: [PRD](docs/PRD.md) · [Arsitektur](docs/ARCHITECTURE.md) · [Install connector](docs/CONNECTOR-INSTALL.md) · [Firmware & flash](docs/FIRMWARE-AND-FLASH.md) · [Deploy web](docs/DEPLOY-WEBSITE.md) · [Skrip demo](docs/DEMO-SCRIPT.md)
