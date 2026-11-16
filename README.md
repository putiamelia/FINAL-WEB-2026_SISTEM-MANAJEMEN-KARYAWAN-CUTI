# e-Cuti Karyawan - Bank Nusantara (BNS)
**Tugas Final Praktikum Pemrograman Web 2026 — Individual Project 7: Sistem Manajemen Cuti Karyawan**

Sistem manajemen cuti modern dan terintegrasi untuk Insan Bank Nusantara. Dibangun menggunakan arsitektur **Next.js (App Router)** dan basis data relasional **PostgreSQL** dengan kueri **Raw SQL (pg)** tanpa ORM sesuai dengan standar teknis pengujian praktikum.

---
Fitur Utama Sistem

### 1. Multi-Role & Hak Akses Berjenjang (RBAC)
Sistem memiliki 4 peran pengguna dengan tampilan, kewenangan, dan menu navigasi yang disesuaikan:
- **Karyawan:** Mengajukan cuti, simulasi sisa kuota, pelacakan riwayat, unduh PDF surat cuti resmi, pembatalan pengajuan.
- **Ketua Divisi:** Verifikasi tahap 1 (persetujuan/penolakan dengan catatan wajib) untuk anggota divisi, pengajuan cuti pribadi langsung ke HRD.
- **HRD:** Persetujuan final berjenjang (single & batch approval), pemantauan kapasitas divisi (peringatan otomatis bila >30% pegawai cuti bersamaan), peringatan kuota hangus akhir tahun, pengawasan seluruh cuti bank.
- **Admin:** Manajemen pengguna & NIP, struktur divisi & penempatan anggota, konfigurasi dinamis jenis cuti & kuota default, kalender libur nasional & cuti bersama, pengaturan *blackout period*.

### 2. Validasi & Integritas Bisnis Perbankan
- **Cuti Tahunan:** Wajib diajukan minimal H-3 hari kerja sebelum tanggal mulai.
- **Cuti Sakit:** Dapat diajukan paling lambat H+3 setelah tanggal mulai sakit, wajib melampirkan surat keterangan dokter.
- **Cuti Setengah Hari (Half-Day):** Kuota terpotong tepat 0,5 hari dengan opsi sesi pagi/siang.
- **Perhitungan Hari Kerja Otomatis:** Hari Sabtu, Minggu, dan Hari Libur Nasional / Cuti Bersama tidak memotong kuota cuti.
- **Pencegahan Overlap:** Sistem menolak pengajuan jika tanggal bertabrakan dengan pengajuan aktif lainnya.
- **Blackout Period:** Pencegahan pengajuan cuti tahunan pada periode operasional krusial (misal: Tutup Buku Akhir Tahun).
- **Kapasitas Divisi:** Peringatan otomatis kepada HRD jika pengajuan baru menyebabkan lebih dari batas kapasitas (30%) divisi sedang cuti.
- **Atomic Transaction:** Pengurangan kuota, pembatalan (refund), dan persetujuan dilakukan dalam blok transaksi SQL (`BEGIN ... COMMIT / ROLLBACK`).
- **Ekspor Dokumen PDF:** Cetak Surat Izin Cuti Resmi berlogo Bank Nusantara dengan generator PDF bawaan (`jspdf`).

---
Arsitektur & Teknologi

- **Frontend & Backend:** Next.js 16 (App Router, Server Components & Route Handlers)
- **Styling & Design Tokens:** Tailwind CSS (Navy `#0B2545`, Slate `#13315C`, Gold `#C8A24A`, Cream `#FBFAF7`)
- **Database:** PostgreSQL (Raw SQL menggunakan library `pg`, tanpa ORM)
- **Otentikasi:** JWT (*HttpOnly Cookies*) & Bcrypt Password Hashing
- **Ikon:** Lucide React
- **Ekspor PDF:** jsPDF

---
Struktur Direktori

