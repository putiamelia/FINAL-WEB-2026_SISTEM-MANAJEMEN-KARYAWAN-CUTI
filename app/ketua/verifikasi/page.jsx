'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import ApprovalModal from '@/components/ApprovalModal';
import { CheckSquare, CheckCircle, XCircle, Clock, User, Calendar, AlertCircle } from 'lucide-react';
import { formatDateRange, formatDecimal, formatDateIndo, getAvatarUrl } from '@/lib/utils';

export default function VerifikasiKetuaPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalState, setModalState] = useState({ open: false, action: 'APPROVE', item: null });
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    fetchList();
  }, []);

  async function fetchList() {
    try {
      setLoading(true);
      const res = await fetch('/api/leave/verify');
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

  async function handleConfirmAction(notes) {
    if (!modalState.item) return;

    try {
      setSubmitting(true);
      const res = await fetch('/api/leave/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request_id: modalState.item.id,
          action: modalState.action,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Gagal memproses permohonan.');
        setSubmitting(false);
        return;
      }

      setToast(data.message);
      setModalState({ open: false, action: 'APPROVE', item: null });
      await fetchList();
      setTimeout(() => setToast(''), 4000);
    } catch (err) {
      alert('Terjadi kesalahan koneksi.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <DashboardLayout
      breadcrumbs={[
        { href: '/ketua/dashboard', label: 'Dashboard' },
        { label: 'Verifikasi Pengajuan Cuti' },
      ]}
    >
      {toast && (
        <div className="mb-6 p-4 rounded bg-[#DCFCE7] border border-[#BBF7D0] text-xs font-semibold text-[#14532D] flex items-center justify-between">
          <span>{toast}</span>
          <button type="button" onClick={() => setToast('')} className="underline text-xs">
            Tutup
          </button>
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0B2545] tracking-tight">
          Verifikasi Pengajuan Cuti Anggota Divisi
        </h1>
        <p className="text-xs text-[#4A5565] mt-1">
          Tinjau permohonan cuti dari anggota tim Anda. Persetujuan Anda akan meneruskan berkas ke HRD untuk persetujuan final.
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-[#4A5565] bg-white rounded border border-[#D9DEE5]">
          Memuat berkas verifikasi masuk...
        </div>
      ) : requests.length === 0 ? (
        <div className="p-12 text-center text-xs text-[#4A5565] bg-white rounded border border-[#D9DEE5]">
          <CheckCircle className="w-10 h-10 text-[#14532D] mx-auto mb-2 opacity-80" />
          <p className="font-semibold text-sm text-[#0B2545]">Semua Pengajuan Telah Diverifikasi</p>
          <p className="mt-1">Tidak ada antrean permohonan cuti yang berstatus Pending saat ini.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {requests.map((r) => (
            <div
              key={r.id}
              className="bg-white rounded-md border border-[#D9DEE5] p-6 shadow-sm flex flex-col justify-between"
            >
              <div>
                {/* Header Kartu: Foto, Nama & Jenis Cuti */}
                <div className="flex items-start justify-between pb-4 border-b border-[#E6EAF0]">
                  <div className="flex items-center gap-3">
                    <img
                      src={getAvatarUrl(r.foto_profil)}
                      alt={r.nama_lengkap}
                      className="w-12 h-12 rounded-full object-cover border border-[#D9DEE5] bg-[#E2E8F0]"
                    />
                    <div>
                      <h2 className="font-bold text-sm text-[#0B2545]">{r.nama_lengkap}</h2>
                      <p className="text-xs text-[#4A5565]">{r.jabatan || 'Staff'}</p>
                      <p className="text-[11px] font-mono text-[#13315C] mt-0.5">{r.nomor_pengajuan}</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 text-xs font-semibold rounded bg-[#FEF3C7] text-[#92400E]">
                    {r.nama_cuti} {r.is_half_day ? '(0.5 hari)' : ''}
                  </span>
                </div>

                {/* Detail Pengajuan */}
                <div className="py-4 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#4A5565]">Periode Cuti:</span>
                    <span className="font-semibold text-[#1B2430]">
                      {formatDateRange(r.tanggal_mulai, r.tanggal_selesai)} ({formatDecimal(r.total_hari)} hari)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#4A5565]">Sisa Kuota Tahunan:</span>
                    <span className="font-semibold text-[#13315C]">{formatDecimal(r.sisa_kuota_tahunan)} hari</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#4A5565]">Tanggal Pengajuan:</span>
                    <span className="text-[#1B2430]">{formatDateIndo(r.tanggal_pengajuan)}</span>
                  </div>
                  {r.nama_handover && (
                    <div className="flex justify-between">
                      <span className="text-[#4A5565]">Rekan Pengganti:</span>
                      <span className="text-[#1B2430] font-medium">{r.nama_handover}</span>
                    </div>
                  )}
                  {r.catatan_handover && (
                    <div className="p-2.5 bg-[#FBFAF7] rounded border border-[#E6EAF0] text-[11px] text-[#4A5565] mt-2">
                      <strong className="text-[#0B2545]">Catatan Handover:</strong> {r.catatan_handover}
                    </div>
                  )}

                  <div className="pt-2">
                    <span className="text-[#4A5565] block mb-1">Alasan Pengajuan:</span>
                    <p className="text-xs text-[#1B2430] bg-[#EEF1F5] p-2.5 rounded italic">
                      "{r.alasan}"
                    </p>
                  </div>

                  {r.lampiran_url && (
                    <div className="pt-1 flex items-center gap-1.5 text-xs text-[#13315C]">
                      <span className="font-semibold">Lampiran:</span>
                      <span className="underline">{r.lampiran_url}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Tombol Aksi: Approve / Reject */}
              <div className="pt-4 border-t border-[#E6EAF0] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalState({ open: true, action: 'REJECT', item: r })}
                  className="btn-danger text-xs h-10 px-4"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Tolak (Reject)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModalState({ open: true, action: 'APPROVE', item: r })}
                  className="btn-primary text-xs h-10 px-5"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Setujui & Teruskan ke HRD</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Dialog Approve / Reject */}
      <ApprovalModal
        isOpen={modalState.open}
        action={modalState.action}
        item={modalState.item}
        onClose={() => setModalState({ open: false, action: 'APPROVE', item: null })}
        onConfirm={handleConfirmAction}
        loading={submitting}
        title={
          modalState.action === 'APPROVE'
            ? 'Setujui Pengajuan & Teruskan ke HRD'
            : 'Tolak Pengajuan Cuti Anggota'
        }
      />
    </DashboardLayout>
  );
}
