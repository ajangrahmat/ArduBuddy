# Product Requirements Document (PRD)
# ArduBuddy

**Integrasi WorkBuddy + MCP + ArduBuddy firmware untuk otomasi lingkungan kantor**

| Informasi | Detail |
|---|---|
| Nama produk | ArduBuddy |
| Event | Tencent Cloud AI CAN DO IT Hackathon Indonesia 2026 |
| Target challenge | B — The Office Agent |
| Product owner | Ajang Rahmat / tim ArduMeka (dapat disesuaikan) |
| Versi | 1.3 |
| Status | MVP dengan connector terdistribusi, flasher web, dan kontrak perangkat terverifikasi |
| Tanggal dokumen | 7 November 2026 |

> **Catatan deadline:** materi yang dibagikan menyebut 7 November 2026 pukul 23:59 GMT+7 pada form, tetapi halaman event juga menampilkan tanggal lain. Konfirmasikan kepada panitia dan gunakan deadline paling awal untuk perencanaan.

## 1. Ringkasan Eksekutif

ArduBuddy adalah agen kantor yang memperluas kemampuan asisten AI dari pekerjaan digital menuju perangkat fisik. Pengguna dapat meminta WorkBuddy menyiapkan ruang rapat, memeriksa kondisi ruangan, atau mengaktifkan mode hemat energi melalui bahasa alami.

WorkBuddy berperan sebagai antarmuka percakapan dan pengambil keputusan tingkat tinggi. MCP Server menyediakan sekumpulan tool yang dapat dipanggil WorkBuddy. Firmware ArduBuddy pada ESP32 menjadi runtime perangkat untuk mengeksekusi perintah yang telah divalidasi.

**One-liner:** A smart office agent that connects workplace AI workflows to real-world devices through natural language.

**Elevator pitch:** AI Office Agent umumnya membantu pekerjaan digital seperti dokumen, jadwal, dan informasi. Namun fasilitas fisik kantor—lampu, sensor, kipas, dan perangkat ruang rapat—sering masih dikendalikan melalui sakelar atau aplikasi IoT terpisah. ArduBuddy menghubungkan WorkBuddy dengan perangkat ESP32 melalui MCP, sehingga pengguna dapat meminta tindakan pada fasilitas kantor dari satu antarmuka percakapan.

## 2. Latar Belakang dan Masalah

### 2.1 Kondisi saat ini
- Pengguna berpindah antara asisten AI dan aplikasi kontrol IoT.
- Perangkat fisik belum menjadi bagian dari alur kerja kantor berbasis AI.
- Pengelola fasilitas perlu memeriksa kondisi ruangan secara manual.
- Integrasi perangkat sering membutuhkan konfigurasi teknis dan aplikasi khusus.

### 2.2 Pernyataan masalah
Bagaimana membuat asisten kantor berbasis AI memahami permintaan pengguna dan menghubungkannya secara aman ke perangkat fisik di lingkungan kantor?

### 2.3 Peluang
MCP memungkinkan aplikasi AI menggunakan tool eksternal dengan antarmuka terstruktur. Firmware ArduBuddy menyediakan runtime pada ESP32. Integrasi keduanya berpotensi menjadi jembatan antara agen AI dan perangkat IoT.

## 3. Tujuan Produk

### 3.1 Goals

| ID | Tujuan | Kriteria keberhasilan MVP |
|---|---|---|
| G1 | WorkBuddy memicu aksi perangkat melalui MCP | Minimal satu tool berhasil dipanggil dari WorkBuddy |
| G2 | Firmware ArduBuddy mengeksekusi perintah pada ESP32 | Relay/lampu AC berubah sesuai instruksi |
| G3 | Pengguna membaca data sensor | MCP mengembalikan nilai yang dibaca perangkat |
| G4 | Menunjukkan use case Office Agent | Satu skenario ruang rapat berjalan end-to-end |
| G5 | Hasil dapat dipercaya | Respons sukses/gagal berdasarkan hasil perangkat |

