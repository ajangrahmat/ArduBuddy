# Submission Draft — ArduBuddy

> Sesuaikan dengan form resmi dan hasil implementasi aktual. Jangan mengklaim fitur yang belum diuji.

## Project name
ArduBuddy

## Challenge
B — The Office Agent

## Short description
ArduBuddy menghubungkan Tencent Cloud WorkBuddy dengan perangkat IoT berbasis ESP32 melalui MCP Server dan firmware ArduBuddy. Pengguna dapat memberi instruksi bahasa alami untuk mengontrol perangkat kantor dan membaca data sensor dari satu antarmuka AI.

## Problem
Otomasi kantor sering terpisah antara workflow digital dan fasilitas fisik. Pengguna perlu membuka aplikasi berbeda atau mengoperasikan sakelar manual untuk mengelola perangkat seperti lampu dan sensor ruangan.

## Solution
WorkBuddy bertindak sebagai agen percakapan. MCP Server menyediakan tools terstruktur untuk status perangkat, kontrol output, pembacaan sensor, dan preset ruangan. Firmware ArduBuddy pada ESP32 mengeksekusi aksi perangkat sesuai perintah yang divalidasi.

## Why The Office Agent
**WorkBuddy saja** → laporan, slide, spreadsheet, data, dan file lokal; pekerjaan kantor digital beres, tapi ruangannya belum berubah.
**WorkBuddy + ArduBuddy** → semua itu **ditambah** perangkat fisik: lampu, indikator, sensor, dari satu kalimat yang sama tanpa aplikasi kedua.
Prototipe memakai shield relay 4 channel untuk mengendalikan lampu AC; sisi AC memakai enclosure, fuse, dan pemasangan oleh teknisi kompeten.

## Technology
- Tencent WorkBuddy **Desktop** (wajib; versi web tidak mendukung custom MCP connector)
- Model Context Protocol (MCP)
- Python / FastMCP / PyInstaller (distribusi single-file .exe)
- ArduBuddy v1.0 pada ESP32 (HTTP API + skill runtime)
- Tanpa LLM/API key pada board: WorkBuddy → MCP → ESP32, web server diaktifkan lewat `{"c":"start"}`
- Web Serial / esptool-js untuk flashing firmware dari browser
- Website statis (HTML/CSS/JS) untuk landing dan flasher

## Demo
1. User meminta WorkBuddy menyiapkan ruang rapat.
2. WorkBuddy memanggil MCP tool.
3. MCP Server meneruskan perintah melalui adapter firmware.
4. ESP32 mengubah output fisik.
5. WorkBuddy melaporkan hasil aktual.

## Links
- Website: https://avisha.id/ardubuddy/
- Repository: https://github.com/ajangrahmat/ArduBuddy
- Demo video: [isi setelah tersedia]
- Firmware ArduBuddy: firmware/ardubuddy
- ArduBuddy: https://avisha.id/ardubuddy/index.html

## Claims to verify
- WorkBuddy benar-benar memanggil MCP tool (sudah diuji via handshake stdio pada exe).
- Perangkat fisik benar-benar bereaksi (belum diuji dengan ESP32 nyata — wajib diverifikasi sebelum submit).
- Sensor yang diklaim adalah ADC, bukan suhu/kelembapan.
- Tidak menampilkan mock sebagai perangkat real; mock selalu bertanda `simulated: true`.
- Firmware v1.0 tanpa autentikasi disebutkan sebagai batasan.
- Link repo/video dapat diakses juri.
