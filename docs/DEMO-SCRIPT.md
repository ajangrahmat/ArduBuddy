# Demo Script — ArduBuddy

Durasi yang disarankan: 3–5 menit, sesuaikan dengan aturan submission resmi.

## Persiapan
- WorkBuddy Desktop terpasang dan sudah login (versi web tidak bisa); akun dibuat lewat link invite (+350 credits gratis), model gratis juga tersedia.
- Connector `ardubuddy` sudah di-Trust di halaman Connectors → Custom Connector.
- `ArduBuddy.exe` terpasang dan Mock mode NONAKTIF.
- ESP32 sudah di-flash lewat `website/flash.html` dan firmware ArduBuddy online.
- WiFi ESP32 (2.4 GHz) sudah dikonfigurasi dan `{"c":"start"}` sudah dikirim agar `/api/*` aktif (tanpa LLM key).
- Shield relay 4 channel terhubung dan diuji dengan lampu AC; sensor ADC diuji jika digunakan.
- Sisi AC sudah tertutup enclosure, ada fuse, dan tidak ada kabel terbuka.
- Rekam layar WorkBuddy dan perangkat fisik.
- Pastikan credential/API key tidak terlihat.

## Alur video

### 0:00–0:30 — Problem
“AI kantor sudah membantu pekerjaan digital. Namun perangkat fisik seperti lampu dan sensor ruangan masih sering dikontrol secara terpisah.”

### 0:30–1:00 — Solution
“ArduBuddy menghubungkan WorkBuddy dengan perangkat ESP32 melalui MCP. Pengguna memberi instruksi bahasa alami, WorkBuddy memanggil tool, dan ArduBuddy menjalankan aksi.”

### 1:00–2:15 — Hero demo
Ketik: “Siapkan ruang rapat.”

Tunjukkan pemanggilan MCP tool, request ke adapter, lampu AC berubah, dan WorkBuddy menyampaikan hasil aktual.

### 2:15–3:15 — Sensor demo (jika tersedia)
Ketik: “Baca sensor ruangan.” Tampilkan nilai ADC aktual beserta satuan Volt
dari `adc.read`. Jangan menyebutnya suhu, dan jangan menyajikan angka simulasi
sebagai data real. Jika sensor tidak terpasang, lewati bagian ini dan katakan
terus terang bahwa ArduBuddy v1.0 belum punya skill sensor suhu.

### 3:15–4:00 — Energy saving
Ketik: “Aktifkan mode hemat energi.” Tampilkan output yang dipetakan ke scene eco menjadi OFF.

### 4:00–4:30 — Closing
“ArduBuddy memperluas AI Office Agent dari workflow digital ke lingkungan fisik melalui WorkBuddy, MCP, dan ESP32.”

## Catatan
- Rekam satu take penuh sebagai bukti end-to-end.
- Tambahkan close-up hardware sebagai potongan pendukung bila perlu.
- Sebutkan dengan jujur bagian yang masih prototipe.
- Jangan mengklaim integrasi berhasil jika yang ditampilkan hanya mock mode.
