import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import { verifyToken, TOKEN_NAME } from '@/lib/auth';

export async function GET(request) {
  try {
    const token = request.cookies.get(TOKEN_NAME)?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const res = await query(
      `SELECT u.id, u.username, u.email, u.nama_lengkap, u.role, u.jabatan,
              u.divisi_id, d.nama_divisi, u.kuota_tahunan_awal, u.sisa_kuota_tahunan,
              u.kuota_terpakai, u.nomor_telepon, u.alamat, u.tanggal_bergabung,
              u.foto_profil, u.created_at
       FROM users u
       LEFT JOIN divisions d ON u.divisi_id = d.id
       WHERE u.id = $1`,
      [decoded.id]
    );

    if (res.rows.length === 0) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    return NextResponse.json({ profile: res.rows[0] });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const token = request.cookies.get(TOKEN_NAME)?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { nama_lengkap, nomor_telepon, alamat, password, foto_profil } = body;

    if (!nama_lengkap) {
      return NextResponse.json({ error: 'Nama lengkap wajib diisi.' }, { status: 400 });
    }

    let sql = `
      UPDATE users 
      SET nama_lengkap = $1, nomor_telepon = $2, alamat = $3, updated_at = CURRENT_TIMESTAMP
    `;
    const params = [nama_lengkap.trim(), nomor_telepon || null, alamat || null];

    if (foto_profil !== undefined) {
      params.push(foto_profil);
      sql += `, foto_profil = $${params.length}`;
    }

    if (password && password.trim() !== '') {
      params.push(await bcrypt.hash(password, 10));
      sql += `, password_hash = $${params.length}`;
    }

    params.push(decoded.id);
    sql += ` WHERE id = $${params.length} RETURNING id, username, email, nama_lengkap, role, foto_profil`;

    const res = await query(sql, params);

    return NextResponse.json({
      message: 'Profil berhasil diperbarui.',
      user: res.rows[0],
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
