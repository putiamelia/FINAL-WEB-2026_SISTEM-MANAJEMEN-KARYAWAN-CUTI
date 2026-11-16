import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken, TOKEN_NAME } from '@/lib/auth';
import { jsPDF } from 'jspdf';
import { formatDateIndo } from '@/lib/utils';

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const token = request.cookies.get(TOKEN_NAME)?.value;
    if (!token) return NextResponse.json({ error: 'Belum terautentikasi' }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: 'Sesi kedaluwarsa' }, { status: 401 });

    const sql = `
      SELECT r.*, u.nama_lengkap, u.username, u.jabatan, u.email, d.nama_divisi,
             lt.nama_cuti,
             hu.nama_lengkap as nama_handover,
             lu.nama_lengkap as nama_leader,
             hrd.nama_lengkap as nama_hrd
      FROM leave_requests r
      JOIN users u ON r.user_id = u.id
      LEFT JOIN divisions d ON u.divisi_id = d.id
      JOIN leave_types lt ON r.leave_type_id = lt.id
      LEFT JOIN users hu ON r.handover_user_id = hu.id
      LEFT JOIN users lu ON r.leader_approver_id = lu.id
      LEFT JOIN users hrd ON r.hrd_approver_id = hrd.id
      WHERE r.id = $1
    `;

    const res = await query(sql, [id]);
    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Data pengajuan tidak ditemukan' }, { status: 404 });
    }

    const cuti = res.rows[0];

    // Cek izin akses: pemilik cuti, Ketua Divisi, HRD, atau Admin
    if (
      cuti.user_id !== decoded.id &&
      decoded.role !== 'HRD' &&
      decoded.role !== 'Admin' &&
      decoded.role !== 'Ketua Divisi'
    ) {
      return NextResponse.json({ error: 'Anda tidak memiliki hak akses untuk dokumen ini' }, { status: 403 });
    }

    // Inisialisasi dokumen PDF
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // 1. KOP SURAT
    doc.setFillColor(11, 37, 69); // #0B2545
    doc.rect(0, 0, 210, 8, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(11, 37, 69);
    doc.text('PT BANK NUSANTARA TBK', 20, 24);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(74, 85, 101);
    doc.text('Kantor Pusat: Gedung Bank Nusantara, Jl. Jend. Sudirman Kav. 21, Jakarta 12190', 20, 30);
    doc.text('Telepon: (021) 555-8899 | Website: www.banknusantara.co.id', 20, 35);

    // Garis Kop Surat
    doc.setDrawColor(200, 162, 74); // #C8A24A Gold line
    doc.setLineWidth(1.2);
    doc.line(20, 38, 190, 38);

    doc.setDrawColor(11, 37, 69); // Navy thin line
    doc.setLineWidth(0.3);
    doc.line(20, 40, 190, 40);

    // 2. JUDUL SURAT
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(11, 37, 69);
    doc.text('SURAT KETERANGAN PERSETUJUAN CUTI', 105, 52, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(74, 85, 101);
    doc.text(`Nomor: BNS/HRD/CUTI/${cuti.nomor_pengajuan}`, 105, 58, { align: 'center' });

    // 3. PEMBUKA
    doc.setFontSize(10);
    doc.setTextColor(27, 36, 48);
    const pembuka = 'Berdasarkan permohonan yang diajukan oleh pegawai dan hasil verifikasi berjenjang internal Bank Nusantara, dengan ini diterbitkan persetujuan cuti kepada:';
    doc.text(doc.splitTextToSize(pembuka, 170), 20, 70);

    // 4. DATA PEMOHON
    let y = 82;
    const drawRow = (label, value) => {
      doc.setFont('helvetica', 'bold');
      doc.text(label, 25, y);
      doc.setFont('helvetica', 'normal');
      doc.text(`: ${value || '-'}`, 75, y);
      y += 7;
    };

    drawRow('Nama Pegawai', cuti.nama_lengkap);
    drawRow('NIP / Username', cuti.username);
    drawRow('Jabatan', cuti.jabatan);
    drawRow('Divisi / Unit Kerja', cuti.nama_divisi);
    drawRow('Jenis Cuti', cuti.nama_cuti + (cuti.is_half_day ? ' (Setengah Hari)' : ''));
    drawRow('Tanggal Pelaksanaan', `${formatDateIndo(cuti.tanggal_mulai)} s.d. ${formatDateIndo(cuti.tanggal_selesai)}`);
    drawRow('Durasi Cuti', `${cuti.total_hari} hari kerja`);
    drawRow('Alasan Cuti', cuti.alasan);
    drawRow('Rekan Serah Tugas', cuti.nama_handover || 'Dikoordinasikan oleh Tim');
    if (cuti.catatan_handover) {
      drawRow('Catatan Handover', cuti.catatan_handover);
    }
    drawRow('Alamat Selama Cuti', cuti.alamat_selama_cuti || '-');
    drawRow('Nomor Kontak Darurat', cuti.nomor_darurat || '-');

    y += 5;

    // 5. STATUS KELAYAKAN
    doc.setFillColor(241, 243, 246);
    doc.roundedRect(20, y, 170, 16, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(11, 37, 69);
    doc.text(`STATUS VERIFIKASI: ${cuti.status.toUpperCase()}`, 25, y + 6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(74, 85, 101);
    doc.text('Pengajuan cuti ini telah memenuhi regulasi ketenagakerjaan dan kebijakan internal Bank Nusantara.', 25, y + 11);

    y += 28;

    // 6. TANDA TANGAN BERJENJANG
    const signDate = formatDateIndo(cuti.hrd_approval_date || cuti.tanggal_pengajuan);
    doc.setFontSize(10);
    doc.setTextColor(27, 36, 48);
    doc.text(`Jakarta, ${signDate}`, 130, y);

    y += 8;

    // Kolom Kiri: Atasan / Ketua Divisi
    doc.setFont('helvetica', 'normal');
    doc.text('Mengetahui / Menyetujui,', 25, y);
    doc.setFont('helvetica', 'bold');
    doc.text('Ketua Divisi', 25, y + 5);

    doc.setDrawColor(200, 200, 200);
    doc.roundedRect(25, y + 8, 50, 18, 1, 1);
    doc.setFontSize(8);
    doc.setTextColor(20, 83, 45); // Dark green
    doc.text('[ VERIFIED DIGITAL ]', 28, y + 15);
    doc.text(cuti.nama_leader || 'Atasan Langsung', 28, y + 21);

    doc.setFontSize(10);
    doc.setTextColor(27, 36, 48);
    doc.text(`(${cuti.nama_leader || 'Ketua Divisi'})`, 25, y + 33);

    // Kolom Kanan: HRD Manager
    doc.setFont('helvetica', 'normal');
    doc.text('Persetujuan Final,', 130, y);
    doc.setFont('helvetica', 'bold');
    doc.text('Human Resources Division', 130, y + 5);

    doc.roundedRect(130, y + 8, 50, 18, 1, 1);
    doc.setFontSize(8);
    doc.setTextColor(20, 83, 45);
    doc.text('[ APPROVED DIGITAL ]', 133, y + 15);
    doc.text(cuti.nama_hrd || 'HRD Manager', 133, y + 21);

    doc.setFontSize(10);
    doc.setTextColor(27, 36, 48);
    doc.text(`(${cuti.nama_hrd || 'Maya Kusuma'})`, 130, y + 33);

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      'Dokumen ini dicetak otomatis oleh Sistem Manajemen e-Cuti Bank Nusantara dan sah tanpa tanda tangan basah.',
      105,
      285,
      { align: 'center' }
    );

    const pdfOutput = doc.output('arraybuffer');

    return new NextResponse(pdfOutput, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Surat_Cuti_${cuti.nomor_pengajuan}.pdf"`,
      },
    });
  } catch (err) {
    console.error('Error generating PDF:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
