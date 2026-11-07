# Demo Checklist

## WorkBuddy dan MCP
- [ ] WorkBuddy dapat mengakses MCP connector.
- [ ] `get_device_status` berhasil.
- [ ] `control_device` berhasil.
- [ ] `set_room_scene` berhasil.
- [ ] WorkBuddy melaporkan hasil aktual.

## Perangkat
- [ ] ESP32 menyala dan online.
- [ ] ArduBuddy siap menerima perintah.
- [ ] Wiring diperiksa.
- [ ] LED/aktuator diuji.
- [ ] Sensor diuji jika digunakan.

## Rekaman
- [ ] Tidak ada password/API key terlihat.
- [ ] Tampilkan instruksi pengguna.
- [ ] Tampilkan pemanggilan tool.
- [ ] Tampilkan reaksi perangkat.
- [ ] Tampilkan respons akhir.
- [ ] Jelaskan jika ada bagian yang masih mock/prototipe.

## Distribusi
- [ ] `dist/ArduBuddy.exe` berhasil di-build dan sudah disalin ke `website/downloads/`.
- [ ] `--version`, `--check`, dan handshake MCP stdio pada exe berhasil.
- [ ] Website `index.html` dan `flash.html` bisa dibuka lewat HTTPS.
- [ ] `firmware/manifest.json` dan `firmware/*.bin` ikut terunggah.
- [ ] Flasher berhasil memuat firmware dan validasi magic byte `0xE9`.

## Submission
- [ ] Repo dapat diakses juri.
- [ ] Video dapat diakses sesuai instruksi.
- [ ] Deskripsi sesuai fitur yang benar-benar berjalan.
- [ ] Form diperiksa ulang sebelum dikirim.