### 3.2 Non-goals MVP
- Building Management System penuh.
- Kontrol banyak gedung atau ribuan perangkat.
- Integrasi semua kalender, email, HRIS, dan sistem kantor.
- Aplikasi mobile native.
- Menghubungkan ESP32 langsung ke beban AC tanpa relay, isolasi, atau enclosure.
- Dukungan semua board dan semua jenis sensor.
- Otomasi proaktif tanpa aturan dan persetujuan jelas.

## 4. Target Pengguna

| Persona | Kebutuhan | Contoh permintaan |
|---|---|---|
| Office Manager | Menyiapkan ruang rapat | “Siapkan ruang rapat untuk presentasi.” |
| Facility Staff | Memeriksa kondisi ruangan | “Berapa suhu ruang server sekarang?” |
| Karyawan | Mengontrol fasilitas sederhana | “Matikan lampu ruang rapat.” |
| IT/Facility Admin | Memeriksa status perangkat | “Apakah controller ruang rapat online?” |

Persona ini merupakan target desain, bukan hasil riset pengguna tervalidasi.

## 5. Solusi dan Ruang Lingkup MVP

### 5.1 Fitur wajib
1. **Device status:** memeriksa koneksi/status perangkat.
2. **Control device:** menyalakan atau mematikan output yang diizinkan.
3. **Read sensor:** membaca sensor ADC yang tersedia pada ArduBuddy v1.0 (bukan sensor suhu).
4. **Room scene:** menjalankan preset seperti `meeting` dan `eco`.
5. **Execution feedback:** menyampaikan hasil aktual dari perangkat.

### 5.2 Fitur lanjutan
- Multi-room dan multi-device.
- Penjadwalan otomatis.
- Notifikasi berdasarkan ambang sensor.
- Audit log per pengguna.
- Role-based access control.
- Dashboard monitoring.
- Integrasi kalender untuk menyiapkan ruangan berdasarkan jadwal rapat.

Fitur lanjutan bukan syarat MVP kecuali implementasi inti sudah stabil.

## 6. Arsitektur Konseptual

```text
Pengguna / Office Staff
       | Bahasa alami
       v
Tencent Cloud WorkBuddy
       | MCP tool call
       v
MCP Server
(validasi, allowlist, policy, logging)
       | HTTP / MQTT / serial / protokol terverifikasi
       v
Firmware ArduBuddy pada ESP32
       | GPIO / ADC / I2C
       v
Relay 4 channel / Sensor
```

**Pemisahan tanggung jawab:**
- WorkBuddy: memahami permintaan, memilih tool, menyusun respons.
- MCP Server: validasi, otorisasi, normalisasi, komunikasi, timeout, logging.
- Firmware: eksekusi pada perangkat dan pembacaan data.
- Hardware: aktuator dan sensor fisik.

MCP tidak menggantikan firmware ESP32. MCP adalah lapisan integrasi tool; kompilasi dan flashing firmware tetap merupakan alur pengembangan terpisah.

## 7. Alur Pengguna

### 7.1 Menyiapkan ruang rapat
1. Pengguna: “Siapkan ruang rapat.”
2. WorkBuddy memahami permintaan sebagai preset `meeting`.
3. WorkBuddy memanggil `set_room_scene`.
4. MCP Server memeriksa scene dan output yang diizinkan.
5. MCP Server mengirim instruksi melalui adapter firmware.
6. Firmware ArduBuddy mengeksekusi output.
7. MCP Server menerima hasil dan mengembalikan status.
8. WorkBuddy melaporkan hasil aktual.

### 7.2 Membaca kondisi ruangan
1. Pengguna: “Berapa suhu ruang server?”
2. WorkBuddy memanggil `read_sensor`.
3. MCP Server meminta data sensor.
4. Nilai aktual dikembalikan.
5. WorkBuddy menyajikan nilai dan satuan.

