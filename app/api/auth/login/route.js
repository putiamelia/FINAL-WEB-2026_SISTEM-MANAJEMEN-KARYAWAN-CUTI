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
    return NextResponse.json(
      { error: 'Terjadi kesalahan internal server: ' + err.message },
      { status: 500 }
    );
  }
}
