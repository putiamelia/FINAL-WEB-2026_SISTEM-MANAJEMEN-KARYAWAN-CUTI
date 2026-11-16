import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken, TOKEN_NAME } from '@/lib/auth';

export async function GET() {
  try {
    const res = await query(`
      SELECT bp.*, d.nama_divisi
      FROM blackout_periods bp
      LEFT JOIN divisions d ON bp.divisi_id = d.id
      ORDER BY bp.tanggal_mulai ASC
    `);

    // Ambil juga setting kapasitas divisi
    const settingRes = await query(
      `SELECT setting_value FROM system_settings WHERE setting_key = 'max_team_leave_percentage'`
    );
    const maxPercent = settingRes.rows[0]?.setting_value || '30';

    return NextResponse.json({
      blackoutPeriods: res.rows,
      max_percentage: maxPercent,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const token = request.cookies.get(TOKEN_NAME)?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded || (decoded.role !== 'Admin' && decoded.role !== 'HRD')) {
      return NextResponse.json({ error: 'Akses khusus Admin/HRD' }, { status: 403 });
    }

    const body = await request.json();

    // Jika update batas persentase kapasitas divisi
    if (body.update_percentage !== undefined) {
      await query(
        `INSERT INTO system_settings (setting_key, setting_value, deskripsi)
         VALUES ('max_team_leave_percentage', $1, 'Batas persentase cuti divisi')
         ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value`,
        [String(body.update_percentage)]
      );
      return NextResponse.json({ message: 'Batas kapasitas persentase divisi berhasil disimpan.' });
    }

    const { nama_periode, tanggal_mulai, tanggal_selesai, divisi_id, keterangan } = body;
    if (!nama_periode || !tanggal_mulai || !tanggal_selesai) {
      return NextResponse.json({ error: 'Nama periode, tanggal mulai dan selesai wajib diisi.' }, { status: 400 });
    }

    const res = await query(
      `INSERT INTO blackout_periods (nama_periode, tanggal_mulai, tanggal_selesai, divisi_id, keterangan)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        nama_periode.trim(),
        tanggal_mulai,
        tanggal_selesai,
        divisi_id ? parseInt(divisi_id, 10) : null,
        keterangan || null,
      ]
    );

    return NextResponse.json({ message: 'Periode blackout berhasil disimpan.', period: res.rows[0] });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const token = request.cookies.get(TOKEN_NAME)?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded || (decoded.role !== 'Admin' && decoded.role !== 'HRD')) {
      return NextResponse.json({ error: 'Akses khusus Admin/HRD' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get('id'), 10);

    await query(`DELETE FROM blackout_periods WHERE id = $1`, [id]);
    return NextResponse.json({ message: 'Periode blackout berhasil dihapus.' });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
