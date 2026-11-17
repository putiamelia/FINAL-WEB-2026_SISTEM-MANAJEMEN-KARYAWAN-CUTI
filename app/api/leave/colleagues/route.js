import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken, TOKEN_NAME } from '@/lib/auth';

export async function GET(request) {
  try {
    const token = request.cookies.get(TOKEN_NAME)?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Ambil semua pegawai aktif untuk serah terima / handover (utamakan yang satu divisi)
    const sql = `
      SELECT u.id, u.nama_lengkap, u.role, u.jabatan, u.divisi_id, d.nama_divisi
      FROM users u
      LEFT JOIN divisions d ON u.divisi_id = d.id
      WHERE u.status_aktif = TRUE AND u.id != $1
      ORDER BY 
        CASE 
          WHEN u.divisi_id IS NOT NULL AND u.divisi_id = (SELECT divisi_id FROM users WHERE id = $1) THEN 0 
          ELSE 1 
        END,
        u.nama_lengkap ASC
    `;

    const res = await query(sql, [decoded.id]);
    return NextResponse.json({ 
      colleagues: res.rows,
      users: res.rows 
    });
  } catch (err) {
    console.error('Error fetching colleagues:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
