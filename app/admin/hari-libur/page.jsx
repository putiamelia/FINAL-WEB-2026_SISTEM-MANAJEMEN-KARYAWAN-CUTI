'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { CalendarRange, Plus, Trash2, CheckCircle2, AlertCircle, Calendar as CalendarIcon } from 'lucide-react';
import { formatDateIndo } from '@/lib/utils';

export default function AdminHariLiburPage() {
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  // Form input
  const [formData, setFormData] = useState({
    tanggal: '',
    keterangan: '',
    tipe: 'Hari Libur Nasional',
  });

  async function loadData() {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/holidays');
      const data = await res.json();
      setHolidays(data.holidays || []);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Gagal memuat kalender hari libur.' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formData.tanggal || !formData.keterangan) return;

    try {
      setSubmitting(true);
      setMessage(null);

      const res = await fetch('/api/admin/holidays', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan hari libur.');

      setMessage({ type: 'success', text: data.message });
      setFormData({
        tanggal: '',
        keterangan: '',
        tipe: 'Hari Libur Nasional',
      });
      await loadData();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(tanggal, keterangan) {
    if (!confirm(`Hapus hari libur "${keterangan}" pada tanggal ${tanggal}?`)) {
      return;
    }

    try {
      setMessage(null);
      const res = await fetch(`/api/admin/holidays?tanggal=${tanggal}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menghapus hari libur.');

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
          <h1 className="text-2xl font-bold text-[#0B2545]">Kalender Hari Libur & Cuti Bersama</h1>
          <p className="text-sm text-gray-500 mt-1">
            Hari libur yang didaftarkan di sini secara otomatis dilewati dari perhitungan hari kerja pengajuan cuti.
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Tambah Hari Libur */}
          <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm h-fit">
            <h2 className="text-sm font-bold text-[#0B2545] uppercase tracking-wider mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4 text-[#C8A24A]" />
              Tambah Hari Libur
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-gray-700 mb-1">
                  Tanggal Libur *
                </label>
                <input
                  type="date"
                  required
                  value={formData.tanggal}
                  onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">
                  Tipe Hari Libur *
                </label>
                <select
                  value={formData.tipe}
                  onChange={(e) => setFormData({ ...formData, tipe: e.target.value })}
                  className="input-field"
                >
                  <option value="Hari Libur Nasional">Hari Libur Nasional</option>
                  <option value="Cuti Bersama">Cuti Bersama</option>
                  <option value="Libur Khusus Perbankan">Libur Khusus Perbankan (BI/OJK)</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">
                  Keterangan Hari Libur *
                </label>
                <input
                  type="text"
                  required
                  placeholder="misal: Hari Raya Idul Fitri 1447 H"
                  value={formData.keterangan}
                  onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                  className="input-field"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded border border-amber-200 text-[11px] text-amber-900 leading-relaxed">
                <span className="font-semibold block mb-0.5">Pengaruh ke Pengajuan Cuti:</span>
                Tanggal libur di atas tidak akan memotong kuota cuti tahunan pegawai jika berada dalam rentang tanggal mulai hingga tanggal selesai pengajuan.
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn-primary w-full py-2.5 text-xs font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                {submitting ? 'Menyimpan...' : 'Simpan Hari Libur'}
              </button>
            </form>
          </div>

          {/* Tabel Kalender Libur */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarRange className="w-5 h-5 text-[#0B2545]" />
                  <h2 className="text-sm font-bold text-[#0B2545]">Daftar Hari Libur Terdaftar</h2>
                </div>
                <span className="text-xs bg-[#13315C] text-white px-2.5 py-0.5 rounded-full font-medium">
                  {holidays.length} Hari
                </span>
              </div>

              {loading ? (
                <div className="p-12 text-center text-sm text-gray-500">Memuat hari libur...</div>
              ) : holidays.length === 0 ? (
                <div className="p-12 text-center text-sm text-gray-500">
                  Belum ada hari libur yang didaftarkan.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[500px] text-left text-xs">
                    <thead>
                      <tr className="table-header">
                        <th className="py-2.5 px-4">Tanggal</th>
                        <th className="py-2.5 px-4">Keterangan</th>
                        <th className="py-2.5 px-4">Kategori</th>
                        <th className="py-2.5 px-4 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {holidays.map((h, idx) => {
                        const dateStr = typeof h.tanggal === 'string' ? h.tanggal.split('T')[0] : h.tanggal;
                        return (
                          <tr key={idx} className="hover:bg-gray-50 transition-colors">
                            <td className="py-3 px-4 font-semibold text-gray-800 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <CalendarIcon className="w-3.5 h-3.5 text-gray-400" />
                                {formatDateIndo(dateStr)}
                              </div>
                            </td>
                            <td className="py-3 px-4 font-medium text-gray-800">
                              {h.keterangan}
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                                  h.tipe === 'Cuti Bersama'
                                    ? 'bg-teal-50 text-teal-800 border border-teal-200'
                                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                                }`}
                              >
                                {h.tipe}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => handleDelete(dateStr, h.keterangan)}
                                className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                                title="Hapus hari libur"
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
