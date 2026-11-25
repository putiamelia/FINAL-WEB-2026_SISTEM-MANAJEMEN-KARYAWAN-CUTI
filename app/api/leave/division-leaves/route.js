import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken, TOKEN_NAME } from '@/lib/auth';

function toDateString(val) {
  if (!val) return '';
  if (typeof val === 'string') return val.slice(0, 10);
  if (val instanceof Date) {
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const d = String(val.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return String(val).slice(0, 10);
}

export async function GET(request) {
  try {
    const token = request.cookies.get(TOKEN_NAME)?.value;
    if (!token) return NextResponse.json({ error: 'Belum terautentikasi' }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded || (decoded.role !== 'Ketua Divisi' && decoded.role !== 'Admin' && decoded.role !== 'HRD')) {
      return NextResponse.json({ error: 'Akses ditolak. Khusus Ketua Divisi, HRD, dan Admin.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const requestedDivId = searchParams.get('divisi_id');

    // 1. Dapatkan divisi pengguna
    let divisionId = null;
    let ketuaName = decoded.nama_lengkap;

    const userRes = await query(
      `SELECT u.id, u.divisi_id, u.role, u.nama_lengkap, d.nama_divisi, d.deskripsi as deskripsi_divisi
       FROM users u
       LEFT JOIN divisions d ON u.divisi_id = d.id
       WHERE u.id = $1`,
      [decoded.id]
    );

    if (userRes.rows.length > 0) {
      ketuaName = userRes.rows[0].nama_lengkap;
      divisionId = userRes.rows[0].divisi_id;
    }

    // Jika Admin/HRD dan menyediakan query parameter divisi_id, gunakan itu
    if ((decoded.role === 'Admin' || decoded.role === 'HRD') && requestedDivId) {
      divisionId = parseInt(requestedDivId, 10);
    }

    if (!divisionId) {
      return NextResponse.json({ error: 'Divisi tidak ditemukan untuk pengguna ini.' }, { status: 404 });
    }

    // 2. Ambil informasi divisi
    const divRes = await query(
      `SELECT d.id, d.nama_divisi, d.deskripsi, d.ketua_id, u.nama_lengkap as nama_ketua
       FROM divisions d
       LEFT JOIN users u ON d.ketua_id = u.id
       WHERE d.id = $1`,
      [divisionId]
    );
    const division = divRes.rows[0] || { id: divisionId, nama_divisi: 'Divisi' };

    // 3. Ambil seluruh anggota divisi aktif
    const membersRes = await query(
      `SELECT u.id, u.username, u.email, u.nama_lengkap, u.role, u.jabatan,
              u.divisi_id, u.kuota_tahunan_awal, u.sisa_kuota_tahunan, u.kuota_terpakai,
              u.nomor_telepon, u.status_aktif, u.foto_profil, u.tanggal_bergabung
       FROM users u
       WHERE u.divisi_id = $1 AND u.status_aktif = TRUE
       ORDER BY 
         CASE WHEN u.role = 'Ketua Divisi' THEN 0 ELSE 1 END,
         u.nama_lengkap ASC`,
      [divisionId]
    );
    const members = membersRes.rows;

    // 4. Ambil seluruh pengajuan cuti anggota divisi
    const leavesRes = await query(
      `SELECT r.id, r.nomor_pengajuan, r.user_id, u.nama_lengkap, u.email, u.jabatan, u.foto_profil,
              u.sisa_kuota_tahunan, d.nama_divisi, r.leave_type_id, lt.nama_cuti,
              r.is_half_day, r.tanggal_pengajuan, r.tanggal_mulai, r.tanggal_selesai,
              r.total_hari, r.alasan, r.handover_user_id, hu.nama_lengkap as nama_handover,
              r.catatan_handover, r.alamat_selama_cuti, r.nomor_darurat, r.lampiran_url,
              r.status, r.alasan_pembatalan,
              r.leader_approver_id, lu.nama_lengkap as nama_leader, r.leader_approval_date, r.leader_notes,
              r.hrd_approver_id, hrd.nama_lengkap as nama_hrd, r.hrd_approval_date, r.hrd_notes,
              r.created_at
       FROM leave_requests r
       JOIN users u ON r.user_id = u.id
       JOIN divisions d ON u.divisi_id = d.id
       JOIN leave_types lt ON r.leave_type_id = lt.id
       LEFT JOIN users hu ON r.handover_user_id = hu.id
       LEFT JOIN users lu ON r.leader_approver_id = lu.id
       LEFT JOIN users hrd ON r.hrd_approver_id = hrd.id
       WHERE u.divisi_id = $1
       ORDER BY r.tanggal_mulai DESC, r.created_at DESC`,
      [divisionId]
    );

    // Ambil tanggal hari ini dari server database atau JS
    const now = new Date();
    const todayStr = toDateString(now);

    // Hitung status kategori cuti
    const leaves = leavesRes.rows.map((row) => {
      const startStr = toDateString(row.tanggal_mulai);
      const endStr = toDateString(row.tanggal_selesai);

      let leaveCategory = 'RIWAYAT';
      const isApprovedActive = row.status === 'Approved' || row.status === 'Approved by Leader';

      if (row.status === 'Pending') {
        leaveCategory = 'PENDING';
      } else if (row.status === 'Rejected') {
        leaveCategory = 'DITOLAK';
      } else if (row.status === 'Cancelled') {
        leaveCategory = 'DIBATALKAN';
      } else if (isApprovedActive) {
        if (todayStr >= startStr && todayStr <= endStr) {
          leaveCategory = 'SEDANG_CUTI';
        } else if (startStr > todayStr) {
          leaveCategory = 'CUTI_TERJADWAL';
        } else {
          leaveCategory = 'SELESAI';
        }
      }

      return {
        ...row,
        tanggal_mulai_formatted: startStr,
        tanggal_selesai_formatted: endStr,
        kategori_cuti: leaveCategory,
      };
    });

    // 5. Hitung status kehadiran untuk setiap anggota divisi
    const membersWithStatus = members.map((member) => {
      // Cari pengajuan cuti yang sedang aktif hari ini (Approved / Approved by Leader)
      const currentLeave = leaves.find(
        (l) =>
          l.user_id === member.id &&
          (l.status === 'Approved' || l.status === 'Approved by Leader') &&
          l.tanggal_mulai_formatted <= todayStr &&
          todayStr <= l.tanggal_selesai_formatted
      );

      // Cari pengajuan cuti mendatang (Cuti Terjadwal)
      const upcomingLeave = leaves
        .filter(
          (l) =>
            l.user_id === member.id &&
            (l.status === 'Approved' || l.status === 'Approved by Leader') &&
            l.tanggal_mulai_formatted > todayStr
        )
        .sort((a, b) => (a.tanggal_mulai_formatted > b.tanggal_mulai_formatted ? 1 : -1))[0];

      // Cari pengajuan pending jika ada
      const pendingLeave = leaves.find(
        (l) => l.user_id === member.id && l.status === 'Pending'
      );

      let statusKehadiran = 'Hadir / Aktif';
      let relevantLeave = null;

      if (currentLeave) {
        statusKehadiran = 'Sedang Cuti';
        relevantLeave = currentLeave;
      } else if (upcomingLeave) {
        statusKehadiran = 'Cuti Terjadwal';
        relevantLeave = upcomingLeave;
      } else if (pendingLeave) {
        statusKehadiran = 'Menunggu Verifikasi';
        relevantLeave = pendingLeave;
      }

      return {
        ...member,
        status_kehadiran: statusKehadiran,
        active_leave: relevantLeave || null,
        pending_leave: pendingLeave || null,
        upcoming_leave: upcomingLeave || null,
      };
    });

    // 6. Hitung ringkasan statistik
    const totalAnggota = members.length;
    const sedangCuti = membersWithStatus.filter((m) => m.status_kehadiran === 'Sedang Cuti').length;
    const cutiTerjadwal = membersWithStatus.filter((m) => m.status_kehadiran === 'Cuti Terjadwal').length;
    const pendingVerifikasi = leaves.filter((l) => l.status === 'Pending').length;
    const totalApproved = leaves.filter((l) => l.status === 'Approved' || l.status === 'Approved by Leader').length;

    // Tingkat kehadiran
    const totalHadir = totalAnggota - sedangCuti;
    const tingkatKehadiran = totalAnggota > 0 ? Math.round((totalHadir / totalAnggota) * 100) : 100;

    return NextResponse.json({
      division,
      today: todayStr,
      stats: {
        totalAnggota,
        sedangCuti,
        cutiTerjadwal,
        pendingVerifikasi,
        totalApproved,
        tingkatKehadiran,
      },
      members: membersWithStatus,
      leaves,
    });
  } catch (err) {
    console.error('Error fetching division leaves:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
