# Deploy Website

Target: `https://avisha.id/ardubuddy/`.

Paket siap unggah: `dist/ardubuddy-website.zip` (berisi seluruh isi `website/` di root zip,
termasuk `downloads/ArduBuddy.exe`). Nama produk sudah **ArduBuddy**; path URL di atas
sengaja dipertahankan sesuai rencana hosting lama. Kalau ingin ikut diganti menjadi
`https://avisha.id/ardubuddy/`, ubah juga `WEBSITE_URL` di `connector/installer.py`.

Situs ini **statik murni** — HTML, CSS, JS, satu binary firmware. Tidak ada
backend, database, atau proses build. Semua tautan internal bersifat relatif,
jadi aman diletakkan di subpath. Seluruh antarmuka berbahasa **Inggris** dengan
alur 3 langkah untuk pengguna pemula; detail teknis disembunyikan di panel
Advanced (`assets/flasher.js`, `assets/wifi.js`). Font utama **Plus Jakarta Sans**
(muat dari Google Fonts), monospace JetBrains Mono untuk log. Ilustrasi di dalam
halaman berupa inline SVG, dan identitas merek tersimpan sebagai berkas vektor
`assets/ardubuddy-*.svg` plus turunan PNG/ICO — semuanya ikut terunggah bersama folder `website/`.

## Struktur yang diunggah

```text
website/
├── index.html
├── flash.html
├── favicon.svg
├── favicon.ico
├── assets/
│   ├── style.css
│   ├── flasher.js
│   ├── wifi.js
│   ├── esptool.min.js
│   ├── ardubuddy-icon.svg
│   ├── ardubuddy-logo.svg
│   ├── ardubuddy-logo-light.svg
│   ├── ardubuddy-icon-512.png
│   ├── ardubuddy-icon-256.png
│   ├── ardubuddy-icon-192.png
│   └── ardubuddy-icon-64.png
├── firmware/
│   ├── manifest.json
│   └── ardubuddy-esp32-v07.bin
└── downloads/
    └── ArduBuddy.exe        <- salin dari dist/ setelah build
```

Unggah **seluruh isi folder `website/`** ke direktori
`public_html/ardubuddy-office-agent/` (cPanel / FTP / Equivalent).

## Sebelum unggah

1. Build connector: `.venv\Scripts\python.exe build_exe.py`.
2. Salin `dist\ArduBuddy.exe` ke `website\downloads\ArduBuddy.exe`.
   Jika tidak ingin meng-host executable (mis. karena ukuran), ganti tautan
   `downloads/ArduBuddy.exe` di `index.html` dengan URL GitHub Release.
3. Pastikan `https://avisha.id/ardubuddy/` aktif dengan **HTTPS**.
   Web Serial tidak jalan di `http://` selain `localhost`.
4. Pastikan file `.bin` boleh diunduh (MIME `application/octet-stream`).
   Karena firmware di-host **same-origin**, tidak perlu konfigurasi CORS.
5. Cek `firmware/manifest.json` masih menunjuk ke nama file yang ada.

## Uji lokal

```bash
python -m http.server 8080 --directory website
```

- `http://localhost:8080/` → landing
- `http://localhost:8080/flash.html` → flasher (localhost termasuk secure context)

Uji nyata flashing tetap membutuhkan ESP32 terhubung lewat USB.
Tanpa perangkat, yang bisa diverifikasi lokal hanyalah pemuatan manifest,
pembacaan firmware, dan validasi magic byte `0xE9` di offset `0x1000`.

## Checklist akhir

- [ ] HTTPS aktif dan tidak ada mixed-content (font Google via HTTPS)
- [ ] `flash.html` bisa memuat `firmware/manifest.json` dan `.bin`
- [ ] `favicon.svg` / `favicon.ico` dan logo di header termuat (tidak ada 404 di console)
- [ ] Panel Setup WiFi (`assets/wifi.js`) termuat dan tidak error di console browser
- [ ] Tautan unduh `.exe` benar-benar mengembalikan file
- [ ] SHA-256 yang tercetak di section "Downloads and file check" sama dengan file `.exe` yang diunggah
- [ ] Tautan pendaftaran WorkBuddy `https://workbuddy.ai/invite?code=PHSPUBC8` masih benar
- [ ] Tidak ada kredensial/API key di HTML atau JS
- [ ] Teks "Status implementasi" sesuai kondisi aktual
- [ ] Link ke repo ArduBuddy dan dokumentasi masih benar
