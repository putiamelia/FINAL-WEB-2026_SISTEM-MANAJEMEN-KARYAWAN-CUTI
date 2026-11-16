# Aturan proyek: Sistem Manajemen Cuti Karyawan

## Stack wajib
- Next.js App Router (JSX), Tailwind CSS, PostgreSQL dengan raw SQL (tanpa ORM seperti Prisma/Drizzle).
- File .sql disimpan di luar folder /app.

## Skill yang WAJIB diikuti secara otomatis
- Setiap kali membuat atau mengubah UI: ikuti antislop, antislop-ui, dan frontend-design.
- Setiap teks atau copy di antarmuka: ikuti antislop-copywriting.
- Setiap kali menulis skema atau query PostgreSQL: ikuti supabase-postgres-best-practices.
- Setiap kali ada error atau bug: ikuti systematic-debugging sebelum mengubah kode.
- Setelah halaman UI selesai: periksa dengan web-design-guidelines.
- Untuk kode Next.js: ikuti AGENTS.md dari Next.js jika ada.

## Aturan kerja
- Jangan memangkas fitur yang diminta. Kelengkapan fitur bernilai 40% dari penilaian.
- Validasi di sisi server untuk semua input.
- Perubahan kuota dan status cuti harus dalam satu transaksi SQL.