### 7.3 Mode hemat energi
1. Pengguna: “Aktifkan mode hemat energi.”
2. WorkBuddy memanggil `set_room_scene(scene="eco")`.
3. MCP Server menjalankan aksi yang terdaftar.
4. Sistem mengembalikan hasil per perangkat.

## 8. Functional Requirements

| ID | Requirement | Prioritas | Acceptance criteria |
|---|---|---|---|
| FR-01 | Tool status perangkat | P0 | Mengembalikan status terstruktur |
| FR-02 | Tool kontrol output | P0 | Output allowlisted berubah dan hasil dikonfirmasi |
| FR-03 | Tool baca sensor | P0 | Nilai dan satuan atau error jelas |
| FR-04 | Tool preset scene | P0 | Hasil tiap aksi dilaporkan |
| FR-05 | Validasi parameter | P0 | Pin/perangkat/sensor/scene di luar allowlist ditolak |
| FR-06 | Timeout komunikasi | P0 | Tool tidak menggantung tanpa batas |
| FR-07 | Logging | P1 | Permintaan dan hasil tercatat tanpa membocorkan rahasia |
| FR-08 | Mock mode | P1 | Alur dapat diuji tanpa ESP32 |
| FR-09 | Konfirmasi aksi berisiko | P1 | Aksi tertentu tidak dijalankan tanpa persetujuan |

## 9. Non-Functional Requirements

- **Reliability:** kegagalan jaringan menghasilkan status gagal/timeout, bukan sukses palsu.
- **Safety:** hanya pin dan aksi yang diizinkan dapat dikendalikan.
- **Security:** secret disimpan pada environment variable.
- **Latency:** ukur latency aktual; jangan mengklaim angka yang belum diuji.
- **Maintainability:** mapping pin, sensor, dan scene dipisahkan dari kode MCP.
- **Observability:** log mencatat tool, target, waktu, dan hasil.
- **Resilience:** MCP Server menangani perangkat yang sementara tidak tersedia.

## 10. Spesifikasi MCP Tools

### 10.1 `get_device_status`
Input:
```json
{"device_id": "office-main"}
```
Output konseptual:
```json
{"device_id":"office-main","reachable":true,"status":"online"}
```

### 10.2 `control_device`
Input:
```json
{"device_id":"office-main","device_name":"meeting_light","state":"on"}
```
Ketentuan:
- `device_name` harus terdaftar pada allowlist.
- `state` hanya `on` atau `off`.
- Jangan menerima nomor GPIO bebas dari model pada konfigurasi produksi.
- Kembalikan status aktual dari perangkat.

### 10.3 `read_sensor`
Input:
```json
{"device_id":"office-main","sensor_name":"room_light_adc"}
```
Output aktual:
```json
{"device_id":"office-main","sensor_name":"room_light_adc","value":2.29,"unit":"V","raw":2840,"success":true,"mode":"real","simulated":false}
```
ArduBuddy v1.0 hanya mendaftarkan skill `adc.read`. Permintaan `room_temperature`
atau `room_humidity` ditolak dengan pesan yang menjelaskan keterbatasan ini,
bukan dikembalikan sebagai angka rekaan. Mock mode juga mengembalikan
`success: false` untuk sensor.

### 10.4 `set_room_scene`
Input:
```json
{"device_id":"office-main","scene":"meeting"}
```
Scene awal:
- `meeting`: menyalakan output yang dipetakan untuk persiapan rapat.
- `eco`: mematikan output yang dipetakan untuk penghematan energi.

Tool harus mengembalikan hasil per perangkat. Jangan menyatakan seluruh scene sukses jika sebagian aksi gagal.

## 11. Kontrak Integrasi Perangkat (terverifikasi)

Kontrak berikut dibaca langsung dari source firmware **ArduBuddy v1.0**
(`src/main.cpp`, `src/skill.cpp`, `include/dashboard.h` di
<firmware/ardubuddy>). Transport yang dipilih adalah
**HTTP ke ESP32 di LAN**; bukan placeholder.

