import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken, TOKEN_NAME } from '@/lib/auth';

export async function GET() {
  try {
    const res = await query(`SELECT * FROM holidays ORDER BY tanggal ASC`);
    return NextResponse.json({ holidays: res.rows });
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
    const { tanggal, keterangan, tipe = 'Hari Libur Nasional' } = body;

    if (!tanggal || !keterangan) {
      return NextResponse.json({ error: 'Tanggal dan keterangan wajib diisi.' }, { status: 400 });
    }

    const res = await query(
      `INSERT INTO holidays (tanggal, keterangan, tipe)
       VALUES ($1, $2, $3)
       ON CONFLICT (tanggal) DO UPDATE 
       SET keterangan = EXCLUDED.keterangan, tipe = EXCLUDED.tipe
       RETURNING *`,
      [tanggal, keterangan.trim(), tipe]
    );

    return NextResponse.json({ message: 'Hari libur berhasil disimpan.', holiday: res.rows[0] });
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

    await query(`DELETE FROM holidays WHERE id = $1`, [id]);
    return NextResponse.json({ message: 'Hari libur berhasil dihapus.' });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
