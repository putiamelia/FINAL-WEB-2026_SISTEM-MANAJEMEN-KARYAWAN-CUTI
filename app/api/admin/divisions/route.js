import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken, TOKEN_NAME } from '@/lib/auth';

export async function GET(request) {
  try {
    const token = request.cookies.get(TOKEN_NAME)?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const sql = `
      SELECT d.id, d.nama_divisi, d.deskripsi, d.ketua_id, d.tanggal_dibentuk,
             u.nama_lengkap as nama_ketua, u.email as email_ketua,
             COUNT(m.id) as jumlah_anggota
      FROM divisions d
      LEFT JOIN users u ON d.ketua_id = u.id
      LEFT JOIN users m ON m.divisi_id = d.id AND m.status_aktif = TRUE
      GROUP BY d.id, u.nama_lengkap, u.email
      ORDER BY d.nama_divisi ASC
    `;
    const res = await query(sql);
    return NextResponse.json({ divisions: res.rows });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const token = request.cookies.get(TOKEN_NAME)?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'Admin') {
      return NextResponse.json({ error: 'Akses khusus Admin' }, { status: 403 });
    }

    const body = await request.json();
    const { nama_divisi, deskripsi, ketua_id } = body;

    if (!nama_divisi || nama_divisi.trim() === '') {
      return NextResponse.json({ error: 'Nama divisi wajib diisi.' }, { status: 400 });
    }

    // Cek keunikan nama divisi
    const nameCheck = await query(`SELECT id FROM divisions WHERE LOWER(nama_divisi) = LOWER($1)`, [nama_divisi.trim()]);
    if (nameCheck.rows.length > 0) {
      return NextResponse.json({ error: 'Nama divisi sudah ada.' }, { status: 400 });
    }

    // Jika ketua dipilih, cek apakah sudah memimpin divisi lain
    if (ketua_id) {
      const leaderCheck = await query(`SELECT id, nama_divisi FROM divisions WHERE ketua_id = $1`, [ketua_id]);
      if (leaderCheck.rows.length > 0) {
        return NextResponse.json(
          { error: `Ketua yang dipilih sudah memimpin divisi "${leaderCheck.rows[0].nama_divisi}". Ketua divisi tidak boleh merangkap.` },
          { status: 400 }
        );
      }
    }

    const res = await query(
      `INSERT INTO divisions (nama_divisi, deskripsi, ketua_id, tanggal_dibentuk)
       VALUES ($1, $2, $3, CURRENT_DATE)
       RETURNING *`,
      [nama_divisi.trim(), deskripsi || null, ketua_id ? parseInt(ketua_id, 10) : null]
    );

    // Update role & divisi_id ketua jika dipilih
    if (ketua_id) {
      await query(
        `UPDATE users SET role = 'Ketua Divisi', divisi_id = $1 WHERE id = $2`,
        [res.rows[0].id, ketua_id]
      );
    }

    return NextResponse.json({ message: 'Divisi berhasil dibuat.', division: res.rows[0] });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const token = request.cookies.get(TOKEN_NAME)?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'Admin') {
      return NextResponse.json({ error: 'Akses khusus Admin' }, { status: 403 });
    }

    const body = await request.json();
    const { id, nama_divisi, deskripsi, ketua_id } = body;

    if (!id || !nama_divisi) {
      return NextResponse.json({ error: 'ID dan nama divisi wajib diisi.' }, { status: 400 });
    }

    // Cek keunikan nama
    const nameCheck = await query(
      `SELECT id FROM divisions WHERE LOWER(nama_divisi) = LOWER($1) AND id != $2`,
      [nama_divisi.trim(), id]
    );
    if (nameCheck.rows.length > 0) {
      return NextResponse.json({ error: 'Nama divisi sudah ada.' }, { status: 400 });
    }

    // Cek ketua tidak merangkap divisi lain
    if (ketua_id) {
      const leaderCheck = await query(
        `SELECT id, nama_divisi FROM divisions WHERE ketua_id = $1 AND id != $2`,
        [ketua_id, id]
      );
      if (leaderCheck.rows.length > 0) {
        return NextResponse.json(
          { error: `Ketua yang dipilih sudah memimpin divisi "${leaderCheck.rows[0].nama_divisi}".` },
          { status: 400 }
        );
      }
    }

    const res = await query(
      `UPDATE divisions 
       SET nama_divisi = $1, deskripsi = $2, ketua_id = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [nama_divisi.trim(), deskripsi || null, ketua_id ? parseInt(ketua_id, 10) : null, id]
    );

    if (ketua_id) {
      await query(
        `UPDATE users SET role = 'Ketua Divisi', divisi_id = $1 WHERE id = $2`,
        [id, ketua_id]
      );
    }

    return NextResponse.json({ message: 'Divisi berhasil diperbarui.', division: res.rows[0] });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const token = request.cookies.get(TOKEN_NAME)?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'Admin') {
      return NextResponse.json({ error: 'Akses khusus Admin' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get('id'), 10);

    if (!id) return NextResponse.json({ error: 'ID divisi tidak valid' }, { status: 400 });

    // Lepaskan atribut divisi anggota terlebih dahulu
    await query(`UPDATE users SET divisi_id = NULL WHERE divisi_id = $1`, [id]);
    await query(`DELETE FROM divisions WHERE id = $1`, [id]);

    return NextResponse.json({ message: 'Divisi berhasil dihapus. Anggota dilepaskan dari divisi ini.' });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