| Method | Endpoint | Kontrak |
|---|---|---|
| GET | `/api/status` | `ok, connected, ssid, ip, uptime, heap, min_heap, skill_count` |
| GET | `/api/skills` | `ok, skills` (string dipisah koma) |
| POST | `/api/skill/execute` | `{"tool":"gpio.write","args":{"pin":4,"value":true}}` → `{"ok":true,"message":"GPIO 4 → HIGH (ON)"}` |
| POST | `/api/skill/chain` | array skill → `{"ok":...,"count":...,"results":[{"tool":...,"success":...,"message":...}]}` |
| GET | `/api/persist` | konfigurasi NVS |

Konfirmasi state aktual: adapter mem-parse pesan acknowledgement, lalu memanggil
`gpio.read` untuk verifikasi. `adc.read` membalas
`ADC pin 34: raw=2840 voltage=2.290V` yang di-parsing menjadi nilai + satuan.

**Yang belum tersedia di firmware v1.0:** autentikasi pada HTTP API, skill sensor
suhu/kelembapan, dan acknowledgement `request_id` dari perangkat. `request_id`
pada respons adapter adalah identitas internal untuk logging, bukan klaim bahwa
firmware mengembalikannya. Header `Authorization` opsional dikirim tetapi
diabaikan firmware v1.0 — jangan dianggap sebagai proteksi.

Rincian: [FIRMWARE-AND-FLASH.md](FIRMWARE-AND-FLASH.md).

**Tanpa LLM pada perangkat.** Rantai utama MVP adalah WorkBuddy → HTTP → ESP32:
WorkBuddy melakukan penalaran dan mengirim request HTTP langsung ke API lokal
board. Firmware v1.0 menyalakan API lokal otomatis setelah Wi-Fi tersambung
(tidak ada `llmKey`, model, atau agent runtime di board). Prompt siap pakai
di-generate oleh `website/flash.html` (langkah 3) berisi alamat board, peta
relay, contoh API, dan aturan verifikasi. Connector MCP (`ArduBuddy.exe`)
tersedia sebagai jalur opsional, bukan syarat.

## 12. Data dan Konfigurasi

| Nama logis | Tipe | Fungsi | Detail fisik |
|---|---|---|---|
| `meeting_light` | output | Lampu ruang rapat (relay 1) | GPIO 5 |
| `projector_indicator` | output | Lampu proyektor (relay 2) | GPIO 16 |
| `room_fan` | output | Kipas ruangan (relay 3) | GPIO 17 |
| `desk_lamp` | output | Lampu meja (relay 4) | GPIO 4 |
| `room_light_adc` | sensor | Tegangan ADC (Volt) | GPIO 34 (ADC1) |

Peta di atas mengikuti default firmware v1.0 (5/16/17/4) dan dapat diubah dari
halaman setup (`website/flash.html` langkah 3) atau `config.json`. GPIO 5 adalah
strapping pin: relay di channel itu bisa berkedip sesaat saat board boot, dan
connector MCP menolaknya kecuali `ALLOW_STRAPPING_PINS=true`. Hindari GPIO 0, 2,
12, 15 dan ADC2 (25–27) saat WiFi aktif. **Nomor pin tetap wajib dicek terhadap
wiring fisik sebelum demo.**
`room_temperature` dan `room_humidity` sengaja tidak didaftarkan karena skill-nya
belum ada di firmware v1.0.

## 13. Keamanan dan Keselamatan

1. Pastikan sisi AC sudah tertutup enclosure dan listrik dimatikan saat wiring.
2. Jangan menghubungkan ESP32 langsung ke beban AC.
3. Gunakan relay yang sesuai, enclosure, isolasi, fuse, dan prosedur keselamatan.
4. Hindari GPIO strapping, pin input-only, atau pin yang dipakai periferal lain tanpa pemeriksaan board.
5. Terapkan allowlist perangkat dan aksi.
6. Terapkan autentikasi antara MCP Server dan perangkat jika transport mendukung.
7. Batasi akses jaringan; jangan membuka perangkat langsung ke internet.
8. Gunakan timeout dan pembatasan frekuensi.
9. Catat aksi dan hasil.
10. Aksi yang berdampak pada keselamatan/keamanan memerlukan persetujuan manusia.

