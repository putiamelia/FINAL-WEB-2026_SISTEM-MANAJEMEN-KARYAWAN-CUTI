import { NextResponse } from 'next/server';
import { query, transaction } from '@/lib/db';
import { verifyToken, TOKEN_NAME } from '@/lib/auth';

export async function GET(request) {
  try {
    const token = request.cookies.get(TOKEN_NAME)?.value;
    if (!token) return NextResponse.json({ error: 'Belum terautentikasi' }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded || (decoded.role !== 'HRD' && decoded.role !== 'Admin')) {
      return NextResponse.json({ error: 'Akses khusus HRD dan Admin.' }, { status: 403 });
    }

    // Ambil setting kapasitas divisi
    const settingRes = await query(
      `SELECT setting_value FROM system_settings WHERE setting_key = 'max_team_leave_percentage'`
    );
    const maxPercent = parseFloat(settingRes.rows[0]?.setting_value || '30');

    // Ambil semua pengajuan yang siap diproses HRD:
    // 1. Dari Karyawan yang sudah 'Approved by Leader'
    // 2. Dari Ketua Divisi yang berstatus 'Pending' (karena Ketua Divisi langsung ke HRD)
    const sql = `
      SELECT r.id, r.nomor_pengajuan, r.user_id, u.nama_lengkap, u.jabatan, u.foto_profil,
             u.sisa_kuota_tahunan, u.role as user_role, u.divisi_id, d.nama_divisi,
             r.leave_type_id, lt.nama_cuti, lt.potong_kuota_utama,
             r.is_half_day, r.tanggal_pengajuan, r.tanggal_mulai, r.tanggal_selesai,
             r.total_hari, r.alasan, r.handover_user_id, hu.nama_lengkap as nama_handover,
             r.catatan_handover, r.alamat_selama_cuti, r.nomor_darurat, r.lampiran_url,
             r.status, r.leader_approver_id, lu.nama_lengkap as nama_leader,
             r.leader_approval_date, r.leader_notes, r.created_at
      FROM leave_requests r
      JOIN users u ON r.user_id = u.id
      LEFT JOIN divisions d ON u.divisi_id = d.id
      JOIN leave_types lt ON r.leave_type_id = lt.id
      LEFT JOIN users hu ON r.handover_user_id = hu.id
      LEFT JOIN users lu ON r.leader_approver_id = lu.id
      WHERE (r.status = 'Approved by Leader')
         OR (r.status = 'Pending' AND u.role = 'Ketua Divisi')
      ORDER BY r.created_at ASC
    `;

    const res = await query(sql);

    // Hitung kapasitas tim untuk masing-masing pengajuan
    const enrichedRequests = await Promise.all(
      res.rows.map(async (req) => {
        if (!req.divisi_id) {
          return { ...req, capacity_warning: null };
        }

        // Total anggota aktif di divisi
        const totalMemberRes = await query(
          `SELECT COUNT(*) as total FROM users WHERE divisi_id = $1 AND status_aktif = TRUE`,
          [req.divisi_id]
        );
        const totalMembers = parseInt(totalMemberRes.rows[0]?.total || '1', 10);

        // Anggota divisi yang sedang cuti pada rentang tanggal tersebut
        const onLeaveRes = await query(
          `SELECT COUNT(DISTINCT user_id) as count 
           FROM leave_requests r
           JOIN users u ON r.user_id = u.id
           WHERE u.divisi_id = $1 
             AND r.status IN ('Approved', 'Approved by Leader')
             AND (r.tanggal_mulai <= $2 AND r.tanggal_selesai >= $3)`,
          [req.divisi_id, req.tanggal_selesai, req.tanggal_mulai]
        );
        const countOnLeave = parseInt(onLeaveRes.rows[0]?.count || '0', 10);
        const percentage = Math.round((countOnLeave / totalMembers) * 100);

        const isExceeded = percentage >= maxPercent;

        return {
          ...req,
          capacity_info: {
            total_members: totalMembers,
            on_leave_count: countOnLeave,
            percentage,
            max_percentage: maxPercent,
            is_exceeded: isExceeded,
          },
        };
      })
    );

    const statsRes = await query(`
      SELECT 
        (SELECT COUNT(*) FROM leave_requests) as total_requests,
        (SELECT COUNT(DISTINCT user_id) FROM leave_requests WHERE status IN ('Approved', 'Approved by Leader')) as on_leave_count
    `);
    const totalRequests = parseInt(statsRes.rows[0]?.total_requests || '0', 10);
    const onLeaveCount = parseInt(statsRes.rows[0]?.on_leave_count || '0', 10);

    return NextResponse.json({ 
      requests: enrichedRequests,
      totalRequests,
      onLeaveCount,
    });
  } catch (err) {
    console.error('Error fetching HRD approvals:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const token = request.cookies.get(TOKEN_NAME)?.value;
    if (!token) return NextResponse.json({ error: 'Belum terautentikasi' }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded || (decoded.role !== 'HRD' && decoded.role !== 'Admin')) {
      return NextResponse.json({ error: 'Akses khusus HRD dan Admin.' }, { status: 403 });
    }

    const body = await request.json();
    const { request_ids, action, notes } = body; // action: 'APPROVE' or 'REJECT', request_ids: array of IDs

    if (!request_ids || !Array.isArray(request_ids) || request_ids.length === 0 || !action) {
      return NextResponse.json(
        { error: 'Daftar ID pengajuan dan aksi persetujuan wajib diisi.' },
        { status: 400 }
      );
    }

    if (action === 'REJECT' && (!notes || notes.trim() === '')) {
      return NextResponse.json(
        { error: 'Catatan wajib diisi saat menolak pengajuan cuti.' },
        { status: 400 }
      );
    }

    await transaction(async (client) => {
      for (const reqId of request_ids) {
        const reqRes = await client.query(
          `SELECT r.*, lt.potong_kuota_utama 
           FROM leave_requests r
           JOIN leave_types lt ON r.leave_type_id = lt.id
           WHERE r.id = $1`,
          [reqId]
        );

        if (reqRes.rows.length === 0) continue;
        const leaveReq = reqRes.rows[0];

        if (action === 'APPROVE') {
          await client.query(
            `UPDATE leave_requests
             SET status = 'Approved',
                 hrd_approver_id = $1,
                 hrd_approval_date = CURRENT_TIMESTAMP,
                 hrd_notes = $2,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $3`,
            [decoded.id, notes || null, reqId]
          );

          // Notifikasi ke Karyawan
          await client.query(
            `INSERT INTO notifications (user_id, judul, pesan, tipe, tautan)
             VALUES ($1, 'Persetujuan Final Cuti Disetujui', $2, 'success', '/karyawan/riwayat')`,
            [
              leaveReq.user_id,
              `Pengajuan cuti nomor ${leaveReq.nomor_pengajuan} telah disetujui penuh oleh HRD. Anda dapat mengunduh surat cuti resmi.`,
            ]
          );
        } else {
          // REJECT: Kembalikan kuota cuti jika memotong kuota
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
                 hrd_approver_id = $1,
                 hrd_approval_date = CURRENT_TIMESTAMP,
                 hrd_notes = $2,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $3`,
            [decoded.id, notes, reqId]
          );

          // Notifikasi ke Karyawan
          await client.query(
            `INSERT INTO notifications (user_id, judul, pesan, tipe, tautan)
             VALUES ($1, 'Pengajuan Cuti Ditolak HRD', $2, 'danger', '/karyawan/riwayat')`,
            [
              leaveReq.user_id,
              `Pengajuan cuti nomor ${leaveReq.nomor_pengajuan} ditolak oleh HRD. Alasan: ${notes}`,
            ]
          );
        }
      }
    });

    return NextResponse.json({
      message: action === 'APPROVE'
        ? `Berhasil menyetujui ${request_ids.length} permohonan cuti.`
        : `Permohonan cuti telah ditolak.`,
    });
  } catch (err) {
    console.error('Error processing HRD approvals:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
