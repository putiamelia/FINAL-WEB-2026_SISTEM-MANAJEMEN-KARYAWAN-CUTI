import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { comparePassword, generateToken, TOKEN_NAME } from '@/lib/auth';

export async function POST(request) {
  try {
    const body = await request.json();
    const { identifier, password, rememberMe } = body;

    if (!identifier || !password) {
      return NextResponse.json(
        { error: 'Email atau username dan kata sandi wajib diisi.' },
        { status: 400 }
      );
    }

    // Query user by email or username using Raw SQL
    const res = await query(
      `SELECT id, username, email, password_hash, nama_lengkap, role, jabatan, 
              divisi_id, kuota_tahunan_awal, sisa_kuota_tahunan, kuota_terpakai, 
              status_aktif, foto_profil
       FROM users 
       WHERE (LOWER(email) = LOWER($1) OR LOWER(username) = LOWER($1))`,
      [identifier.trim()]
    );

    if (res.rows.length === 0) {
      return NextResponse.json(
        { error: 'Pengguna tidak ditemukan atau belum terdaftar.' },
        { status: 401 }
      );
    }

    const user = res.rows[0];

    if (!user.status_aktif) {
      return NextResponse.json(
        { error: 'Akun Anda dinonaktifkan. Silakan hubungi Administrator sistem.' },
        { status: 403 }
      );
    }

    const isMatch = comparePassword(password, user.password_hash);
    if (!isMatch) {
      return NextResponse.json(
        { error: 'Kata sandi yang Anda masukkan salah.' },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = generateToken(user);

    // Prepare response with HTTP-only cookie
    const response = NextResponse.json({
      message: 'Berhasil masuk ke sistem.',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        nama_lengkap: user.nama_lengkap,
        role: user.role,
        jabatan: user.jabatan,
        divisi_id: user.divisi_id,
        sisa_kuota_tahunan: user.sisa_kuota_tahunan,
        foto_profil: user.foto_profil,
      },
    });

    const maxAge = rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60; // 30 days or 1 day
    response.cookies.set({
      name: TOKEN_NAME,
      value: token,
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      maxAge: maxAge,
    });

    return response;
  } catch (err) {
    console.error('Login error:', err);
    let errorMessage = err.message;

    if (err.message.includes('SCRAM-SERVER-FIRST-MESSAGE') || err.message.includes('client password must be a string')) {
      errorMessage = 'Kata sandi database PostgreSQL belum diisi di file .env.local (PGPASSWORD masih kosong). Silakan buka file .env.local dan masukkan password PostgreSQL / pgAdmin Anda.';
    } else if (err.message.includes('password authentication failed')) {
      errorMessage = 'Kata sandi PostgreSQL di file .env.local salah. Silakan sesuaikan PGPASSWORD di file .env.local dengan password akun postgres Anda di pgAdmin.';
    } else if (err.message.includes('does not exist') && err.message.includes('database')) {
      errorMessage = 'Database "db_cuti_karyawan" belum dibuat di pgAdmin. Buka pgAdmin, buat database "db_cuti_karyawan", lalu jalankan database.sql.';
    } else if (err.message.includes('relation "users" does not exist')) {
      errorMessage = 'Tabel database belum dibuat. Silakan buka database.sql di pgAdmin (Query Tool) pada database db_cuti_karyawan, lalu klik Execute (F5).';
    } else if (err.message.includes('ECONNREFUSED')) {
      errorMessage = 'Tidak dapat terhubung ke PostgreSQL. Pastikan service PostgreSQL sudah berjalan di port yang sesuai (5432 atau 5433).';
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
