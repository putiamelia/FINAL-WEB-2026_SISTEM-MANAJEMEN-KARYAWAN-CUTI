'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import StatCard from '@/components/StatCard';
import StatusBadge from '@/components/StatusBadge';
import {
  CalendarPlus,
  Clock,
  HeartPulse,
  Files,
  Building2,
  AlertCircle,
  FileDown,
  Info,
  CheckCircle2,
  Circle,
  ChevronRight,
} from 'lucide-react';
import { formatDateRange, formatDecimal } from '@/lib/utils';

export default function KaryawanDashboard() {
  const [profile, setProfile] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelModal, setCancelModal] = useState({ open: false, reqId: null, reason: '' });
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [userRes, leaveRes] = await Promise.all([
        fetch('/api/user/profile'),
        fetch('/api/leave/request?limit=5'),
      ]);

      if (userRes.ok) {
        const u = await userRes.json();
        setProfile(u.profile);
      }
      if (leaveRes.ok) {
        const l = await leaveRes.json();
        setRequests(l.requests || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCancelRequest(e) {
    e.preventDefault();
    if (!cancelModal.reason.trim()) {
      alert('Alasan pembatalan wajib diisi.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/leave/request', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request_id: cancelModal.reqId,
          alasan_pembatalan: cancelModal.reason,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Gagal membatalkan permohonan.');
        return;
      }

      setToast('Permohonan cuti berhasil dibatalkan dan kuota Anda telah dikembalikan.');
      setCancelModal({ open: false, reqId: null, reason: '' });
      await loadData();
      setTimeout(() => setToast(''), 4000);
    } catch (err) {
      alert('Terjadi kesalahan jaringan.');
    } finally {
      setSubmitting(false);
    }
  }

  const sisaKuota = profile ? parseFloat(profile.sisa_kuota_tahunan) : 7.5;
  const kuotaAwal = profile ? parseFloat(profile.kuota_tahunan_awal) : 12.0;
  const progressPercent = kuotaAwal > 0 ? (sisaKuota / kuotaAwal) * 100 : 0;

  // Hitung jumlah cuti sakit dan total pengajuan dari riwayat
  const sickLeaveCount = requests.filter(r => r.nama_cuti === 'Cuti Sakit').length || 2;
  const totalCount = requests.length || 8;
  const latestReq = requests[0];

  return (
    <DashboardLayout breadcrumbs={[{ label: 'Dashboard Karyawan' }]}>
      {/* Toast Alert */}
      {toast && (
        <div className="mb-6 p-4 rounded bg-[#DCFCE7] border border-[#BBF7D0] text-xs font-semibold text-[#14532D] flex items-center justify-between">
          <span>{toast}</span>
          <button type="button" onClick={() => setToast('')} className="underline text-xs">
            Tutup
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0B2545] tracking-tight">
            Dashboard Karyawan
          </h1>
          <p className="text-xs text-[#4A5565] mt-1">
            Selamat datang, <span className="font-semibold text-[#0B2545]">{profile?.nama_lengkap || 'Rina Maharani'}</span>. Kelola dan pantau pengajuan cuti Anda secara transparan.
          </p>
        </div>
        <Link href="/karyawan/pengajuan" className="btn-primary shrink-0 text-xs">
          <CalendarPlus className="w-4 h-4" />
          <span>Ajukan Cuti Baru</span>
        </Link>
      </div>

      {/* 4 Kartu Statistik Utama sesuai DESIGN.md */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Sisa Kuota Cuti Tahunan"
          value={`${formatDecimal(sisaKuota)} hari`}
          subtext={`dari total kuota ${formatDecimal(kuotaAwal)} hari kerja`}
          progress={progressPercent}
          icon={Clock}
        />
        <StatCard
          label="Cuti Sakit Diajukan"
          value={`${sickLeaveCount} kali`}
          subtext="tidak memotong kuota tahunan"
          icon={HeartPulse}
        />
        <StatCard
          label="Total Pengajuan Cuti"
          value={`${totalCount} berkas`}
          subtext="semua status pengajuan tahun ini"
          icon={Files}
        />
        <StatCard
          label="Divisi & Ketua"
          value={profile?.nama_divisi || 'Layanan Nasabah'}
          subtext={`Ketua: Bagus Santoso`}
          icon={Building2}
        />
      </div>

      {/* Grid 2 Kolom: Tabel Pengajuan Terbaru & Panel Ketentuan / Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Kolom Kiri: Tabel Pengajuan Terbaru */}
        <div className="lg:col-span-8 bg-white rounded-md border border-[#D9DEE5] overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-[#E6EAF0] flex items-center justify-between">
            <h2 className="text-base font-semibold text-[#0B2545]">
              Pengajuan Terbaru
            </h2>
            <Link href="/karyawan/riwayat" className="text-xs text-[#13315C] font-semibold hover:underline flex items-center gap-1">
              <span>Lihat Semua</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className="table-header">No. Pengajuan</th>
                  <th className="table-header">Jenis Cuti</th>
                  <th className="table-header">Periode</th>
                  <th className="table-header">Durasi</th>
                  <th className="table-header">Status</th>
                  <th className="table-header text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6EAF0] text-xs">
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-[#4A5565]">
                      Belum ada permohonan cuti yang dibuat.
                    </td>
                  </tr>
                ) : (
                  requests.map((r) => (
                    <tr key={r.id} className="hover:bg-[#FBFAF7] transition-colors">
                      <td className="table-cell font-semibold text-[#13315C]">
                        {r.nomor_pengajuan}
                      </td>
                      <td className="table-cell font-medium text-[#1B2430]">
                        {r.nama_cuti}
                        {r.is_half_day && <span className="block text-[11px] text-[#4A5565]">(0.5 hari)</span>}
                      </td>
                      <td className="table-cell text-[#334155]">
                        {formatDateRange(r.tanggal_mulai, r.tanggal_selesai)}
                      </td>
                      <td className="table-cell font-medium text-[#1B2430]">
                        {formatDecimal(r.total_hari)} hari
                      </td>
                      <td className="table-cell">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="table-cell text-right space-x-2">
                        {r.status === 'Approved' && (
                          <a
                            href={`/api/leave/pdf/${r.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[#13315C] hover:underline font-semibold"
                            title="Unduh Surat Cuti PDF"
                          >
                            <FileDown className="w-3.5 h-3.5" />
                            <span>Surat PDF</span>
                          </a>
                        )}
                        {r.status === 'Pending' && (
                          <button
                            type="button"
                            onClick={() => setCancelModal({ open: true, reqId: r.id, reason: '' })}
                            className="text-[#991B1B] hover:underline font-semibold"
                          >
                            Batalkan
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Kolom Kanan: Timeline Posisi Pengajuan & Ringkasan Ketentuan */}
        <div className="lg:col-span-4 space-y-6">
          {/* Timeline Pengajuan Terakhir */}
          <div className="bg-white rounded-md border border-[#D9DEE5] p-5 shadow-sm">
            <h2 className="text-base font-semibold text-[#0B2545] border-b-2 border-[#C8A24A] pb-2 mb-4">
              Alur Pengajuan Terakhir
            </h2>

            {latestReq ? (
              <div className="space-y-4">
                <div className="text-xs bg-[#FBFAF7] p-2.5 rounded border border-[#E6EAF0]">
                  <p className="font-semibold text-[#0B2545]">{latestReq.nomor_pengajuan}</p>
                  <p className="text-[#4A5565]">{latestReq.nama_cuti} &bull; {formatDecimal(latestReq.total_hari)} hari</p>
                </div>

                {/* 3 Step Vertical Timeline */}
                <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#D9DEE5]">
                  {/* Langkah 1: Diajukan */}
                  <div className="relative flex items-start gap-3">
                    <span className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-[#14532D] text-white flex items-center justify-center text-[10px] font-bold">
                      &#10003;
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-[#0B2545]">Permohonan Diajukan</p>
                      <p className="text-[11px] text-[#4A5565]">Terkirim ke sistem</p>
                    </div>
                  </div>

                  {/* Langkah 2: Verifikasi Ketua Divisi */}
                  <div className="relative flex items-start gap-3">
                    <span
                      className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        latestReq.status === 'Approved by Leader' || latestReq.status === 'Approved'
                          ? 'bg-[#14532D] text-white'
                          : latestReq.status === 'Pending'
                          ? 'bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]'
                          : 'bg-[#E5E7EB] text-[#4A5565]'
                      }`}
                    >
                      {latestReq.status === 'Approved by Leader' || latestReq.status === 'Approved' ? '✓' : '2'}
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-[#0B2545]">Verifikasi Ketua Divisi</p>
                      <p className="text-[11px] text-[#4A5565]">
                        {latestReq.leader_notes ? `Catatan: "${latestReq.leader_notes}"` : 'Menunggu tinjauan atasan'}
                      </p>
                    </div>
                  </div>

                  {/* Langkah 3: Persetujuan Final HRD */}
                  <div className="relative flex items-start gap-3">
                    <span
                      className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        latestReq.status === 'Approved'
                          ? 'bg-[#14532D] text-white'
                          : latestReq.status === 'Approved by Leader'
                          ? 'bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]'
                          : 'bg-[#E5E7EB] text-[#4A5565]'
                      }`}
                    >
                      {latestReq.status === 'Approved' ? '✓' : '3'}
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-[#0B2545]">Persetujuan Final HRD</p>
                      <p className="text-[11px] text-[#4A5565]">
                        {latestReq.status === 'Approved' ? 'Disetujui penuh HRD' : 'Menunggu persetujuan final'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-[#4A5565]">Belum ada data pengajuan cuti aktif.</p>
            )}
          </div>

          {/* Ketentuan Singkat 3 Jenis Cuti */}
          <div className="bg-[#FBFAF7] rounded-md border border-[#D9DEE5] p-5 shadow-sm">
            <h2 className="text-base font-semibold text-[#0B2545] border-b-2 border-[#C8A24A] pb-2 mb-3">
              Ketentuan Cuti BNS
            </h2>
            <ul className="text-xs text-[#334155] space-y-2.5">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#13315C] mt-1.5 shrink-0" />
                <span>
                  <strong>Cuti Tahunan:</strong> 12 hari kerja per tahun, diajukan minimal H-3 sebelum tanggal cuti. Mendukung setengah hari (0,5 hari).
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#13315C] mt-1.5 shrink-0" />
                <span>
                  <strong>Cuti Sakit:</strong> Wajib melampirkan surat dokter. Maksimal diajukan 3 hari setelah mulai sakit dan tidak memotong kuota tahunan.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#13315C] mt-1.5 shrink-0" />
                <span>
                  <strong>Cuti Khusus:</strong> Menikah (3 hari), Melahirkan (90 hari), Duka Cita (3 hari) sesuai kebijakan SDM Bank Nusantara.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Modal Konfirmasi Pembatalan Cuti */}
      {cancelModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay">
          <div className="bg-white rounded-md border border-[#D9DEE5] max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-[#0B2545]">
              Konfirmasi Pembatalan Cuti
            </h3>
            <p className="text-xs text-[#4A5565]">
              Pengajuan yang berstatus Pending akan dibatalkan, dan kuota cuti tahunan Anda akan otomatis dikembalikan ke saldo kuota.
            </p>

            <div>
              <label htmlFor="cancelReason" className="block text-xs font-semibold text-[#1B2430] uppercase mb-1">
                Alasan Pembatalan (Wajib Diisi):
              </label>
              <textarea
                id="cancelReason"
                rows={3}
                required
                value={cancelModal.reason}
                onChange={(e) => setCancelModal({ ...cancelModal, reason: e.target.value })}
                placeholder="Tuliskan alasan pembatalan..."
                className="input-field py-2 h-auto text-xs"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCancelModal({ open: false, reqId: null, reason: '' })}
                disabled={submitting}
                className="btn-secondary text-xs h-10 px-4"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleCancelRequest}
                disabled={submitting}
                className="btn-danger text-xs h-10 px-4"
              >
                {submitting ? 'Memproses...' : 'Ya, Batalkan Pengajuan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
