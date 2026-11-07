# Firmware & Flash dari Browser

## Sumber firmware

Firmware ArduBuddy adalah implementasi minimal di repo ini:
`firmware/ardubuddy/` (PlatformIO, Arduino framework, MIT).

Tidak ada runtime LLM, agent, atau dashboard. Board hanya:

1. menyambung ke Wi-Fi,
2. menerima perintah JSON dari konektor MCP lewat HTTP,
3. menggerakkan hingga 4 channel relay.

| Berkas | Nilai |
|---|---|
| Nama produk | ArduBuddy firmware v1.0 |
| Berkas | `ardubuddy-esp32-v10.bin` |
| Ukuran | 1.182.624 byte |
| SHA-256 | `b37772d3ce9c0643c15fb1886095c64c11d4cc47f4620f1c1b933ba0a1f9f76b` |
| Jenis | Merged image (bootloader + partitions + app) |
| Offset flash | `0x0` (magic ESP32 `0xE9` ada di `0x1000`) |
| Source | `firmware/ardubuddy/src/main.cpp` |
| Build | `pio run -d firmware/ardubuddy` |

Salinan binary ada di `website/firmware/`. Source-nya juga disalin ke
`website/firmware/source/` agar bisa dibaca langsung dari situs.

## Cara flash lewat website

1. Buka `https://avisha.id/ardubuddy/flash.html` dengan **Chrome / Edge**.
2. Colok ESP32 memakai kabel USB yang mendukung data; pastikan driver CP210x/CH340 terpasang.
3. Tutup Serial Monitor Arduino IDE / PlatformIO.
4. Biarkan "Firmware bundel — ArduBuddy v1.0" terpilih, klik **Hubungkan serial**, pilih port.
5. Klik **Flash firmware**. Jangan cabut kabel sampai selesai.
6. Tekan **RESET (EN)** pada board.

Opsi kedua: pilih **File .bin dari komputer saya** untuk meng-upload firmware
hasil build sendiri. Pastikan file itu *merged image* jika offset `0x0` dipakai;
untuk app-only gunakan offset `0x10000` beserta bootloader/partitions.

**Prasyarat teknis:** Web Serial hanya bekerja pada *secure context* — HTTPS atau
`localhost`. Halaman `http://` biasa akan diblokir browser. Tidak ada backend,
tidak ada unggahan ke server: file firmware dibaca dan dikirim dari browser ke
port serial secara lokal.

Untuk uji lokal:

```bash
python -m http.server 8080 --directory website
# buka http://localhost:8080/flash.html
```

## Koneksi WiFi setelah flash

ArduBuddy v1.0 **tidak memakai hotspot / captive portal**. Koneksi WiFi diatur lewat
**perintah JSON pada Serial 115200 baud** melalui kabel USB. Konfigurasi tersimpan
di NVS, jadi tidak perlu diulang setiap board menyala.

### Cara paling mudah (halaman website kita)

1. Setelah flash selesai, **tekan RESET (EN)**, tunggu 2 detik.
2. Buka langkah 2 di `flash.html#wifi`.
3. Isi **SSID** dan **Password**, klik **Connect my ESP32**. Satu tombol ini membuka
   Serial 115200, mengirim `ws`, lalu memantau `wst` sampai board mendapat IP.
4. Alamat `http://<IP>` muncul di langkah 3. Salin ke kolom alamat `ArduBuddy.exe`.

### Perintah Serial (bisa dipakai di serial monitor mana pun)

Kirim satu baris JSON diakhiri newline:

```text
{"c":"ws","s":"NamaWiFi","p":"password"}      simpan WiFi + langsung coba konek
{"c":"wst"}                                  status: ok, ssid, connected, ip
{"c":"start"}                                nyalakan API lokal sekarang (opsional)
{"c":"wr"}                                   hapus konfigurasi WiFi dari NVS
{"c":"rst"}                                  restart ESP32
{"c":"cfg","pins":[5,16,17,4],"active_low":false}   simpan pin relay + active-low
{"c":"cfg?"}                                 baca konfigurasi relay
{"c":"gpio","pin":5,"value":true}              tes relay ON
{"c":"gpio?","pin":5}                          baca state relay
{"c":"adc?","pin":34}                          baca ADC
```

Balasan yang ditunggu:

```json
{"ok":true,"ssid":"NamaWiFi","connected":true,"ip":"192.168.1.50"}
```

Setelah API aktif:

```json
{"ok":true,"msg":"started","ip":"192.168.1.50"}
```

**API lokal menyala otomatis** begitu WiFi tersambung. Perintah `start` tetap
diterima untuk kompatibilitas dan aman dikirim berulang kali.

### Tidak ada LLM di rantai ini

Rantai yang dipakai proyek ini: **WorkBuddy → MCP connector → ESP32**.
WorkBuddy yang memahami instruksi, connector mengirim satu perintah yang sudah
dicek allowlist-nya, ESP32 mengeksekusi. Firmware tidak punya model, API key,
`llmKey`, atau agent runtime sama sekali.

## Konfigurasi relay dari web

