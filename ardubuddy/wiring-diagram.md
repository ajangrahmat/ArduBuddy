# Wiring Diagram — ESP32 + Shield Relay 4 Channel

ArduBuddy memakai **ESP32 Dev / WROOM** dengan **shield relay 4 channel** untuk
mengendalikan hingga empat lampu atau beban AC. Sisi AC bertegangan tinggi:
bagian ini **bukan langkah plug-and-play** dan harus dikerjakan dengan listrik
dimatikan.

> **Peringatan:** jangan menghubungkan ESP32 langsung ke beban AC. Gunakan modul
> relay yang sesuai rating, enclosure, fuse, dan isolasi. Pemasangan sisi AC
> sebaiknya diperiksa oleh teknisi listrik kompeten.

## 1. Sisi tegangan rendah (ESP32 → relay)

Setiap channel relay punya pin input (`IN1`–`IN4`). Hubungkan:

| Channel | Nama logis | GPIO default | Relay |
|---|---|---|---|
| 1 | `meeting_light` | 4 | `IN1` |
| 2 | `projector_indicator` | 16 | `IN2` |
| 3 | `room_fan` | 17 | `IN3` |
| 4 | `desk_lamp` | 18 | `IN4` |

- `VCC` relay ke `5V` (atau `3.3V` sesuai shield) dan `GND` ke `GND` ESP32.
- **Cek datasheet shield**: banyak modul relay bersifat **active-low** (channel
  menyala saat input `LOW`). Uji dulu dengan multimeter/LED sebelum menyambung AC.
- Pin default hanya contoh. Sesuaikan dengan shield-mu lewat GUI installer
  (`ArduBuddy.exe`) atau `ARDUBUDDY_DEVICE_OVERRIDES`.
- Hindari GPIO strapping **0, 2, 5, 12, 15**. Saat WiFi aktif, hindari ADC2
  (25–27) untuk sensor analog.

## 2. Sisi AC (relay → lampu)

Untuk setiap lampu, dengan **listrik benar-benar dimatikan**:

```text
Mains L ── fuse ── relay COM
relay NO ───────── lampu (kabel fase)
lampu (kabel netral) ── Mains N
Earth ── bodi enclosure logam (jika ada)
```

- Gunakan kontak **COM + NO** (normally open) supaya lampu mati saat relay off.
- Satu channel untuk satu lampu. Jangan memparalel channel untuk beban besar.
- Pastikan total arus per channel **di bawah rating relay** (lihat datasheet;
  sering 10 A, tapi tetap turunkan margin untuk beban induktif).
- Tambahkan **fuse** sesuai arus lampu, dan **strain relief** untuk kabel.
- Jaga jarak fisik antara sisi AC dan sisi ESP32; gunakan enclosure terpisah
  atau sekat isolasi.

## 3. Prosedur uji yang aman

1. Uji logika relay **tanpa AC**: nyalakan/matikan channel, dengar klik relay,
   ukur kontinuitas COM–NO dengan multimeter.
2. Uji dengan beban tegangan rendah (lampu DC/buzzer) lebih dulu.
3. Baru sambungkan lampu AC, dengan enclosure tertutup dan tidak ada kabel terbuka.
4. Nyalakan listrik dari jarak aman; jangan menyentuh bagian AC saat hidup.
5. Jika ada bau gosong, bunyi mendesis, atau relay panas berlebihan: matikan
   listrik segera dan periksa ulang.

## 4. Batas

- Firmware v1.0 tidak punya autentikasi HTTP. Gunakan hanya di LAN tepercaya.
- Relay murah bisa gagal menempel (welded contact). Untuk beban penting, gunakan
  relay berkualitas dan pertimbangkan kontaktor tambahan.
- Jangan memakai proyek ini untuk instalasi listrik permanen tanpa pengawasan
  teknisi dan kepatuhan terhadap standar kelistrikan setempat.
