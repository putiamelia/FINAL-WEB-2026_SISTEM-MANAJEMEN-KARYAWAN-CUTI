import { NextResponse } from 'next/server';
import { query, transaction } from '@/lib/db';
import { verifyToken, TOKEN_NAME } from '@/lib/auth';

export async function GET(request) {
  try {
    const token = request.cookies.get(TOKEN_NAME)?.value;
    if (!token) return NextResponse.json({ error: 'Belum terautentikasi' }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded || (decoded.role !== 'Ketua Divisi' && decoded.role !== 'Admin')) {
      return NextResponse.json({ error: 'Akses ditolak. Khusus Ketua Divisi/Admin.' }, { status: 403 });
    }

    // Ambil divisi ketua
    const userRes = await query(`SELECT divisi_id, nama_lengkap FROM users WHERE id = $1`, [decoded.id]);
    const ketuaDivisiId = userRes.rows[0]?.divisi_id;

    const res = await query(
      `SELECT r.id, r.nomor_pengajuan, r.user_id, u.nama_lengkap, u.jabatan, u.foto_profil,
              u.sisa_kuota_tahunan, d.nama_divisi, r.leave_type_id, lt.nama_cuti,
              r.is_half_day, r.tanggal_pengajuan, r.tanggal_mulai, r.tanggal_selesai,
              r.total_hari, r.alasan, r.handover_user_id, hu.nama_lengkap as nama_handover,
              r.catatan_handover, r.alamat_selama_cuti, r.nomor_darurat, r.lampiran_url,
              r.status, r.created_at
       FROM leave_requests r
       JOIN users u ON r.user_id = u.id
       JOIN divisions d ON u.divisi_id = d.id
       JOIN leave_types lt ON r.leave_type_id = lt.id
       LEFT JOIN users hu ON r.handover_user_id = hu.id
       WHERE u.divisi_id = $1 
         AND r.user_id != $2
         AND r.status = 'Pending'
       ORDER BY r.created_at ASC`,
      [ketuaDivisiId, decoded.id]
    );

    return NextResponse.json({ requests: res.rows });
  } catch (err) {
    console.error('Error fetching verification list:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const token = request.cookies.get(TOKEN_NAME)?.value;
    if (!token) return NextResponse.json({ error: 'Belum terautentikasi' }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded || (decoded.role !== 'Ketua Divisi' && decoded.role !== 'Admin')) {
      return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 });
    }

    const body = await request.json();
    const { request_id, action, notes } = body; // action: 'APPROVE' or 'REJECT'

    if (!request_id || !action) {
      return NextResponse.json({ error: 'ID pengajuan dan aksi wajib diisi.' }, { status: 400 });
    }

    if (action === 'REJECT' && (!notes || notes.trim() === '')) {
      return NextResponse.json({ error: 'Catatan wajib diisi saat menolak pengajuan cuti.' }, { status: 400 });
    }

    // Ambil data pengajuan
    const reqRes = await query(
      `SELECT r.*, lt.potong_kuota_utama, u.nama_lengkap as nama_karyawan 
       FROM leave_requests r
       JOIN leave_types lt ON r.leave_type_id = lt.id
       JOIN users u ON r.user_id = u.id
       WHERE r.id = $1`,
      [request_id]
    );

    if (reqRes.rows.length === 0) {
      return NextResponse.json({ error: 'Data pengajuan cuti tidak ditemukan.' }, { status: 404 });
    }

    const leaveReq = reqRes.rows[0];

    if (leaveReq.status !== 'Pending') {
      return NextResponse.json({ error: 'Pengajuan cuti ini sudah tidak dalam status Pending.' }, { status: 400 });
    }

    await transaction(async (client) => {
      if (action === 'APPROVE') {
        await client.query(
          `UPDATE leave_requests
           SET status = 'Approved by Leader',
               leader_approver_id = $1,
               leader_approval_date = CURRENT_TIMESTAMP,
               leader_notes = $2,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $3`,
          [decoded.id, notes || null, request_id]
        );

        // Notifikasi ke Karyawan
        await client.query(
          `INSERT INTO notifications (user_id, judul, pesan, tipe, tautan)
           VALUES ($1, 'Verifikasi Ketua Divisi Disetujui', $2, 'info', '/karyawan/riwayat')`,
          [
            leaveReq.user_id,
            `Pengajuan cuti nomor ${leaveReq.nomor_pengajuan} telah diverifikasi oleh Ketua Divisi dan diteruskan ke HRD.`,
          ]
        );

        // Notifikasi ke HRD
        const hrdList = await client.query(`SELECT id FROM users WHERE role = 'HRD' AND status_aktif = TRUE`);
        for (const hrd of hrdList.rows) {
          await client.query(
            `INSERT INTO notifications (user_id, judul, pesan, tipe, tautan)
             VALUES ($1, 'Persetujuan Final HRD', $2, 'info', '/hrd/persetujuan')`,
            [
              hrd.id,
              `Pengajuan cuti nomor ${leaveReq.nomor_pengajuan} (${leaveReq.nama_karyawan}) telah disetujui atasan dan menunggu persetujuan final HRD.`,
            ]
          );
        }
      } else {
        // REJECT: Kembalikan kuota jika memotong kuota
        if (leaveReq.potong_kuota_utama) {
          await client.query(
            `UPDATE users 
             SET sisa_kuota_tahunan = sisa_kuota_tahunan + $1,
                 kuota_terpakai = kuota_terpakai - $1,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $2`,
            [leaveReq.total_hari, leaveReq.user_id]
          );
        }

        await client.query(
          `UPDATE leave_requests
           SET status = 'Rejected',
               leader_approver_id = $1,
               leader_approval_date = CURRENT_TIMESTAMP,
               leader_notes = $2,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $3`,
          [decoded.id, notes, request_id]
        );

        // Notifikasi ke Karyawan
        await client.query(
          `INSERT INTO notifications (user_id, judul, pesan, tipe, tautan)
           VALUES ($1, 'Pengajuan Cuti Ditolak Ketua Divisi', $2, 'danger', '/karyawan/riwayat')`,
          [
            leaveReq.user_id,
            `Pengajuan cuti nomor ${leaveReq.nomor_pengajuan} ditolak oleh Ketua Divisi. Alasan: ${notes}`,
          ]
        );
      }
    });

    return NextResponse.json({
      message: action === 'APPROVE' ? 'Pengajuan cuti berhasil disetujui dan diteruskan ke HRD.' : 'Pengajuan cuti ditolak.',
    });
  } catch (err) {
    console.error('Error verifying leave request:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