```text
├── app/
│   ├── admin/                # Halaman dashboard & konfigurasi Admin
│   ├── hrd/                  # Halaman dashboard & persetujuan final HRD
│   ├── ketua/                # Halaman verifikasi Ketua Divisi
│   ├── karyawan/             # Halaman pengajuan & riwayat Karyawan
│   ├── api/                  # API endpoints backend (REST Raw SQL)
│   ├── globals.css           # Styling global & tema perbankan
│   ├── layout.jsx            # Layout utama aplikasi
│   └── page.jsx              # Halaman login modern BNS
├── components/               # Komponen UI (Sidebar, Topbar, Badges, Modals)
├── lib/
│   ├── db.js                 # PostgreSQL Pool & Transaction Runner
│   ├── auth.js               # JWT signing, verification, and bcrypt hashing
│   └── utils.js              # Format tanggal Indonesia, hitung hari kerja, badges
├── public/assets/            # Aset grafis (Logo BNS, foto karyawan)
├── database.sql              # Skrip DDL & DML skema database PostgreSQL
├── schema.sql                # Salinan skrip DDL/DML untuk evaluasi praktikum
├── scripts/init-db.js        # Skrip otomatisasi inisialisasi basis data
└── package.json
```

---

Panduan Instalasi & Menjalankan

### Langkah 1: Siapkan Basis Data di pgAdmin 4 / PostgreSQL

1. Buka aplikasi **pgAdmin 4**.
2. Klik kanan pada **Databases** > **Create** > **Database...**.
3. Beri nama database: `db_cuti_karyawan` lalu klik **Save**.
4. Klik kanan pada `db_cuti_karyawan` > pilih **Query Tool**.
5. Buka berkas `database.sql` yang ada di root proyek ini, salin seluruh kodenya, tempel ke Query Tool, lalu klik tombol **Execute / Run (F5)**.
6. Seluruh tabel, relasi foreign key, indeks, dan data awal percontohan siap digunakan.

### Langkah 2: Konfigurasi Environment

Duplikasi berkas `.env.example` menjadi `.env.local`:
```bash
cp .env.example .env.local
```

Sesuaikan port dan kata sandi PostgreSQL komputer Anda pada `.env.local`:
```env
PGHOST=localhost
PGPORT=5432        # Sesuaikan dengan port PostgreSQL Anda (5432 atau 5433)
PGUSER=postgres
PGPASSWORD=rahasia  # Masukkan password user postgres Anda
PGDATABASE=db_cuti_karyawan
JWT_SECRET=bns_bank_nusantara_jwt_secret_key_2026
```

### Langkah 3: Menjalankan Server Aplikasi

Jalankan perintah berikut pada terminal:
```bash
# Instal dependensi (jika baru di-clone)
npm install

# Menjalankan mode development
npm run dev
```

Buka peramban (browser) di alamat: `http://localhost:3000`

---
Akun Demo Pengujian

Halaman login telah dilengkapi tombol **Akses Cepat Pengujian** untuk memudahkan evaluator menguji sistem tanpa mengetik kredensial manual:

| Peran | Username / Email | Kata Sandi | Nama Pegawai | Divisi |
|---|---|---|---|---|
| **Karyawan** | `karis.kabanga` | `password123` | Karis Katanga | Operasional & Layanan Nasabah |
| **Ketua Divisi** | `dylan.dwiputra` | `password123` | Dylan Dwiputra | Operasional & Layanan Nasabah |
| **HRD** | `puti.amelia` | `password123` | Puti Amelia | Human Resources |
| **Admin** | `admin` | `password123` | Administrator Sistem | Divisi Teknologi Informasi |

---

Catatan Tambahan Praktikum

- Berkas SQL utama disimpan di luar direktori `/app` (`database.sql` dan `schema.sql`) sesuai ketentuan penilaian praktikum.
- Format penulisan angka desimal cuti mengikuti standar perbankan Indonesia dengan koma (misal: `7,5 hari`, `0,5 hari`).
- Sistem teruji bebas *AI slop* serta mengutamakan aksesibilitas, kontras warna yang nyaman, dan keterbacaan tinggi.
