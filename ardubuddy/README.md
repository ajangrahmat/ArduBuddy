# ArduBuddy Device Setup

Folder ini berisi catatan konfigurasi perangkat. Firmware-nya ada di repo ini:
`firmware/ardubuddy/` (PlatformIO, Arduino framework).

Firmware yang dipakai: **ArduBuddy v1.0** untuk ESP32 Dev / WROOM dengan
**shield relay 4 channel**. Binary merged ada di `website/firmware/` dan bisa
di-flash langsung dari `website/flash.html` tanpa Arduino IDE.

## Sebelum dipakai

1. Flash firmware lewat `website/flash.html` (Web Serial, Chrome/Edge).
2. Tekan RESET, lalu isi WiFi ESP32 (2.4 GHz) dan catat alamat IP-nya.
3. Di langkah 3, tentukan nama + GPIO tiap relay, centang **active-low** bila
   shield-mu begitu, lalu klik **Simpan ke board**. Tombol ON/OFF di tiap baris
   dipakai untuk tes cepat.
4. Salin **prompt WorkBuddy** dari halaman yang sama, tempel ke WorkBuddy.
   WorkBuddy memanggil API HTTP board langsung — tidak perlu MCP atau connector.
5. Cocokkan pemetaan GPIO di `logic-config.example.txt` dengan wiring fisik.

## Kontrak yang dipakai

- `GET /api/status`
- `GET /api/config`
- `POST /api/skill/execute` → `{"tool":"gpio.write","args":{"pin":5,"value":true}}`
- `POST /api/skill/chain`
- `GET /api/skills`

`value` adalah **state logis**: `true` = relay ON, `false` = relay OFF. Firmware
yang mengubahnya ke HIGH/LOW sesuai `active_low`. Response menyertakan field
`on` (boolean) dan `level` (level pin fisik).

Rincian beserta daftar tool dan batasan firmware ada di
[docs/FIRMWARE-AND-FLASH.md](../docs/FIRMWARE-AND-FLASH.md).

## Verifikasi keselamatan

- Board ESP32 Dev/WROOM + shield relay 4 channel.
- Pin default: **5, 16, 17, 4**. Sesuaikan dengan shield-mu lewat halaman setup.
- GPIO 5 termasuk strapping pin, jadi relay di channel itu bisa berkedip sesaat
  saat board boot. Kalau mengganggu, pindahkan ke pin lain.
- Hindari GPIO 0, 2, 12, 15 dan ADC2 (25–27) saat WiFi aktif.
- Beban AC wajib memakai relay bersertifikat, enclosure, fuse, dan isolasi;
  pemasangan sisi AC oleh teknisi listrik kompeten.
- Firmware v1.0 tidak punya autentikasi HTTP → hanya untuk LAN tepercaya.

## Tidak ada LLM di proyek ini

Rantai yang dipakai: **WorkBuddy → HTTP → ESP32**. WorkBuddy yang berpikir dan
mengirim request HTTP; board hanya mengeksekusi perintah JSON. Tidak ada model,
API key, `llmKey`, atau agent runtime di board. API lokal menyala otomatis
setelah WiFi tersambung.
