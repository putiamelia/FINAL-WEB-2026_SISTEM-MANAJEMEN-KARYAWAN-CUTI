-- ============================================================================
-- TUGAS FINAL PRAKTIKUM PEMROGRAMAN WEB 2026
-- SISTEM MANAJEMEN CUTI KARYAWAN (BNS - BANK NUSANTARA)
-- Framework: Next.js + PostgreSQL (Raw SQL)
-- File: database.sql (Disimpan di luar folder /app)
-- ============================================================================

-- Bersihkan tabel jika sudah ada (urutkan sesuai dependensi)
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS leave_requests CASCADE;
DROP TABLE IF EXISTS leave_types CASCADE;
DROP TABLE IF EXISTS blackout_periods CASCADE;
DROP TABLE IF EXISTS holidays CASCADE;
DROP TABLE IF EXISTS system_settings CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS divisions CASCADE;

-- ----------------------------------------------------------------------------
-- 1. TABEL DIVISI
-- ----------------------------------------------------------------------------
CREATE TABLE divisions (
    id SERIAL PRIMARY KEY,
    nama_divisi VARCHAR(100) UNIQUE NOT NULL,
    deskripsi TEXT,
    ketua_id INT, -- relasi nanti ke users(id)
    tanggal_dibentuk DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 2. TABEL PENGGUNA (USERS)
-- ----------------------------------------------------------------------------
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nama_lengkap VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('Admin', 'Karyawan', 'Ketua Divisi', 'HRD')),
    jabatan VARCHAR(100) DEFAULT 'Staff',
    divisi_id INT REFERENCES divisions(id) ON DELETE SET NULL,
    kuota_tahunan_awal NUMERIC(4, 1) DEFAULT 12.0,
    sisa_kuota_tahunan NUMERIC(4, 1) DEFAULT 12.0,
    kuota_terpakai NUMERIC(4, 1) DEFAULT 0.0,
    nomor_telepon VARCHAR(25),
    alamat TEXT,
    status_aktif BOOLEAN DEFAULT TRUE,
    tanggal_bergabung DATE DEFAULT CURRENT_DATE,
    foto_profil TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tambahkan foreign key ketua_id ke tabel divisions
ALTER TABLE divisions
    ADD CONSTRAINT fk_divisions_ketua
    FOREIGN KEY (ketua_id) REFERENCES users(id) ON DELETE SET NULL;

