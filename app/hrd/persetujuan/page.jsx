'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import ApprovalModal from '@/components/ApprovalModal';
import {
  FileCheck,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  User,
  ShieldCheck,
  FileText,
} from 'lucide-react';
import { formatDateRange, formatDecimal, formatDateIndo } from '@/lib/utils';

export default function PersetujuanFinalHrdPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);
  const [modalState, setModalState] = useState({ open: false, action: 'APPROVE', item: null, isBatch: false });
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    fetchList();
  }, []);

  async function fetchList() {
    try {
      setLoading(true);
      const res = await fetch('/api/leave/final-approve');
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
        setSelectedIds([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function toggleSelect(id) {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((x) => x !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  }

  function selectAll() {
    if (selectedIds.length === requests.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(requests.map((r) => r.id));
    }
  }

  async function handleConfirmAction(notes) {
    try {
      setSubmitting(true);
      const ids = modalState.isBatch ? selectedIds : [modalState.item.id];

      const res = await fetch('/api/leave/final-approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request_ids: ids,
          action: modalState.action,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Gagal memproses persetujuan HRD.');
        setSubmitting(false);
        return;
      }

      setToast(data.message);
      setModalState({ open: false, action: 'APPROVE', item: null, isBatch: false });
      setSelectedIds([]);
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
        { href: '/hrd/dashboard', label: 'Dashboard' },
        { label: 'Persetujuan Final HRD' },
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

      {/* Header & Aksi Massal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0B2545] tracking-tight">
            Persetujuan Final Cuti (HRD)
          </h1>
          <p className="text-xs text-[#4A5565] mt-1">
            Daftar permohonan yang telah diverifikasi Ketua Divisi atau diajukan langsung oleh Ketua Divisi.
          </p>
        </div>

        {/* Tombol Batch Approve */}
        {requests.length > 0 && (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={selectAll}
              className="btn-secondary text-xs h-10 px-4"
            >
              {selectedIds.length === requests.length ? 'Batal Pilih Semua' : 'Pilih Semua'}
            </button>
            <button
              type="button"
              disabled={selectedIds.length === 0}
              onClick={() =>
                setModalState({
                  open: true,
                  action: 'APPROVE',
                  item: { nama_lengkap: `${selectedIds.length} Pegawai Terpilih`, nama_cuti: 'Persetujuan Kolektif' },
                  isBatch: true,
                })
              }
              className="btn-primary text-xs h-10 px-5"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Approve Terpilih ({selectedIds.length})</span>
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-[#4A5565] bg-white rounded border border-[#D9DEE5]">
          Memuat antrean persetujuan final...
        </div>
      ) : requests.length === 0 ? (
        <div className="p-12 text-center text-xs text-[#4A5565] bg-white rounded border border-[#D9DEE5]">
          <CheckCircle className="w-10 h-10 text-[#14532D] mx-auto mb-2 opacity-80" />
          <p className="font-semibold text-sm text-[#0B2545]">Antrean Persetujuan Selesai</p>
          <p className="mt-1">Tidak ada berkas yang menunggu persetujuan final HRD saat ini.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {requests.map((r) => {
            const isChecked = selectedIds.includes(r.id);
            const cap = r.capacity_info;
            const hasWarning = cap && cap.is_exceeded;

            return (
              <div
                key={r.id}
                className={`bg-white rounded-md border p-6 shadow-sm flex flex-col justify-between transition-all ${
                  isChecked ? 'border-[#13315C] ring-1 ring-[#13315C]' : 'border-[#D9DEE5]'
                }`}
              >
                <div>
                  {/* Peringatan Batas Kapasitas Divisi jika ada */}
                  {hasWarning && (
                    <div className="mb-4 p-2.5 bg-[#FEF3C7] border border-[#E8C97A] rounded text-[11px] text-[#7A3B0B] flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-[#92400E] shrink-0" />
                      <span>
                        <strong>Peringatan Kapasitas:</strong> {cap.on_leave_count} dari {cap.total_members} anggota ({cap.percentage}%) cuti pada periode ini (Batas: {cap.max_percentage}%).
                      </span>
                    </div>
                  )}

                  {/* Header Kartu: Checkbox, Foto, Nama, Status */}
                  <div className="flex items-start justify-between pb-4 border-b border-[#E6EAF0]">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleSelect(r.id)}
                        className="w-4 h-4 text-[#13315C] rounded border-[#D9DEE5] focus:ring-[#13315C]"
                      />
                      <img
                        src={r.foto_profil || '/assets/foto-karyawati.png'}
                        alt={r.nama_lengkap}
                        className="w-11 h-11 rounded-full object-cover border border-[#D9DEE5]"
                      />
                      <div>
                        <h2 className="font-bold text-sm text-[#0B2545]">{r.nama_lengkap}</h2>
                        <p className="text-xs text-[#4A5565]">
                          {r.jabatan} &bull; {r.nama_divisi || 'Divisi'}
                        </p>
                        <p className="text-[11px] font-mono text-[#13315C] mt-0.5">{r.nomor_pengajuan}</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 text-xs font-semibold rounded bg-[#DBEAFE] text-[#1E3A8A]">
                      {r.user_role === 'Ketua Divisi' ? 'Langsung dari Ketua' : 'Disetujui Ketua'}
                    </span>
                  </div>

                  {/* Detail Rincian Cuti */}
                  <div className="py-4 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-[#4A5565]">Jenis Cuti:</span>
                      <span className="font-semibold text-[#13315C]">
                        {r.nama_cuti} {r.is_half_day ? '(0.5 hari)' : ''}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#4A5565]">Periode & Durasi:</span>
                      <span className="font-semibold text-[#1B2430]">
                        {formatDateRange(r.tanggal_mulai, r.tanggal_selesai)} ({formatDecimal(r.total_hari)} hari)
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#4A5565]">Sisa Kuota Tahunan:</span>
                      <span className="font-semibold text-[#1B2430]">{formatDecimal(r.sisa_kuota_tahunan)} hari</span>
                    </div>
                    {r.nama_handover && (
                      <div className="flex justify-between">
                        <span className="text-[#4A5565]">Rekan Handover:</span>
                        <span className="text-[#1B2430] font-medium">{r.nama_handover}</span>
                      </div>
                    )}
                    <div className="pt-2">
                      <span className="text-[#4A5565] block mb-1">Alasan Cuti:</span>
                      <p className="text-xs text-[#1B2430] bg-[#EEF1F5] p-2 rounded italic">
                        "{r.alasan}"
                      </p>
                    </div>

                    {/* Informasi Persetujuan Atasan (jika bukan pengajuan Ketua Divisi) */}
                    {r.nama_leader && (
                      <div className="p-2.5 bg-[#FBFAF7] rounded border border-[#E6EAF0] text-[11px] space-y-1 mt-2">
                        <p className="font-semibold text-[#0B2545]">
                          Verifikasi Atasan: {r.nama_leader}
                        </p>
                        <p className="text-[#4A5565]">
                          Tanggal: {formatDateIndo(r.leader_approval_date)}
                        </p>
                        {r.leader_notes && (
                          <p className="text-[#334155] italic">
                            Catatan: "{r.leader_notes}"
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Tombol Approve & Reject */}
                <div className="pt-4 border-t border-[#E6EAF0] flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setModalState({ open: true, action: 'REJECT', item: r, isBatch: false })}
                    className="btn-danger text-xs h-10 px-4"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Tolak (Reject)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalState({ open: true, action: 'APPROVE', item: r, isBatch: false })}
                    className="btn-primary text-xs h-10 px-5"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Setujui (Approve)</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Dialog Approve / Reject */}
      <ApprovalModal
        isOpen={modalState.open}
        action={modalState.action}
        item={modalState.item}
        onClose={() => setModalState({ open: false, action: 'APPROVE', item: null, isBatch: false })}
        onConfirm={handleConfirmAction}
        loading={submitting}
        title={
          modalState.isBatch
            ? `Persetujuan Massal (${selectedIds.length} Pengajuan Terpilih)`
            : modalState.action === 'APPROVE'
            ? 'Persetujuan Final HRD'
            : 'Tolak Permohonan Cuti'
        }
      />
    </DashboardLayout>
  );
}
