import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken, TOKEN_NAME } from '@/lib/auth';

export async function GET(request) {
  try {
    const token = request.cookies.get(TOKEN_NAME)?.value;
    if (!token) {
      return NextResponse.json({ error: 'Belum terautentikasi' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Sesi kedaluwarsa' }, { status: 401 });
    }

    const res = await query(
      `SELECT u.id, u.username, u.email, u.nama_lengkap, u.role, u.jabatan, 
              u.divisi_id, d.nama_divisi, u.kuota_tahunan_awal, u.sisa_kuota_tahunan, 
              u.kuota_terpakai, u.nomor_telepon, u.alamat, u.tanggal_bergabung, u.foto_profil
       FROM users u
       LEFT JOIN divisions d ON u.divisi_id = d.id
       WHERE u.id = $1`,
      [decoded.id]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Pengguna tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ user: res.rows[0] });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
