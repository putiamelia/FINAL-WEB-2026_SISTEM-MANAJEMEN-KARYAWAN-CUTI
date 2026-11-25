import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken, TOKEN_NAME } from '@/lib/auth';

export async function GET(request) {
  try {
    const token = request.cookies.get(TOKEN_NAME)?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Dapatkan divisi user yang sedang login
    const userRes = await query(`SELECT id, divisi_id, role FROM users WHERE id = $1`, [decoded.id]);
    const userDivisiId = userRes.rows[0]?.divisi_id;

    let res;

    // Jika user memiliki divisi, batasi rekan pengganti HANYA ke rekan satu divisi yang sama
    if (userDivisiId) {
      const sqlSameDivision = `
        SELECT u.id, u.nama_lengkap, u.role, u.jabatan, u.divisi_id, d.nama_divisi
        FROM users u
        LEFT JOIN divisions d ON u.divisi_id = d.id
        WHERE u.status_aktif = TRUE 
          AND u.id != $1
          AND u.divisi_id = $2
        ORDER BY u.nama_lengkap ASC
      `;
      res = await query(sqlSameDivision, [decoded.id, userDivisiId]);

      // Fallback cadangan: jika di divisi tersebut tidak ada rekan lain sama sekali (anggota tunggal),
      // sediakan daftar pegawai aktif lain agar form pengajuan tetap bisa memilih pengganti
      if (res.rows.length === 0) {
        const sqlFallback = `
          SELECT u.id, u.nama_lengkap, u.role, u.jabatan, u.divisi_id, d.nama_divisi
          FROM users u
          LEFT JOIN divisions d ON u.divisi_id = d.id
          WHERE u.status_aktif = TRUE AND u.id != $1
          ORDER BY u.nama_lengkap ASC
        `;
        res = await query(sqlFallback, [decoded.id]);
      }
    } else {
      // Jika user tidak terikat divisi tertentu (misal Administrator sistem)
      const sqlAll = `
        SELECT u.id, u.nama_lengkap, u.role, u.jabatan, u.divisi_id, d.nama_divisi
        FROM users u
        LEFT JOIN divisions d ON u.divisi_id = d.id
        WHERE u.status_aktif = TRUE AND u.id != $1
        ORDER BY u.nama_lengkap ASC
      `;
      res = await query(sqlAll, [decoded.id]);
    }

    return NextResponse.json({ 
      colleagues: res.rows,
      users: res.rows 
    });
  } catch (err) {
    console.error('Error fetching colleagues:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
