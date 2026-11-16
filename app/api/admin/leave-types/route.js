import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken, TOKEN_NAME } from '@/lib/auth';

export async function GET() {
  try {
    const res = await query(`SELECT * FROM leave_types ORDER BY id ASC`);
    return NextResponse.json({ leaveTypes: res.rows });
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
    const {
      nama_cuti,
      deskripsi,
      kuota_default = 0,
      minimal_h_pengajuan = 0,
      maksimal_h_setelah_sakit = 3,
      wajib_lampiran = false,
      potong_kuota_utama = false,
      status_aktif = true,
    } = body;

    if (!nama_cuti || nama_cuti.trim() === '') {
      return NextResponse.json({ error: 'Nama jenis cuti wajib diisi.' }, { status: 400 });
    }

    const checkRes = await query(`SELECT id FROM leave_types WHERE LOWER(nama_cuti) = LOWER($1)`, [nama_cuti.trim()]);
    if (checkRes.rows.length > 0) {
      return NextResponse.json({ error: 'Jenis cuti dengan nama ini sudah ada.' }, { status: 400 });
    }

    const insertRes = await query(
      `INSERT INTO leave_types (
         nama_cuti, deskripsi, kuota_default, minimal_h_pengajuan,
         maksimal_h_setelah_sakit, wajib_lampiran, potong_kuota_utama, status_aktif
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        nama_cuti.trim(),
        deskripsi || null,
        parseFloat(kuota_default) || 0,
        parseInt(minimal_h_pengajuan, 10) || 0,
        parseInt(maksimal_h_setelah_sakit, 10) || 3,
        Boolean(wajib_lampiran),
        Boolean(potong_kuota_utama),
        Boolean(status_aktif),
      ]
    );

    return NextResponse.json({ message: 'Jenis cuti berhasil dibuat.', leaveType: insertRes.rows[0] });
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
    const {
      id,
      nama_cuti,
      deskripsi,
      kuota_default,
      minimal_h_pengajuan,
      maksimal_h_setelah_sakit,
      wajib_lampiran,
      potong_kuota_utama,
      status_aktif,
    } = body;

    if (!id || !nama_cuti) {
      return NextResponse.json({ error: 'ID dan nama jenis cuti wajib diisi.' }, { status: 400 });
    }

    const updateRes = await query(
      `UPDATE leave_types
       SET nama_cuti = $1, deskripsi = $2, kuota_default = $3,
           minimal_h_pengajuan = $4, maksimal_h_setelah_sakit = $5,
           wajib_lampiran = $6, potong_kuota_utama = $7, status_aktif = $8
       WHERE id = $9
       RETURNING *`,
      [
        nama_cuti.trim(),
        deskripsi || null,
        parseFloat(kuota_default) || 0,
        parseInt(minimal_h_pengajuan, 10) || 0,
        parseInt(maksimal_h_setelah_sakit, 10) || 3,
        Boolean(wajib_lampiran),
        Boolean(potong_kuota_utama),
        Boolean(status_aktif),
        id,
      ]
    );

    return NextResponse.json({ message: 'Jenis cuti berhasil diperbarui.', leaveType: updateRes.rows[0] });
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

    // Cek apakah jenis cuti sudah dipakai di tabel leave_requests
    const usageCheck = await query(`SELECT id FROM leave_requests WHERE leave_type_id = $1 LIMIT 1`, [id]);
    if (usageCheck.rows.length > 0) {
      return NextResponse.json(
        { error: 'Jenis cuti ini telah digunakan pada data pengajuan dan tidak dapat dihapus. Anda dapat menonaktifkannya.' },
        { status: 400 }
      );
    }

    await query(`DELETE FROM leave_types WHERE id = $1`, [id]);
    return NextResponse.json({ message: 'Jenis cuti berhasil dihapus.' });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