## 14. Testing Plan

### Unit test
- Scene yang dikenal diterima.
- Scene tidak dikenal ditolak.
- State selain `on/off` ditolak.
- Nama perangkat di luar allowlist ditolak.
- Mock client mengembalikan hasil konsisten.

### Integration test
- MCP Server memanggil adapter.
- Adapter menjangkau perangkat.
- Perintah menghasilkan perubahan output.
- Sensor mengembalikan nilai dengan satuan.
- Perangkat offline menghasilkan error yang dapat dipahami.

### Demo acceptance test
- WorkBuddy memanggil tool yang benar.
- MCP Server menerima parameter yang benar.
- Perangkat fisik benar-benar bereaksi.
- WorkBuddy melaporkan hasil sesuai respons perangkat.
- Kegagalan jaringan tidak dilaporkan sebagai sukses.

## 15. Demo MVP

**Hero scenario:** “Siapkan ruang rapat.”

Perangkat demo yang disarankan:
- Shield relay 4 channel + lampu AC (sesuai rating relay).
- 1 sensor ADC (potensiometer atau sensor cahaya) jika tersedia.
- ESP32 yang menjalankan firmware ArduBuddy.
- WorkBuddy terhubung ke MCP Server.

Urutan:
1. Tampilkan kondisi awal.
2. Beri instruksi melalui WorkBuddy.
3. Tampilkan pemanggilan MCP tool.
4. Tampilkan lampu AC berubah.
5. Minta pembacaan sensor.
6. Tampilkan nilai aktual.
7. Minta mode hemat energi.
8. Tampilkan output mati dan hasil konfirmasi.

Jelaskan bahwa beban AC dilewatkan relay bersertifikat; jangan menyarankan wiring AC langsung ke ESP32.

## 16. Metrik Keberhasilan

| Metrik | Target MVP |
|---|---|
| Tool MCP | Minimal 3 tool inti |
| Kontrol | Minimal satu output fisik |
| Sensor | Satu sensor ADC (GPIO 34, Volt) jika hardware tersedia |
| Scene | Minimal satu scene end-to-end |
| Pelaporan | Status sesuai hasil perangkat |
| Dokumentasi | README, arsitektur, instruksi setup |
| Demo | Video alur ujung ke ujung |

Ini adalah sasaran internal MVP, bukan kriteria resmi hackathon kecuali dikonfirmasi panitia.

## 17. Risiko dan Mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Connector WorkBuddy tidak tersedia/berbeda | Integrasi tertunda | Verifikasi metode connector lebih awal |
| API firmware belum dipastikan | Adapter tidak dapat berkomunikasi | Sudah diverifikasi: HTTP `/api/skill/execute` dll. pada v1.0 |
| Firmware v1.0 tanpa autentikasi | Perangkat bisa dikontrol siapa pun di LAN | Batasi ke LAN tepercaya; jangan ekspos port ke internet |
| Perangkat offline | Demo gagal | Siapkan mock mode dan rekaman cadangan |
| Salah mapping GPIO | Perangkat tidak bekerja/rusak | Verifikasi wiring dan allowlist |
| Respons AI tidak akurat | Aksi salah | Schema ketat dan validasi server |
| Deadline berubah | Terlambat submit | Ikuti deadline paling awal dan konfirmasi |
| Internet tidak stabil | WorkBuddy gagal mengakses bridge | Siapkan jaringan cadangan |

## 18. Rencana Implementasi

**Status 6 November 2026:** Tahap 0–2 selesai di tingkat kode dan pengujian
(server HTTP tiruan + handshake stdio pada exe). Yang masih terbuka adalah
pengujian dengan ESP32 fisik, perekaman video, repo publik, dan pengisian form.

