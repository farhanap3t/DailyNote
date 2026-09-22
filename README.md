# DailyNote 📝

> **"Satu tempat untuk menyimpan semua cerita, aktivitas, dan catatan harian."**

Aplikasi pencatatan dan jurnal harian pribadi berbasis **Web Application responsif** dengan arsitektur **API-first** yang dirancang untuk mendukung integrasi **Android Application** di tahap berikutnya serta sinkronisasi multi-device.

---

## 🚀 Fitur yang Telah Diimplementasikan (Sesuai PRD)

### 1. Autentikasi & Akun (PRD Section 8 & 25)
- **Registrasi**: Nama, Email, Password, Konfirmasi Password.
- **Login**: Email dan Password dengan JWT token & enkripsi bcrypt.
- **Lupa Password**: Alur reset password dengan email verifikasi.
- **Profil Pengguna**: Nama, Email, Foto Profil (upload avatar), status member since, dan ganti password.

### 2. Dashboard Interaktif (PRD Section 9)
- Header sapaan ramah (*Selamat Pagi/Siang/Malam*) dan tanggal lengkap hari ini.
- **Quick Add**: Tombol cepat *Catatan Baru*.
- **Widget Catatan Hari Ini**: Menampilkan catatan hari ini atau tombol *Mulai Menulis*.
- **Widget Statistik Ringkas**: Current Streak (Hari), Notes Bulan Ini, Words Written.
- **Daftar Catatan Terbaru**: Preview kartu catatan lengkap dengan mood badge dan tag.

### 3. Daily Note & Rich Text Editor (PRD Section 10 - 15, 21)
- Pemilihan tanggal catatan (default hari ini atau tanggal pilihan).
- Judul catatan & konten rich text editor:
  - **Formatting**: Bold, Italic, Underline, Heading 1, Heading 2.
  - **Lists**: Bullet List, Numbered List, Checklist tugas.
  - **Block**: Quote, Code block, Link URL, Image insertion.
- **Auto-Save Status Badge**:
  - `Saving...` ➔ `Saved ✓` ➔ `Offline — Changes saved locally` ➔ `Syncing...`
- **Mood Tracking**: 5 indikator mood (Great 😄, Good 🙂, Okay 😐, Bad 🙁, Terrible 😢).
- **Tag Management**: Tag interaktif (#work, #personal, #project, #idea, dsb.).
- **Interactive Checklist**: Tambah tugas, centang status, persentase progres selesai.
- **File Attachments**: Upload gambar, PDF, dokumen hingga 10MB dengan validasi tipe file dan tombol unduh/hapus.

### 4. Manajemen & Organisasi Catatan (PRD Section 18 - 20)
- **Semua Catatan**: Tampilan grid kartu catatan yang rapi.
- **Favorit**: Menandai dan melihat catatan favorit.
- **Arsip**: Mengarsipkan catatan tidak aktif dan fitur *Restore*.
- **Sampah (Trash)**: Soft delete catatan dengan opsi *Pulihkan* atau *Hapus Permanen*.

### 5. Kalender Catatan (PRD Section 16)
- Tampilan kalender bulanan dengan navigasi bulan.
- Indikator catatan dan badge mood pada setiap tanggal.
- Klik tanggal untuk membuka catatan hari tersebut atau membuat catatan baru.

### 6. Pencarian & Filter Multi-Kriteria (PRD Section 17)
- Pencarian kata kunci real-time pada Judul dan Isi.
- Filter berdasarkan Mood, Tag, dan Rentang Tanggal.

### 7. Statistik & Daily Streak (PRD Section 23 & 24)
- **Daily Streak**: Perhitungan streak konsistensi hari berturut-turut.
- Ringkasan bulanan: Total catatan, total kata, total checklist selesai.
- **Distribusi Mood**: Grafik persentase dan frekuensi mood.
- **Aktivitas Menulis**: Grafik histori produktivitas catatan 14 hari terakhir.

### 8. Pengaturan & Privasi (PRD Section 26 & 27)
- **Umum**: Pilihan Bahasa (ID / EN), Format Tanggal, dan Format Jam.
- **Tampilan**: Light Mode, Dark Mode, System Default (dengan transisi halus dan anti-FOUC).
- **Pengingat Harian**: Toggle reminder dan jam notifikasi dengan pengujian Web Notification API.
- **Ekspor Data**: Unduh seluruh catatan dalam format **JSON** atau **Markdown (.md)**.
- **Zona Bahaya**: Opsi hapus akun permanen.

### 9. Desain Responsif & Modern (PRD Section 28 & 38)
- **Desktop**: Full Sidebar navigasi + area konten luas.
- **Tablet**: Compact Sidebar navigasi.
- **Mobile Browser**: Top header + Bottom Navigation bar (`Home | Calendar | + | Search | Profile`).

### 10. API-First Backend & Swagger Docs (PRD Section 29 - 35)
- REST API modular di `server/`.
- Database SQLite relasional (`better-sqlite3`) dengan WAL mode dan Last-Write-Wins.
- **Dokumentasi API Interaktif**: Akses Swagger UI di `http://localhost:5000/api/docs`.

---

## 🛠️ Cara Menjalankan Aplikasi

### Persyaratan:
- Node.js (v18+)
- npm

### 1. Jalankan Sekaligus (Backend + Frontend)
Di folder utama `DailyNote`:
```bash
npm run dev
```
Atau:
```bash
node run-dev.js
```

Aplikasi akan berjalan di:
- **Frontend Web**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:5000](http://localhost:5000)
- **Dokumentasi API Swagger**: [http://localhost:5000/api/docs](http://localhost:5000/api/docs)

### 2. Menjalankan Server atau Client Terpisah
Jika ingin menjalankan secara terpisah di terminal yang berbeda:

**Terminal 1 (Backend Server):**
```bash
cd server
npm run dev
```

**Terminal 2 (Frontend Client):**
```bash
cd client
npm run dev
```

### 3. Menjalankan Tes Otomatis Backend:
```bash
cd server
npm test
```
Semua 13 suite pengujian endpoint (Auth, Notes CRUD, Favorites, Archive, Trash, Calendar, Search, Tags, Statistics & Streak, Settings, Export) akan dieksekusi dan divalidasi.

