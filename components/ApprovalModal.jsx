'use client';

import React, { useEffect, useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { formatDateRange, formatDecimal } from '@/lib/utils';

export default function ApprovalModal({
  isOpen,
  onClose,
  onConfirm,
  action = 'APPROVE', // 'APPROVE' or 'REJECT'
  item = null, // leave request data
  title = '',
  loading = false,
}) {
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setNotes('');
    setError('');
  }, [isOpen, item, action]);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !item) return null;

  const isReject = action === 'REJECT';

  function handleSubmit(e) {
    e.preventDefault();
    if (isReject && (!notes || notes.trim() === '')) {
      setError('Catatan wajib diisi saat menolak permohonan cuti.');
      return;
    }
    setError('');
    onConfirm(notes);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay">
      <div className="bg-white rounded-md border border-[#D9DEE5] w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E6EAF0]">
          <h3 className="text-base font-bold text-[#0B2545]">
            {title || (isReject ? 'Tolak Permohonan Cuti' : 'Setujui Permohonan Cuti')}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-[#4A5565] hover:text-[#1B2430] hover:bg-[#F1F3F6]"
            aria-label="Tutup modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Ringkasan Pengajuan */}
          <div className="bg-[#FBFAF7] border border-[#D9DEE5] rounded p-4 text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-[#4A5565]">Nama Pegawai:</span>
              <span className="font-semibold text-[#1B2430]">{item.nama_lengkap}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#4A5565]">Jenis Cuti:</span>
              <span className="font-semibold text-[#13315C]">{item.nama_cuti}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#4A5565]">Periode Cuti:</span>
              <span className="font-semibold text-[#1B2430]">
                {formatDateRange(item.tanggal_mulai, item.tanggal_selesai)} ({formatDecimal(item.total_hari)} hari)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#4A5565]">Alasan Cuti:</span>
              <span className="font-medium text-[#1B2430] text-right max-w-xs">{item.alasan}</span>
            </div>
            {item.nama_handover && (
              <div className="flex justify-between">
                <span className="text-[#4A5565]">Rekan Pengganti:</span>
                <span className="font-medium text-[#1B2430]">{item.nama_handover}</span>
              </div>
            )}
          </div>

          {error && (
            <div className="p-3 bg-[#FEE2E2] border border-[#FECACA] rounded text-xs text-[#991B1B] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label
              htmlFor="notes"
              className="block text-xs font-semibold text-[#1B2430] uppercase tracking-wider mb-1.5"
            >
              {isReject ? 'Catatan Penolakan (Wajib Diisi)' : 'Catatan Persetujuan (Opsional)'}
            </label>
            <textarea
              id="notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={
                isReject
                  ? 'Tuliskan alasan penolakan secara jelas untuk disampaikan kepada pegawai...'
                  : 'Tambahkan instruksi kerja atau catatan khusus jika diperlukan...'
              }
              className="input-field py-2 h-auto text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E6EAF0]">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="btn-secondary text-xs h-10 px-4"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`${
                isReject ? 'btn-danger' : 'btn-primary'
              } text-xs h-10 px-4`}
            >
              {loading ? 'Memproses...' : isReject ? 'Tolak Pengajuan' : 'Setujui Pengajuan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