### Tahap 0 — Validasi prasyarat
- [ ] Pastikan akun dan akses WorkBuddy tersedia.
- [ ] Pastikan metode Custom Connector/MCP.
- [ ] Pastikan firmware menerima satu command.
- [ ] Pastikan ESP32 dan wiring bekerja.

### Tahap 1 — Vertical slice
- [ ] Buat satu MCP tool untuk satu output.
- [ ] Hubungkan tool ke adapter firmware.
- [ ] Panggil tool dari WorkBuddy.
- [ ] Buktikan output fisik berubah.
- [ ] Kembalikan hasil aktual.

### Tahap 2 — Sensor dan scene
- [ ] Tambahkan sensor jika perangkat siap.
- [ ] Tambahkan scene `meeting`.
- [ ] Tambahkan scene `eco`.
- [ ] Uji kondisi gagal.

### Tahap 3 — Submission
- [ ] Dokumentasikan arsitektur.
- [ ] Rekam demo.
- [ ] Siapkan repo/link publik.
- [ ] Isi form dan cek deadline resmi.

## 19. Deliverables
- Source code MCP Server.
- `ArduBuddy.exe` + installer GUI (build via `build_exe.py`).
- Konfigurasi/adapter perangkat firmware ArduBuddy berbasis kontrak terverifikasi.
- Website landing + flasher firmware Web Serial (siap upload ke `avisha.id/ardubuddy`).
- Firmware ArduBuddy v1.0 beserta manifest flash.
- README dan panduan setup.
- Diagram arsitektur.
- Video demonstrasi.
- Deskripsi proyek submission.
- Bukti integrasi WorkBuddy yang benar-benar berjalan.

## 20. Batasan dan Asumsi
- WorkBuddy **Desktop** wajib terpasang dan login; versi web tidak dapat menjalankan custom MCP connector. Connector didaftarkan via `mcp.json` (stdio) dan wajib di-Trust di UI.
- Pendaftaran akun melalui link invite `https://workbuddy.ai/invite?code=PHSPUBC8` memberi +350 credits gratis; WorkBuddy juga menyediakan model gratis. Alur ringkas: **WorkBuddy Desktop → MCP → ESP32**.
- ArduBuddy v1.0 menyediakan HTTP API `/api/status`, `/api/skill/execute`, `/api/skill/chain`; kontrak sudah diverifikasi dari source.
- Nama perangkat dan pin default terdokumentasi, tetapi wiring fisik tetap harus dicek sebelum demo.
- ArduBuddy v1.0 tidak memiliki autentikasi HTTP maupun skill sensor suhu/kelembapan.
- Angka performa harus diukur saat pengujian.
- Proyek ini prototipe hackathon, bukan sistem keselamatan gedung siap produksi.

## 21. Referensi
- ArduBuddy: https://avisha.id/ardubuddy/index.html
- Source firmware ArduBuddy: firmware/ardubuddy
- Website proyek: https://avisha.id/ardubuddy/
- Repository: https://github.com/ajangrahmat/ArduBuddy
- Tencent Cloud Hackathon: https://tch.tencentcloud.com/contest/47
- MCP Specification: https://modelcontextprotocol.io/
- FastMCP: https://github.com/jlowin/fastmcp
- ESP32 Documentation: https://docs.espressif.com/

## 22. Change Log
| Versi | Tanggal | Perubahan |
|---|---|---|
| 1.1 | 2026-11-06 | PRD dirapikan; asumsi API dan keselamatan diperjelas |
| 1.2 | 2026-11-06 | Kontrak ArduBuddy v1.0 diverifikasi; distribusi exe, web flasher, dan website ditambahkan; tool sensor disesuaikan ke ADC |
| 1.3 | 2026-11-07 | Nama produk menjadi ArduBuddy; prasyarat WorkBuddy Desktop (bukan web), +350 credits lewat link invite, dan alur ringkas WorkBuddy Desktop → MCP → ESP32 |
