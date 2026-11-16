'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { FileText, Plus, Trash2, CheckCircle2, AlertCircle, ShieldAlert, Percent, Calendar } from 'lucide-react';
import { formatDateRange, formatDateIndo } from '@/lib/utils';

export default function AdminBlackoutPage() {
  const [blackoutPeriods, setBlackoutPeriods] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [maxPercentage, setMaxPercentage] = useState(30);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [savingPercent, setSavingPercent] = useState(false);
  const [message, setMessage] = useState(null);

  // Form input blackout
  const [formData, setFormData] = useState({
    tanggal_mulai: '',
    tanggal_selesai: '',
    alasan: '',
    divisi_id: '',
  });

  async function loadData() {
    try {
      setLoading(true);
      const [boRes, divRes] = await Promise.all([
        fetch('/api/admin/blackout'),
        fetch('/api/admin/divisions'),
      ]);
      const boData = await boRes.json();
      const divData = await divRes.json();

      setBlackoutPeriods(boData.blackoutPeriods || []);
      setMaxPercentage(parseInt(boData.max_percentage || 30, 10));
      setDivisions(divData.divisions || []);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Gagal memuat konfigurasi blackout period.' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleSavePercentage(e) {
    e.preventDefault();
    try {
      setSavingPercent(true);
      setMessage(null);
      const res = await fetch('/api/admin/blackout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ update_percentage: maxPercentage }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan batas kapasitas.');

      setMessage({ type: 'success', text: data.message });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSavingPercent(false);
    }
  }

  async function handleAddBlackout(e) {
    e.preventDefault();
    if (!formData.tanggal_mulai || !formData.tanggal_selesai || !formData.alasan) return;

    try {
      setSubmitting(true);
      setMessage(null);

      const res = await fetch('/api/admin/blackout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tanggal_mulai: formData.tanggal_mulai,
          tanggal_selesai: formData.tanggal_selesai,
          alasan: formData.alasan,
          divisi_id: formData.divisi_id ? parseInt(formData.divisi_id, 10) : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan blackout period.');

      setMessage({ type: 'success', text: data.message });
      setFormData({
        tanggal_mulai: '',
        tanggal_selesai: '',
        alasan: '',
        divisi_id: '',
      });
      await loadData();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id, alasan) {
    if (!confirm(`Hapus periode blackout "${alasan}"?`)) {
      return;
    }

    try {
      setMessage(null);
      const res = await fetch(`/api/admin/blackout?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menghapus periode blackout.');

      setMessage({ type: 'success', text: data.message });
      await loadData();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0B2545]">Blackout Period & Kapasitas Divisi</h1>
          <p className="text-sm text-gray-500 mt-1">
            Atur periode larangan pengajuan cuti operasional penting serta batas kuota ketidakhadiran divisi.
          </p>
        </div>

        {message && (
          <div
            className={`p-4 rounded border flex items-center gap-3 text-sm ${
              message.type === 'error'
                ? 'bg-red-50 text-red-700 border-red-200'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}
          >
            {message.type === 'error' ? <AlertCircle className="w-5 h-5 shrink-0" /> : <CheckCircle2 className="w-5 h-5 shrink-0" />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Setting Kapasitas Tim Card */}
        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-blue-50 text-[#0B2545] flex items-center justify-center">
              <Percent className="w-5 h-5 text-[#C8A24A]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#0B2545]">
                Batas Kapasitas Ketidakhadiran Divisi
              </h2>
              <p className="text-xs text-gray-500">
                Peringatan kuning akan otomatis dimunculkan kepada HRD jika pengajuan baru menyebabkan lebih dari persentase ini sedang cuti.
              </p>
            </div>
          </div>

          <form onSubmit={handleSavePercentage} className="flex flex-col sm:flex-row items-center gap-4 mt-4">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="number"
                min="5"
                max="100"
                value={maxPercentage}
                onChange={(e) => setMaxPercentage(parseInt(e.target.value, 10))}
                className="input-field w-28 text-center font-bold text-sm"
              />
              <span className="text-sm font-semibold text-gray-700">% dari total pegawai divisi</span>
            </div>
            <button
              type="submit"
              disabled={savingPercent}
              className="btn-primary py-2 px-5 text-xs font-semibold self-start sm:self-auto disabled:opacity-50"
            >
              {savingPercent ? 'Menyimpan...' : 'Simpan Batas'}
            </button>
          </form>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Tambah Blackout Period */}
          <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm h-fit">
            <h2 className="text-sm font-bold text-[#0B2545] uppercase tracking-wider mb-4 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-600" />
              Tetapkan Blackout Period
            </h2>

            <form onSubmit={handleAddBlackout} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-gray-700 mb-1">
                  Tanggal Mulai *
                </label>
                <input
                  type="date"
                  required
                  value={formData.tanggal_mulai}
                  onChange={(e) => setFormData({ ...formData, tanggal_mulai: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">
                  Tanggal Selesai *
                </label>
                <input
                  type="date"
                  required
                  value={formData.tanggal_selesai}
                  onChange={(e) => setFormData({ ...formData, tanggal_selesai: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">
                  Divisi Berlaku
                </label>
                <select
                  value={formData.divisi_id}
                  onChange={(e) => setFormData({ ...formData, divisi_id: e.target.value })}
                  className="input-field"
                >
                  <option value="">Semua Divisi (Seluruh Bank)</option>
                  {divisions.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.nama_divisi}
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-gray-500">
                  Kosongkan bila blackout berlaku bagi seluruh karyawan.
                </span>
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">
                  Alasan / Agenda Operasional *
                </label>
                <input
                  type="text"
                  required
                  placeholder="misal: Tutup Buku Akhir Tahun 2026"
                  value={formData.alasan}
                  onChange={(e) => setFormData({ ...formData, alasan: e.target.value })}
                  className="input-field"
                />
              </div>

              <div className="p-3 bg-red-50 rounded border border-red-200 text-[11px] text-red-800 leading-relaxed">
                <span className="font-semibold block mb-0.5">Aturan Sistem:</span>
                Karyawan tidak akan diizinkan mengajukan Cuti Tahunan yang melewati rentang tanggal blackout yang telah ditetapkan.
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn-primary w-full py-2.5 text-xs font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                {submitting ? 'Menyimpan...' : 'Tambahkan Periode'}
              </button>
            </form>
          </div>

          {/* Tabel Periode Blackout */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#0B2545]" />
                  <h2 className="text-sm font-bold text-[#0B2545]">Daftar Periode Blackout Terdaftar</h2>
                </div>
                <span className="text-xs bg-red-700 text-white px-2.5 py-0.5 rounded-full font-medium">
                  {blackoutPeriods.length} Periode
                </span>
              </div>

              {loading ? (
                <div className="p-12 text-center text-sm text-gray-500">Memuat blackout periods...</div>
              ) : blackoutPeriods.length === 0 ? (
                <div className="p-12 text-center text-sm text-gray-500">
                  Belum ada periode blackout yang aktif.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="table-header">
                        <th className="py-2.5 px-4">Rentang Tanggal</th>
                        <th className="py-2.5 px-4">Alasan Operasional</th>
                        <th className="py-2.5 px-4">Cakupan Divisi</th>
                        <th className="py-2.5 px-4 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {blackoutPeriods.map((bp) => {
                        const start = typeof bp.tanggal_mulai === 'string' ? bp.tanggal_mulai.split('T')[0] : bp.tanggal_mulai;
                        const end = typeof bp.tanggal_selesai === 'string' ? bp.tanggal_selesai.split('T')[0] : bp.tanggal_selesai;
                        return (
                          <tr key={bp.id} className="hover:bg-gray-50 transition-colors">
                            <td className="py-3 px-4 font-semibold text-gray-800 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                {formatDateRange(start, end)}
                              </div>
                            </td>
                            <td className="py-3 px-4 font-medium text-gray-800">
                              {bp.alasan}
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                                  bp.nama_divisi
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                    : 'bg-purple-50 text-purple-700 border border-purple-200'
                                }`}
                              >
                                {bp.nama_divisi || 'Semua Divisi'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => handleDelete(bp.id, bp.alasan)}
                                className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                                title="Hapus periode blackout"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