-- ----------------------------------------------------------------------------
-- 3. TABEL JENIS CUTI (DINAMIS - DIKELOLA ADMIN)
-- ----------------------------------------------------------------------------
CREATE TABLE leave_types (
    id SERIAL PRIMARY KEY,
    nama_cuti VARCHAR(100) UNIQUE NOT NULL,
    deskripsi TEXT,
    kuota_default NUMERIC(4, 1) DEFAULT 0.0,
    minimal_h_pengajuan INT DEFAULT 0,
    maksimal_h_setelah_sakit INT DEFAULT 3,
    wajib_lampiran BOOLEAN DEFAULT FALSE,
    potong_kuota_utama BOOLEAN DEFAULT FALSE,
    status_aktif BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 4. TABEL PENGAJUAN CUTI (LEAVE REQUESTS)
-- ----------------------------------------------------------------------------
CREATE TABLE leave_requests (
    id SERIAL PRIMARY KEY,
    nomor_pengajuan VARCHAR(50) UNIQUE NOT NULL,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    leave_type_id INT NOT NULL REFERENCES leave_types(id) ON DELETE RESTRICT,
    is_half_day BOOLEAN DEFAULT FALSE,
    tanggal_pengajuan DATE DEFAULT CURRENT_DATE,
    tanggal_mulai DATE NOT NULL,
    tanggal_selesai DATE NOT NULL,
    total_hari NUMERIC(4, 1) NOT NULL,
    alasan TEXT NOT NULL,
    handover_user_id INT REFERENCES users(id) ON DELETE SET NULL,
    catatan_handover TEXT,
    alamat_selama_cuti TEXT,
    nomor_darurat VARCHAR(25),
    lampiran_url TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'Pending' 
        CHECK (status IN ('Pending', 'Approved by Leader', 'Approved', 'Rejected', 'Cancelled')),
    alasan_pembatalan TEXT,
    leader_approver_id INT REFERENCES users(id) ON DELETE SET NULL,
    leader_approval_date TIMESTAMP,
    leader_notes TEXT,
    hrd_approver_id INT REFERENCES users(id) ON DELETE SET NULL,
    hrd_approval_date TIMESTAMP,
    hrd_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 5. TABEL HARI LIBUR & CUTI BERSAMA (ADVANCED REQUIREMENT)
-- ----------------------------------------------------------------------------
CREATE TABLE holidays (
    id SERIAL PRIMARY KEY,
    tanggal DATE UNIQUE NOT NULL,
    keterangan VARCHAR(150) NOT NULL,
    tipe VARCHAR(50) DEFAULT 'Hari Libur Nasional' 
        CHECK (tipe IN ('Hari Libur Nasional', 'Cuti Bersama')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 6. TABEL BLACKOUT PERIOD / TUTUP BUKU (ADVANCED REQUIREMENT)
-- ----------------------------------------------------------------------------
CREATE TABLE blackout_periods (
    id SERIAL PRIMARY KEY,
    nama_periode VARCHAR(150) NOT NULL,
    tanggal_mulai DATE NOT NULL,
    tanggal_selesai DATE NOT NULL,
    divisi_id INT REFERENCES divisions(id) ON DELETE CASCADE, -- NULL berarti berlaku untuk semua divisi
    keterangan TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 7. TABEL PENGATURAN SISTEM
-- ----------------------------------------------------------------------------
CREATE TABLE system_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(50) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    deskripsi VARCHAR(255)
);

-- ----------------------------------------------------------------------------
-- 8. TABEL NOTIFIKASI IN-APP
-- ----------------------------------------------------------------------------
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    judul VARCHAR(150) NOT NULL,
    pesan TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    tipe VARCHAR(50) DEFAULT 'info',
    tautan TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- SEED DATA AWAL (SESUAI DESIGN.MD DAN STANDAR BANK NUSANTARA)
-- Password default semua akun adalah: "password123"
-- Hash bcrypt untuk "password123": $2b$10$yiOC0WdcU/fi8s5U8tqJ7uaV57bTdaJtZt8LNZfo/xAm2f8i4QXfe
-- ============================================================================

-- Data Pengaturan Sistem
INSERT INTO system_settings (setting_key, setting_value, deskripsi) VALUES
('max_team_leave_percentage', '30', 'Batas maksimal persentase karyawan cuti bersamaan dalam 1 divisi (%)'),
('company_name', 'Bank Nusantara', 'Nama Perusahaan'),
('brand_title', 'e-Cuti Karyawan', 'Nama Aplikasi');

-- Data Hari Libur Nasional & Cuti Bersama 2026
INSERT INTO holidays (tanggal, keterangan, tipe) VALUES
('2026-01-01', 'Tahun Baru 2026 Masehi', 'Hari Libur Nasional'),
('2026-03-20', 'Hari Raya Idul Fitri 1447 H', 'Hari Libur Nasional'),
('2026-03-21', 'Hari Raya Idul Fitri 1447 H', 'Hari Libur Nasional'),
('2026-03-23', 'Cuti Bersama Idul Fitri', 'Cuti Bersama'),
('2026-05-01', 'Hari Buruh Internasional', 'Hari Libur Nasional'),
('2026-08-17', 'Hari Kemerdekaan RI', 'Hari Libur Nasional'),
('2026-12-25', 'Hari Raya Natal', 'Hari Libur Nasional');

-- Data Blackout Period (Misal: Tutup Buku Akhir Tahun)
INSERT INTO blackout_periods (nama_periode, tanggal_mulai, tanggal_selesai, keterangan) VALUES
('Tutup Buku Tahunan 2026', '2026-12-28', '2026-12-31', 'Periode audit keuangan dan pembukuan tahunan');

-- Data Jenis Cuti
INSERT INTO leave_types (nama_cuti, deskripsi, kuota_default, minimal_h_pengajuan, maksimal_h_setelah_sakit, wajib_lampiran, potong_kuota_utama, status_aktif) VALUES
('Cuti Tahunan', 'Cuti tahunan reguler bagi karyawan dengan masa kerja minimal 1 tahun', 12.0, 3, 0, FALSE, TRUE, TRUE),
('Cuti Sakit', 'Cuti karena gangguan kesehatan dengan kewajiban melampirkan surat dokter', 0.0, 0, 3, TRUE, FALSE, TRUE),
('Cuti Menikah', 'Cuti khusus untuk melangsungkan pernikahan karyawan sendiri', 3.0, 7, 0, FALSE, FALSE, TRUE),
('Cuti Melahirkan', 'Cuti bagi karyawati menjelang dan setelah persalinan', 90.0, 30, 0, TRUE, FALSE, TRUE),
('Cuti Duka Cita', 'Cuti untuk anggota keluarga inti yang meninggal dunia', 3.0, 0, 2, FALSE, FALSE, TRUE),
('Cuti Tanpa Gaji', 'Cuti di luar tanggungan atas persetujuan khusus manajemen', 0.0, 14, 0, FALSE, FALSE, TRUE);

-- Data Divisi
INSERT INTO divisions (id, nama_divisi, deskripsi, tanggal_dibentuk) VALUES
(1, 'Layanan Nasabah', 'Unit operasional pelayanan nasabah cabang dan kantor pusat', '2020-01-15'),
(2, 'Kredit dan Pembiayaan', 'Analisis, verifikasi, dan penyaluran kredit produktif serta konsumtif', '2020-01-15'),
(3, 'Operasional', 'Pemrosesan kliring, transaksi harian, dan tata kelola kantor cabang', '2020-01-15'),
(4, 'Teknologi Informasi', 'Pengembangan perangkat lunak, infrastruktur server, dan keamanan data', '2020-01-15'),
(5, 'Kepatuhan dan Risiko', 'Manajemen risiko kepatuhan perbankan dan audit regulasi OJK', '2020-01-15'),
(6, 'Keuangan', 'Pencatatan akuntansi, manajemen kas, dan pelaporan keuangan berkala', '2020-01-15'),
(7, 'Pemasaran', 'Branding, akuisisi nasabah prioritas, dan kampanye produk perbankan', '2020-01-15'),
(8, 'Human Resources', 'Pengelolaan kepegawaian, pengembangan talenta, dan kesejahteraan karyawan', '2020-01-15');
ALTER SEQUENCE divisions_id_seq RESTART WITH 9;

-- Data Pengguna Utama (Admin, HRD, Ketua Divisi, Karyawan)
-- Hash: $2b$10$yiOC0WdcU/fi8s5U8tqJ7uaV57bTdaJtZt8LNZfo/xAm2f8i4QXfe (password123)
INSERT INTO users (id, username, email, password_hash, nama_lengkap, role, jabatan, divisi_id, kuota_tahunan_awal, sisa_kuota_tahunan, kuota_terpakai, nomor_telepon, alamat, status_aktif, tanggal_bergabung, foto_profil) VALUES
(1, 'admin', 'admin@banknusantara.co.id', '$2b$10$yiOC0WdcU/fi8s5U8tqJ7uaV57bTdaJtZt8LNZfo/xAm2f8i4QXfe', 'Ahmad Mingyu', 'Admin', 'Sistem Administrator', 4, 12.0, 12.0, 0.0, '08123456001', 'Jl. Sudirman Kav. 21, Jakarta Pusat', TRUE, '2022-01-10', '/assets/foto-karyawan.png'),
(2, 'puti.amelia', 'hrd@banknusantara.co.id', '$2b$10$yiOC0WdcU/fi8s5U8tqJ7uaV57bTdaJtZt8LNZfo/xAm2f8i4QXfe', 'Puti Amelia', 'HRD', 'Human Resource Manager', 8, 12.0, 9.0, 3.0, '08123456002', 'Jl. Rasuna Said Blok B4, Jakarta Selatan', TRUE, '2021-03-01', '/assets/foto-karyawati.png'),
(3, 'dylan.dwiputra', 'dylan.dwiputra@banknusantara.co.id', '$2b$10$yiOC0WdcU/fi8s5U8tqJ7uaV57bTdaJtZt8LNZfo/xAm2f8i4QXfe', 'Dylan Dwiputra', 'Ketua Divisi', 'Head of Customer Service', 1, 12.0, 10.0, 2.0, '08123456003', 'Jl. Gatot Subroto No. 45, Jakarta Selatan', TRUE, '2020-05-15', '/assets/foto-karyawan.png'),
(4, 'karis.kabanga', 'karis.kabanga@banknusantara.co.id', '$2b$10$yiOC0WdcU/fi8s5U8tqJ7uaV57bTdaJtZt8LNZfo/xAm2f8i4QXfe', 'Karis Kabanga', 'Karyawan', 'Customer Service Officer', 1, 12.0, 7.5, 4.5, '08123456004', 'Jl. Tebet Timur Dalam No. 12, Jakarta Selatan', TRUE, '2023-02-15', '/assets/foto-karyawati.png'),
(5, 'andi.martin', 'andi.martin@banknusantara.co.id', '$2b$10$yiOC0WdcU/fi8s5U8tqJ7uaV57bTdaJtZt8LNZfo/xAm2f8i4QXfe', 'Andi Martin', 'Karyawan', 'Senior Customer Service', 1, 12.0, 8.0, 4.0, '08123456005', 'Jl. Duren Tiga No. 8, Jakarta Selatan', TRUE, '2022-08-01', '/assets/foto-karyawan.png'),
(6, 'nur.aisyah', 'nur.aisyah@banknusantara.co.id', '$2b$10$yiOC0WdcU/fi8s5U8tqJ7uaV57bTdaJtZt8LNZfo/xAm2f8i4QXfe', 'Nur Aisyah', 'Karyawan', 'Customer Care Representative', 1, 12.0, 11.0, 1.0, '08123456006', 'Jl. Bangka Raya No. 19, Jakarta Selatan', TRUE, '2024-01-10', '/assets/foto-karyawati.png'),
(7, 'alisya.nadhifa', 'alisya.nadhifa@banknusantara.co.id', '$2b$10$yiOC0WdcU/fi8s5U8tqJ7uaV57bTdaJtZt8LNZfo/xAm2f8i4QXfe', 'Alisya Nadhifa', 'Karyawan', 'Front Office Staff', 1, 12.0, 6.0, 6.0, '08123456007', 'Jl. Fatmawati No. 30, Jakarta Selatan', TRUE, '2023-06-20', '/assets/foto-karyawati.png'),
(8, 'joshua.kurniawan', 'joshua.kuniawan@banknusantara.co.id', '$2b$10$yiOC0WdcU/fi8s5U8tqJ7uaV57bTdaJtZt8LNZfo/xAm2f8i4QXfe', 'Joshua Kurniawan', 'Karyawan', 'Teller Service Officer', 1, 12.0, 12.0, 0.0, '08123456008', 'Jl. Kalibata No. 5, Jakarta Selatan', TRUE, '2024-03-01', '/assets/foto-karyawan.png'),
(9, 'magnolia.seamel', 'magnolia.seamel@banknusantara.co.id', '$2b$10$yiOC0WdcU/fi8s5U8tqJ7uaV57bTdaJtZt8LNZfo/xAm2f8i4QXfe', 'Magnolia Seamel', 'Karyawan', 'Customer Relations Staff', 1, 12.0, 9.5, 2.5, '08123456009', 'Jl. Kemang Timur No. 14, Jakarta Selatan', TRUE, '2023-09-15', '/assets/foto-karyawati.png'),
(10, 'anita.sari', 'anita.sari@banknusantara.co.id', '$2b$10$yiOC0WdcU/fi8s5U8tqJ7uaV57bTdaJtZt8LNZfo/xAm2f8i4QXfe', 'Anita Sari', 'Ketua Divisi', 'Head of Credit Division', 2, 12.0, 8.0, 4.0, '08123456010', 'Jl. Bintaro Utama No. 88, Tangerang Selatan', TRUE, '2021-06-01', '/assets/foto-karyawati.png'),
(11, 'muhammad.kaizo', 'muhammad.kaizo@banknusantara.co.id', '$2b$10$yiOC0WdcU/fi8s5U8tqJ7uaV57bTdaJtZt8LNZfo/xAm2f8i4QXfe', 'Muhammad Kaizo', 'Karyawan', 'Operations Specialist', 3, 12.0, 5.0, 7.0, '08123456011', 'Jl. Pramuka Raya No. 16, Jakarta Timur', TRUE, '2022-11-10', '/assets/foto-karyawan.png'),
(12, 'laras.ayu', 'laras.ayu@banknusantara.co.id', '$2b$10$yiOC0WdcU/fi8s5U8tqJ7uaV57bTdaJtZt8LNZfo/xAm2f8i4QXfe', 'Laras Ayu', 'Karyawan', 'Risk Analyst', 5, 12.0, 10.0, 2.0, '08123456012', 'Jl. Cilandak Barat No. 22, Jakarta Selatan', TRUE, '2023-04-12', '/assets/foto-karyawati.png'),
(13, 'dimas.anggoro', 'dimas.anggoro@banknusantara.co.id', '$2b$10$yiOC0WdcU/fi8s5U8tqJ7uaV57bTdaJtZt8LNZfo/xAm2f8i4QXfe', 'Dimas Anggoro', 'Karyawan', 'Junior IT Engineer', 4, 12.0, 12.0, 0.0, '08123456013', 'Jl. Margonda No. 100, Depok', TRUE, '2026-06-01', '/assets/foto-karyawan.png');
ALTER SEQUENCE users_id_seq RESTART WITH 14;

-- Kaitkan ketua divisi di tabel divisions
UPDATE divisions SET ketua_id = 3 WHERE id = 1; 
UPDATE divisions SET ketua_id = 10 WHERE id = 2; 

-- Data Pengajuan Cuti Riwayat & Aktif
INSERT INTO leave_requests (
    id, nomor_pengajuan, user_id, leave_type_id, is_half_day, 
    tanggal_pengajuan, tanggal_mulai, tanggal_selesai, total_hari, 
    alasan, handover_user_id, catatan_handover, alamat_selama_cuti, 
    nomor_darurat, status, leader_approver_id, leader_approval_date, 
    leader_notes, hrd_approver_id, hrd_approval_date, hrd_notes
) VALUES
-- 1. Pengajuan Andi Martin (Pending Ketua Divisi)
(1, 'CUTI-202611-001', 5, 1, FALSE, '2026-11-15', '2026-12-28', '2026-12-30', 3.0, 
 'Liburan akhir tahun bersama keluarga besar', 4, 'Tiket komplain prioritas dialihkan ke Karis Kabanga', 
 'Jl. Malioboro No. 45, Yogyakarta', '081299887766', 'Pending', NULL, NULL, NULL, NULL, NULL, NULL),

-- 2. Pengajuan Nur Aisyah (Pending Ketua Divisi)
(2, 'CUTI-202611-002', 6, 1, FALSE, '2026-11-14', '2026-12-01', '2026-12-02', 2.0, 
 'Menghadiri wisuda adik kandung di Bandung', 8, 'Handover antrean kasir loket 2 ke Joshua Kurniawan', 
 'Jl. Dago Asri No. 11, Bandung', '081288776655', 'Pending', NULL, NULL, NULL, NULL, NULL, NULL),

-- 3. Pengajuan Alisya Nadhifa (Pending Ketua Divisi)
(3, 'CUTI-202611-003', 7, 1, TRUE, '2026-11-16', '2026-11-20', '2026-11-20', 0.5, 
 'Keperluan administrasi kependudukan di kelurahan setengah hari siang', 9, 'Back up meja counter oleh Magnolia Seamel', 
 'Jakarta Selatan', '081277665544', 'Pending', NULL, NULL, NULL, NULL, NULL, NULL),

-- 4. Pengajuan Karis Kabanga (Approved by Leader, Menunggu HRD)
(4, 'CUTI-202611-004', 4, 1, FALSE, '2026-11-10', '2026-11-23', '2026-11-24', 2.0, 
 'Keperluan keluarga penting dan check-up kesehatan rutin orang tua', 8, 'Penanganan nasabah tabungan dibantu Joshua Kurniawan', 
 'Jl. Pandanaran No. 50, Semarang', '08123456004', 'Approved by Leader', 3, '2026-11-11 09:30:00', 
 'Handover tugas telah disetujui, koordinasi loket aman.', NULL, NULL, NULL),

-- 5. Pengajuan Muhammad Kaizo (Approved by Leader, Menunggu HRD - Divisi Operasional Kapasitas 33%)
(5, 'CUTI-202611-005', 11, 1, FALSE, '2026-11-12', '2026-11-25', '2026-11-27', 3.0, 
 'Renovasi rumah tempat tinggal', NULL, 'Tugas kliring di-cover oleh tim operasional shift pagi', 
 'Jl. Pramuka Raya No. 16, Jakarta Timur', '08123456011', 'Approved by Leader', NULL, '2026-11-13 14:00:00', 
 'Disetujui atasan divisi.', NULL, NULL, NULL),

-- 6. Pengajuan Anita Sari (Ketua Divisi langsung ke HRD)
(6, 'CUTI-202611-006', 10, 1, FALSE, '2026-11-13', '2026-12-14', '2026-12-16', 3.0, 
 'Urusan keluarga di luar kota', NULL, 'Koordinasi kredit didelegasikan sementara ke wakil ketua', 
 'Surabaya, Jawa Timur', '08123456010', 'Pending', NULL, NULL, NULL, NULL, NULL, NULL),

-- 7. Pengajuan Laras Ayu (Cuti Sakit)
(7, 'CUTI-202611-007', 12, 2, FALSE, '2026-11-16', '2026-11-16', '2026-11-17', 2.0, 
 'Sakit demam tifoid istirahat dokter', NULL, 'Monitoring dokumen analisa risiko', 
 'Rumah tinggal Jakarta', '08123456012', 'Approved by Leader', NULL, '2026-11-16 08:30:00', 
 'Surat dokter terlampir valid dari RS Siloam.', NULL, NULL, NULL),

-- 8. Pengajuan Terdahulu Karis Kabanga (Approved Final)
(8, 'CUTI-202610-015', 4, 1, FALSE, '2026-10-05', '2026-10-12', '2026-10-13', 2.0, 
 'Cuti tahunan keperluan pindah rumah', 9, 'Magnolia Seamel standby customer desk', 
 'Jakarta Selatan', '08123456004', 'Approved', 3, '2026-10-06 10:00:00', 
 'Disetujui.', 2, '2026-10-07 14:15:00', 'Persetujuan HRD final selesai.'),

-- 9. Pengajuan Karis Kabanga Setengah Hari Terdahulu (Approved Final)
(9, 'CUTI-202609-008', 4, 1, TRUE, '2026-09-18', '2026-09-22', '2026-09-22', 0.5, 
 'Perpanjangan SIM di samsat pagi hari', 8, 'Joshua Kurniawan cover pagi', 
 'Jakarta Selatan', '08123456004', 'Approved', 3, '2026-09-19 08:00:00', 
 'Disetujui.', 2, '2026-09-19 11:00:00', 'Disetujui.');
ALTER SEQUENCE leave_requests_id_seq RESTART WITH 10;

-- Data Notifikasi In-App Awal
INSERT INTO notifications (user_id, judul, pesan, is_read, tipe, tautan) VALUES
(4, 'Persetujuan Ketua Divisi', 'Pengajuan cuti nomor CUTI-202611-004 telah disetujui Ketua Divisi dan diteruskan ke HRD.', FALSE, 'success', '/karyawan/riwayat'),
(3, 'Permohonan Cuti Baru', 'Yusuf Kurniawan mengajukan Cuti Tahunan periode 28 - 30 Des 2026.', FALSE, 'info', '/ketua/verifikasi'),
(3, 'Permohonan Cuti Baru', 'Dewi Hartono mengajukan Cuti Tahunan periode 01 - 02 Des 2026.', FALSE, 'info', '/ketua/verifikasi'),
(2, 'Persetujuan Final Masuk', 'Terdapat 5 pengajuan cuti menunggu persetujuan final HRD.', FALSE, 'warning', '/hrd/persetujuan');
