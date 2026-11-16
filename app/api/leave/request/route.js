import { NextResponse } from 'next/server';
import { query, transaction } from '@/lib/db';
import { verifyToken, TOKEN_NAME } from '@/lib/auth';
import { calculateWorkingDays } from '@/lib/utils';

export async function GET(request) {
  try {
    const token = request.cookies.get(TOKEN_NAME)?.value;
    if (!token) return NextResponse.json({ error: 'Belum terautentikasi' }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: 'Sesi kedaluwarsa' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    let sql = `
      SELECT r.id, r.nomor_pengajuan, r.user_id, u.nama_lengkap, u.jabatan, d.nama_divisi,
             r.leave_type_id, lt.nama_cuti, r.is_half_day, r.tanggal_pengajuan, 
             r.tanggal_mulai, r.tanggal_selesai, r.total_hari, r.alasan,
             r.handover_user_id, hu.nama_lengkap as nama_handover, r.catatan_handover,
             r.alamat_selama_cuti, r.nomor_darurat, r.lampiran_url, r.status,
             r.alasan_pembatalan, r.leader_approver_id, lu.nama_lengkap as nama_leader,
             r.leader_approval_date, r.leader_notes,
             r.hrd_approver_id, hrd.nama_lengkap as nama_hrd,
             r.hrd_approval_date, r.hrd_notes, r.created_at
      FROM leave_requests r
      JOIN users u ON r.user_id = u.id
      LEFT JOIN divisions d ON u.divisi_id = d.id
      JOIN leave_types lt ON r.leave_type_id = lt.id
      LEFT JOIN users hu ON r.handover_user_id = hu.id
      LEFT JOIN users lu ON r.leader_approver_id = lu.id
      LEFT JOIN users hrd ON r.hrd_approver_id = hrd.id
      WHERE r.user_id = $1
    `;

    const params = [decoded.id];

    if (status && status !== 'Semua') {
      params.push(status);
      sql += ` AND r.status = $${params.length}`;
    }

    sql += ` ORDER BY r.created_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const res = await query(sql, params);
    return NextResponse.json({ requests: res.rows });
  } catch (err) {
    console.error('Error fetching leave requests:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const token = request.cookies.get(TOKEN_NAME)?.value;
    if (!token) return NextResponse.json({ error: 'Belum terautentikasi' }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: 'Sesi kedaluwarsa' }, { status: 401 });

    const body = await request.json();
    const {
      leave_type_id,
      is_half_day,
      tanggal_mulai,
      tanggal_selesai,
      alasan,
      handover_user_id,
      catatan_handover,
      alamat_selama_cuti,
      nomor_darurat,
      lampiran_url,
    } = body;

    // 1. Validasi field wajib
    if (!leave_type_id || !tanggal_mulai || !tanggal_selesai || !alasan) {
      return NextResponse.json(
        { error: 'Jenis cuti, tanggal mulai, tanggal selesai, dan alasan cuti wajib diisi.' },
        { status: 400 }
      );
    }

    // 2. Query user dan leave_type
    const userRes = await query(
      `SELECT u.id, u.nama_lengkap, u.role, u.divisi_id, u.sisa_kuota_tahunan, u.kuota_terpakai,
              d.ketua_id, d.nama_divisi
       FROM users u
       LEFT JOIN divisions d ON u.divisi_id = d.id
       WHERE u.id = $1`,
      [decoded.id]
    );
    if (userRes.rows.length === 0) {
      return NextResponse.json({ error: 'Pengguna tidak ditemukan.' }, { status: 404 });
    }
    const currentUser = userRes.rows[0];

    const typeRes = await query(`SELECT * FROM leave_types WHERE id = $1`, [leave_type_id]);
    if (typeRes.rows.length === 0) {
      return NextResponse.json({ error: 'Jenis cuti tidak valid.' }, { status: 400 });
    }
    const leaveType = typeRes.rows[0];

    // 3. Ambil daftar hari libur
    const holidayRes = await query(`SELECT tanggal FROM holidays`);
    const holidays = holidayRes.rows.map((r) => r.tanggal);

    // 4. Hitung hari kerja
    let totalHari = 0;
    if (is_half_day) {
      totalHari = 0.5;
    } else {
      totalHari = calculateWorkingDays(tanggal_mulai, tanggal_selesai, holidays);
      if (totalHari <= 0) {
        return NextResponse.json(
          { error: 'Periode cuti tidak memiliki hari kerja efektif (Sabtu/Minggu atau hari libur nasional).' },
          { status: 400 }
        );
      }
    }

    // 5. Validasi Cuti Tahunan: Minimal H-3
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(tanggal_mulai);
    startDate.setHours(0, 0, 0, 0);

    const diffDays = Math.ceil((startDate - today) / (1000 * 60 * 60 * 24));

    if (leaveType.nama_cuti === 'Cuti Tahunan') {
      if (diffDays < leaveType.minimal_h_pengajuan) {
        return NextResponse.json(
          { error: `Pengajuan Cuti Tahunan harus dilakukan minimal H-${leaveType.minimal_h_pengajuan} sebelum tanggal mulai.` },
          { status: 400 }
        );
      }

      // Cek sisa kuota
      const sisa = parseFloat(currentUser.sisa_kuota_tahunan);
      if (sisa < totalHari) {
        return NextResponse.json(
          { error: `Sisa kuota cuti tahunan Anda tidak mencukupi (Sisa: ${sisa} hari, Pengajuan: ${totalHari} hari).` },
          { status: 400 }
        );
      }
    }

    // 6. Validasi Cuti Sakit: Wajib lampiran & batas 3 hari setelah mulai sakit
    if (leaveType.nama_cuti === 'Cuti Sakit') {
      if (!lampiran_url && leaveType.wajib_lampiran) {
        return NextResponse.json(
          { error: 'Cuti Sakit wajib melampirkan surat keterangan dokter.' },
          { status: 400 }
        );
      }
      if (diffDays < -leaveType.maksimal_h_setelah_sakit) {
        return NextResponse.json(
          { error: `Cuti Sakit maksimal diajukan ${leaveType.maksimal_h_setelah_sakit} hari setelah mulai sakit.` },
          { status: 400 }
        );
      }
    }

    // 7. Cek Blackout Period
    const blackoutRes = await query(
      `SELECT * FROM blackout_periods 
       WHERE (divisi_id IS NULL OR divisi_id = $1)
         AND (tanggal_mulai <= $2 AND tanggal_selesai >= $3)`,
      [currentUser.divisi_id, tanggal_selesai, tanggal_mulai]
    );
    if (blackoutRes.rows.length > 0) {
      const bo = blackoutRes.rows[0];
      return NextResponse.json(
        { error: `Pengajuan berada dalam periode blackout (${bo.nama_periode}: ${bo.keterangan || 'Tutup buku'}). Cuti tidak dapat diajukan.` },
        { status: 400 }
      );
    }

    // 8. Cek Overlap dengan cuti yang sudah disetujui / pending
    const overlapRes = await query(
      `SELECT id, nomor_pengajuan, tanggal_mulai, tanggal_selesai 
       FROM leave_requests 
       WHERE user_id = $1 
         AND status IN ('Pending', 'Approved by Leader', 'Approved')
         AND (tanggal_mulai <= $2 AND tanggal_selesai >= $3)`,
      [decoded.id, tanggal_selesai, tanggal_mulai]
    );
    if (overlapRes.rows.length > 0) {
      return NextResponse.json(
        { error: `Tanggal cuti bentrok dengan pengajuan Anda nomor ${overlapRes.rows[0].nomor_pengajuan}.` },
        { status: 400 }
      );
    }

    // 9. Generate nomor pengajuan: CUTI-YYYYMM-XXXX
    const now = new Date();
    const ym = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const countRes = await query(
      `SELECT COUNT(*) as cnt FROM leave_requests WHERE nomor_pengajuan LIKE $1`,
      [`CUTI-${ym}-%`]
    );
    const seq = parseInt(countRes.rows[0].cnt, 10) + 1;
    const nomorPengajuan = `CUTI-${ym}-${String(seq).padStart(3, '0')}`;

    // 10. Jalankan Transaksi SQL
    const newRequest = await transaction(async (client) => {
      // Potong kuota cuti tahunan jika jenis cuti memotong kuota utama
      if (leaveType.potong_kuota_utama) {
        await client.query(
          `UPDATE users 
           SET sisa_kuota_tahunan = sisa_kuota_tahunan - $1,
               kuota_terpakai = kuota_terpakai + $1,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $2`,
          [totalHari, decoded.id]
        );
      }

      // Tentukan alur:
      // Jika Ketua Divisi mengajukan, status tetap 'Pending' tapi diarahkan langsung ke HRD
      const insertRes = await client.query(
        `INSERT INTO leave_requests (
           nomor_pengajuan, user_id, leave_type_id, is_half_day, 
           tanggal_pengajuan, tanggal_mulai, tanggal_selesai, total_hari, 
           alasan, handover_user_id, catatan_handover, alamat_selama_cuti, 
           nomor_darurat, lampiran_url, status
         ) VALUES ($1, $2, $3, $4, CURRENT_DATE, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'Pending')
         RETURNING *`,
        [
          nomorPengajuan,
          decoded.id,
          leave_type_id,
          is_half_day || false,
          tanggal_mulai,
          tanggal_selesai,
          totalHari,
          alasan,
          handover_user_id || null,
          catatan_handover || null,
          alamat_selama_cuti || null,
          nomor_darurat || null,
          lampiran_url || null,
        ]
      );

      // Notifikasi ke rekan pengganti (handover)
      if (handover_user_id) {
        await client.query(
          `INSERT INTO notifications (user_id, judul, pesan, tipe, tautan)
           VALUES ($1, 'Delegasi Tugas Cuti', $2, 'info', '/karyawan/riwayat')`,
          [
            handover_user_id,
            `${currentUser.nama_lengkap} menunjuk Anda sebagai rekan pengganti (handover) untuk cuti tanggal ${tanggal_mulai}.`,
          ]
        );
      }

      // Notifikasi ke Approver:
      // Jika role === 'Ketua Divisi', notifikasi ke HRD
      // Jika role === 'Karyawan', notifikasi ke Ketua Divisi
      if (currentUser.role === 'Ketua Divisi') {
        const hrdList = await client.query(`SELECT id FROM users WHERE role = 'HRD' AND status_aktif = TRUE`);
        for (const hrd of hrdList.rows) {
          await client.query(
            `INSERT INTO notifications (user_id, judul, pesan, tipe, tautan)
             VALUES ($1, 'Pengajuan Cuti Ketua Divisi', $2, 'info', '/hrd/persetujuan')`,
            [
              hrd.id,
              `${currentUser.nama_lengkap} (Ketua Divisi) mengajukan permohonan cuti baru nomor ${nomorPengajuan}.`,
            ]
          );
        }
      } else if (currentUser.ketua_id) {
        await client.query(
          `INSERT INTO notifications (user_id, judul, pesan, tipe, tautan)
           VALUES ($1, 'Permohonan Cuti Masuk', $2, 'info', '/ketua/verifikasi')`,
          [
            currentUser.ketua_id,
            `${currentUser.nama_lengkap} mengajukan permohonan cuti baru nomor ${nomorPengajuan}.`,
          ]
        );
      }

      return insertRes.rows[0];
    });

    return NextResponse.json({
      message: 'Pengajuan cuti berhasil dikirim.',
      request: newRequest,
    });
  } catch (err) {
    console.error('Error submitting leave request:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Batal pengajuan cuti (Hanya jika status 'Pending')
export async function PUT(request) {
  try {
    const token = request.cookies.get(TOKEN_NAME)?.value;
    if (!token) return NextResponse.json({ error: 'Belum terautentikasi' }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: 'Sesi kedaluwarsa' }, { status: 401 });

    const body = await request.json();
    const { request_id, alasan_pembatalan } = body;

    if (!request_id || !alasan_pembatalan) {
      return NextResponse.json(
        { error: 'ID pengajuan dan alasan pembatalan wajib diisi.' },
        { status: 400 }
      );
    }

    // Ambil data pengajuan
    const reqRes = await query(
      `SELECT r.*, lt.potong_kuota_utama 
       FROM leave_requests r
       JOIN leave_types lt ON r.leave_type_id = lt.id
       WHERE r.id = $1 AND r.user_id = $2`,
      [request_id, decoded.id]
    );

    if (reqRes.rows.length === 0) {
      return NextResponse.json({ error: 'Data pengajuan cuti tidak ditemukan.' }, { status: 404 });
    }

    const leaveReq = reqRes.rows[0];

    if (leaveReq.status !== 'Pending') {
      return NextResponse.json(
        { error: 'Hanya pengajuan berstatus Pending yang dapat dibatalkan.' },
        { status: 400 }
      );
    }

    // Kembalikan kuota secara transaksional
    await transaction(async (client) => {
      if (leaveReq.potong_kuota_utama) {
        await client.query(
          `UPDATE users 
           SET sisa_kuota_tahunan = sisa_kuota_tahunan + $1,
               kuota_terpakai = kuota_terpakai - $1,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $2`,
          [leaveReq.total_hari, decoded.id]
        );
      }

      await client.query(
        `UPDATE leave_requests 
         SET status = 'Cancelled',
             alasan_pembatalan = $1,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [alasan_pembatalan, request_id]
      );
    });

    return NextResponse.json({ message: 'Pengajuan cuti berhasil dibatalkan. Kuota telah dikembalikan.' });
  } catch (err) {
    console.error('Error cancelling leave request:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