Di `website/flash.html` langkah 3, isi nama + GPIO tiap relay, centang
**active-low** jika perlu, lalu klik **Simpan ke board**. Halaman mengirim
`{"c":"cfg",...}` lewat USB serial; firmware menyimpannya di NVS dan
menginisialisasi ulang pin. Tombol ON/OFF di setiap baris mengirim
`{"c":"gpio",...}` untuk tes cepat. Prompt WorkBuddy di halaman yang sama
berisi alamat board + peta relay + contoh API, siap ditempel ke WorkBuddy.

## Kontrak HTTP

Sumber: `firmware/ardubuddy/src/main.cpp`.

| Method | Endpoint | Isi |
|---|---|---|
| GET | `/api/status` | `ok, connected, ssid, ip, uptime, heap, skill_count, firmware, version, pins, active_low` |
| GET | `/api/config` | `ok, pins, active_low` |
| GET | `/api/skills` | `ok, skills` (string dipisah koma) |
| POST | `/api/skill/execute` | `{"tool":"gpio.write","args":{"pin":4,"value":true}}` → `{"ok":true,"message":"GPIO 4 ON (pin HIGH)","pin":4,"on":true,"level":"HIGH","active_low":false}` |
| POST | `/api/skill/chain` | array skill → `{"ok":true,"results":[{"success":...,"message":...,"pin":4,"on":true}]}` |

**Semantik `value` (penting).** `value` adalah **state logis**, bukan level pin:

- `"value": true` → relay **ON**
- `"value": false` → relay **OFF**

Firmware yang mengubahnya ke HIGH/LOW sesuai `active_low`. Jadi `true` selalu berarti
nyala, baik board active-high maupun active-low. Jangan membalik nilai ini di sisi klien.

`gpio.read` dan `gpio.write` mengembalikan field `on` (boolean) dan `level` (level pin
fisik). Pakai `on` untuk menentukan status; `level` hanya untuk diagnosa kabel/relay.
`/api/skill/chain` mengembalikan `ok:false` jika ada satu langkah yang gagal.

Tool yang didukung: `gpio.write`, `gpio.read`, `adc.read` (ADC1, GPIO 32–39).

Contoh balasan `adc.read` yang di-parsing adapter:

```text
raw=2840 voltage=2.290V
```

Tidak ada skill sensor suhu/kelembapan. Tool `read_sensor` hanya menyediakan ADC
dan menolak `room_temperature` / `room_humidity` dengan pesan yang jelas, bukan
angka rekaan.

## Pemetaan perangkat

| Nama logis | GPIO | Catatan |
|---|---|---|
| `meeting_light` | 5 | Lampu ruang rapat (relay 1) |
| `projector_indicator` | 16 | Lampu proyektor (relay 2) |
| `room_fan` | 17 | Kipas ruangan (relay 3) |
| `desk_lamp` | 4 | Lampu meja (relay 4) |
| `room_light_adc` | 34 | ADC1, satuan Volt |

Pin default ada di `firmware/ardubuddy/src/main.cpp` (`DEFAULT_RELAY_PINS`) dan di
`mcp_server/device_map.py`. **Sesuaikan dengan shield-mu**; hindari GPIO strapping
**0, 2, 5, 12, 15** dan ADC2 (25–27) saat WiFi aktif. Nomor pin wajib dicek
terhadap wiring fisik sebelum demo.

Banyak modul relay murah bersifat **active-low**. Jika relay menyala saat GPIO
`LOW`, build dengan `-DRELAY_ACTIVE_LOW=1` (lihat `platformio.ini`).

## Build & merge image

```bash
pio run -d firmware/ardubuddy
python -m esptool --chip esp32 merge-bin -o ardubuddy-esp32-v10.bin \
  --flash-mode dio --flash-freq 40m --flash-size 4MB \
  0x1000 firmware/ardubuddy/.pio/build/esp32dev/bootloader.bin \
  0x8000 firmware/ardubuddy/.pio/build/esp32dev/partitions.bin \
  0x10000 firmware/ardubuddy/.pio/build/esp32dev/firmware.bin
```

## Batas

- Firmware v1.0 tidak punya autentikasi HTTP → hanya LAN tepercaya.
- Demo memakai shield relay 4 channel untuk beban AC; sisi AC wajib memakai enclosure, fuse, isolasi, dan pemasangan oleh teknisi kompeten.
- Flashing menimpa isi flash; kredensial WiFi tersimpan di NVS.
- Pin default harus cocok dengan shield dan wiring fisik.

## Troubleshooting WiFi

| Gejala | Tindakan |
|---|---|
| Tidak pernah `connected: true` | ESP32 hanya **2.4 GHz**, bukan 5 GHz; cek SSID/password; tekan RESET |
| Serial tidak merespons | Tekan RESET setelah flash, tunggu 5–10 detik, pastikan 115200 baud |
| Port sibuk | Klik **Putus** pada panel flasher, tutup Serial Monitor / PuTTY |
| IP muncul tapi `/api/status` gagal | Tunggu beberapa detik (API auto-start), atau kirim `{"c":"start"}` |
| Board baru reboot | API menyala otomatis setelah WiFi tersambung; tunggu alamatnya muncul lagi |
| IP berubah setelah pindah WiFi | Cek ulang `{"c":"wst"}` dan perbarui alamat di config connector |
| Router memblokir | Matikan client isolation / MAC filtering untuk ESP32 |
