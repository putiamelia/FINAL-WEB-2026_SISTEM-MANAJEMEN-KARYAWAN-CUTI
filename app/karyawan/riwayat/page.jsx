'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import StatusBadge from '@/components/StatusBadge';
import {
  History,
  FileDown,
  Filter,
  Eye,
  X,
  AlertCircle,
  Calendar,
  User,
  Clock,
} from 'lucide-react';
import { formatDateRange, formatDecimal, formatDateIndo } from '@/lib/utils';

export default function RiwayatPengajuanPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('Semua');
  const [detailModal, setDetailModal] = useState(null);
  const [cancelModal, setCancelModal] = useState({ open: false, reqId: null, reason: '' });
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  async function fetchRequests() {
    try {
      setLoading(true);
      const url = `/api/leave/request?status=${encodeURIComponent(statusFilter)}&limit=100`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel(e) {
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

      setToast('Permohonan cuti berhasil dibatalkan dan kuota telah dikembalikan.');
      setCancelModal({ open: false, reqId: null, reason: '' });
      await fetchRequests();
      setTimeout(() => setToast(''), 4000);
    } catch (err) {
      alert('Terjadi kesalahan jaringan.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <DashboardLayout
      breadcrumbs={[
        { href: '/karyawan/dashboard', label: 'Dashboard' },
        { label: 'Riwayat Pengajuan Cuti' },
      ]}
    >
      {/* Toast Alert */}
      {toast && (
        <div className="mb-6 p-4 rounded bg-[#DCFCE7] border border-[#BBF7D0] text-xs font-semibold text-[#14532D] flex items-center justify-between">
          <span>{toast}</span>
          <button type="button" onClick={() => setToast('')} className="underline text-xs">
            Tutup
          </button>
        </div>
      )}

      {/* Header & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0B2545] tracking-tight">
            Riwayat Pengajuan Cuti
          </h1>
          <p className="text-xs text-[#4A5565] mt-1">
            Daftar lengkap seluruh berkas permohonan cuti yang telah Anda ajukan.
          </p>
        </div>

        {/* Filter Dropdown */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#4A5565] shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field !w-44 text-xs !h-9"
          >
            <option value="Semua">Semua Status</option>
            <option value="Pending">Pending</option>
            <option value="Approved by Leader">Approved by Leader</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Tabel Riwayat */}
      <div className="bg-white rounded-md border border-[#D9DEE5] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left border-collapse">
            <thead>
              <tr>
                <th className="table-header">Nomor Pengajuan</th>
                <th className="table-header">Jenis Cuti</th>
                <th className="table-header">Periode Cuti</th>
                <th className="table-header">Durasi</th>
                <th className="table-header">Tanggal Pengajuan</th>
                <th className="table-header">Status</th>
                <th className="table-header text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6EAF0] text-xs">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[#4A5565]">
                    Memuat data riwayat pengajuan cuti...
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[#4A5565]">
                    Tidak ada permohonan cuti yang sesuai dengan filter.
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
                    <td className="table-cell text-[#4A5565]">
                      {formatDateIndo(r.tanggal_pengajuan)}
                    </td>
                    <td className="table-cell">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="table-cell text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => setDetailModal(r)}
                        className="inline-flex items-center gap-1 text-[#13315C] hover:underline font-semibold"
                        title="Lihat Rincian Pengajuan"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Detail</span>
                      </button>

                      {r.status === 'Approved' && (
                        <a
                          href={`/api/leave/pdf/${r.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[#14532D] hover:underline font-semibold ml-2"
                          title="Unduh Berkas Surat Cuti Resmi"
                        >
                          <FileDown className="w-3.5 h-3.5" />
                          <span>Surat PDF</span>
                        </a>
                      )}

                      {r.status === 'Pending' && (
                        <button
                          type="button"
                          onClick={() => setCancelModal({ open: true, reqId: r.id, reason: '' })}
                          className="text-[#991B1B] hover:underline font-semibold ml-2"
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

      {/* Modal Detail Rincian Cuti */}
      {detailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay">
          <div className="bg-white rounded-md border border-[#D9DEE5] max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E6EAF0]">
              <div>
                <h3 className="text-base font-bold text-[#0B2545]">
                  Detail Permohonan Cuti
                </h3>
                <p className="text-xs text-[#4A5565] font-mono">{detailModal.nomor_pengajuan}</p>
              </div>
              <button
                type="button"
                onClick={() => setDetailModal(null)}
                className="p-1 rounded text-[#4A5565] hover:text-[#1B2430]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs space-y-3">
              <div className="flex justify-between items-center p-2.5 bg-[#FBFAF7] rounded border border-[#E6EAF0]">
                <span className="font-semibold text-[#0B2545]">Status Saat Ini:</span>
                <StatusBadge status={detailModal.status} />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-[#4A5565]">Jenis Cuti:</span>
                  <span className="font-semibold text-[#1B2430]">{detailModal.nama_cuti}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#4A5565]">Periode:</span>
                  <span className="font-semibold text-[#1B2430]">
                    {formatDateRange(detailModal.tanggal_mulai, detailModal.tanggal_selesai)} ({formatDecimal(detailModal.total_hari)} hari)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#4A5565]">Rekan Handover:</span>
                  <span className="text-[#1B2430]">{detailModal.nama_handover || '-'}</span>
                </div>
                {detailModal.catatan_handover && (
                  <div className="flex justify-between">
                    <span className="text-[#4A5565]">Catatan Handover:</span>
                    <span className="text-[#1B2430] text-right">{detailModal.catatan_handover}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-[#4A5565]">Nomor Darurat:</span>
                  <span className="text-[#1B2430]">{detailModal.nomor_darurat || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#4A5565]">Alamat Cuti:</span>
                  <span className="text-[#1B2430] text-right">{detailModal.alamat_selama_cuti || '-'}</span>
                </div>
                {detailModal.lampiran_url && (
                  <div className="flex justify-between">
                    <span className="text-[#4A5565]">Lampiran / Surat Dokter:</span>
                    <span className="text-[#13315C] font-semibold">{detailModal.lampiran_url}</span>
                  </div>
                )}
              </div>

              {/* Catatan Verifikasi Atasan & HRD */}
              {detailModal.leader_notes && (
                <div className="p-3 bg-[#EEF1F5] rounded text-[11px] space-y-1">
                  <p className="font-semibold text-[#0B2545]">Catatan Verifikasi Ketua Divisi ({detailModal.nama_leader}):</p>
                  <p className="text-[#334155] italic">"{detailModal.leader_notes}"</p>
                </div>
              )}

              {detailModal.hrd_notes && (
                <div className="p-3 bg-[#EEF1F5] rounded text-[11px] space-y-1">
                  <p className="font-semibold text-[#0B2545]">Catatan Persetujuan HRD ({detailModal.nama_hrd}):</p>
                  <p className="text-[#334155] italic">"{detailModal.hrd_notes}"</p>
                </div>
              )}

              {detailModal.alasan_pembatalan && (
                <div className="p-3 bg-[#FEE2E2] rounded text-[11px] text-[#991B1B] space-y-1">
                  <p className="font-semibold">Alasan Pembatalan:</p>
                  <p className="italic">"{detailModal.alasan_pembatalan}"</p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-[#E6EAF0]">
              <button
                type="button"
                onClick={() => setDetailModal(null)}
                className="btn-secondary text-xs h-9 px-4"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Batal Cuti */}
      {cancelModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay">
          <div className="bg-white rounded-md border border-[#D9DEE5] max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-[#0B2545]">
              Konfirmasi Pembatalan Cuti
            </h3>
            <p className="text-xs text-[#4A5565]">
              Pengajuan ini akan dibatalkan, dan kuota cuti tahunan Anda akan otomatis dikembalikan ke saldo kuota.
            </p>

            <div>
              <label htmlFor="cancelInput" className="block text-xs font-semibold text-[#1B2430] uppercase mb-1">
                Alasan Pembatalan (Wajib):
              </label>
              <textarea
                id="cancelInput"
                rows={3}
                required
                value={cancelModal.reason}
                onChange={(e) => setCancelModal({ ...cancelModal, reason: e.target.value })}
                placeholder="Alasan pembatalan..."
                className="input-field py-2 h-auto text-xs"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCancelModal({ open: false, reqId: null, reason: '' })}
                disabled={submitting}
                className="btn-secondary text-xs h-9 px-4"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={submitting}
                className="btn-danger text-xs h-9 px-4"
              >
                {submitting ? 'Memproses...' : 'Ya, Batalkan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
