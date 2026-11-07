# ArduBuddy firmware (ESP32)

Firmware minimal untuk **ArduBuddy**. Tidak ada LLM, agent runtime, dashboard,
atau MCP. Board hanya:

1. menyambung ke Wi-Fi (kredensial lewat USB serial),
2. menyimpan nama/pin relay + setting active-low di NVS (diatur dari web),
3. menerima perintah JSON dari WorkBuddy lewat HTTP,
4. menggerakkan hingga 4 channel relay (lampu/beban AC).

## Alur pakai

1. Flash firmware dari `website/flash.html`.
2. Hubungkan Wi-Fi di langkah 2.
3. Di langkah **Atur relay & prompt**, tentukan nama + GPIO tiap relay, klik
   **Simpan ke board** (lewat kabel USB).
4. Salin **prompt WorkBuddy** dari halaman yang sama.
5. Tempel prompt ke WorkBuddy Desktop. WorkBuddy memanggil API HTTP board
   langsung — tanpa MCP.

## Hardware

- ESP32 Dev / WROOM
- Shield relay 4 channel
- Pin default: `5`, `16`, `17`, `4` (relay 1–4). Bisa diubah dari web;
  nilai disimpan di NVS dan dipakai saat boot untuk memastikan semua relay OFF.
- **Active-low**: centang di web jika relay menyala saat GPIO `LOW`.
  Build flag `-DRELAY_ACTIVE_LOW=1` hanya menjadi default awal.

## Serial JSON (115200 baud)

```json
{"c":"ws","s":"SSID","p":"password"}
{"c":"wst"}
{"c":"start"}
{"c":"wr"}
{"c":"rst"}
{"c":"cfg","pins":[5,16,17,4],"active_low":false}
{"c":"cfg?"}
{"c":"gpio","pin":5,"value":true}
{"c":"gpio?","pin":5}
{"c":"adc?","pin":34}
```

## HTTP API

| Method | Path | Body / response |
|---|---|---|
| GET | `/api/status` | `{"ok":true,"connected":true,"ip":"...","pins":[...],"active_low":false}` |
| GET | `/api/config` | `{"ok":true,"pins":[...],"active_low":false}` |
| POST | `/api/skill/execute` | `{"tool":"gpio.write","args":{"pin":5,"value":true}}` → `{"ok":true,"message":"GPIO 5 set HIGH"}` |
| POST | `/api/skill/chain` | `[{"tool":"gpio.write","args":{...}}, ...]` → `{"ok":true,"results":[{"success":true,"message":"..."}]}` |
| GET | `/api/skills` | `{"ok":true,"skills":"gpio.write,gpio.read,adc.read"}` |

Tool: `gpio.write`, `gpio.read`, `adc.read` (ADC1, GPIO 32–39).

## Build

```bash
pio run -d firmware/ardubuddy
```

Merge ke satu image offset 0:

```bash
python -m esptool --chip esp32 merge-bin -o ardubuddy-esp32-v10.bin \
  --flash-mode dio --flash-freq 40m --flash-size 4MB \
  0x1000 .pio/build/esp32dev/bootloader.bin \
  0x8000 .pio/build/esp32dev/partitions.bin \
  0x10000 .pio/build/esp32dev/firmware.bin
```

## Keamanan

Tidak ada autentikasi HTTP. Gunakan hanya di LAN tepercaya. Sisi AC bertegangan
tinggi: matikan listrik saat wiring, gunakan relay bersertifikat di dalam
enclosure dengan fuse, dan minta teknisi listrik memeriksa sisi AC.
