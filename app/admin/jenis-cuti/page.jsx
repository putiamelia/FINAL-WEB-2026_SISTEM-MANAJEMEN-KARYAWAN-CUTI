'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Layers, Plus, Edit2, Trash2, CheckCircle2, AlertCircle, X, ShieldCheck } from 'lucide-react';
import { formatDecimal } from '@/lib/utils';

export default function AdminJenisCutiPage() {
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    nama_cuti: '',
    deskripsi: '',
    kuota_default: 12,
    minimal_h_pengajuan: 0,
    maksimal_h_setelah_sakit: 3,
    wajib_lampiran: false,
    potong_kuota_utama: true,
    status_aktif: true,
  });

  async function loadData() {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/leave-types');
      const data = await res.json();
      setLeaveTypes(data.leaveTypes || []);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Gagal memuat daftar jenis cuti.' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function handleOpenCreate() {
    setIsEditing(false);
    setFormData({
      id: null,
      nama_cuti: '',
      deskripsi: '',
      kuota_default: 12,
      minimal_h_pengajuan: 0,
      maksimal_h_setelah_sakit: 3,
      wajib_lampiran: false,
      potong_kuota_utama: true,
      status_aktif: true,
    });
    setModalOpen(true);
  }

  function handleOpenEdit(lt) {
    setIsEditing(true);
    setFormData({
      id: lt.id,
      nama_cuti: lt.nama_cuti,
      deskripsi: lt.deskripsi || '',
      kuota_default: lt.kuota_default,
      minimal_h_pengajuan: lt.minimal_h_pengajuan || 0,
      maksimal_h_setelah_sakit: lt.maksimal_h_setelah_sakit || 3,
      wajib_lampiran: Boolean(lt.wajib_lampiran),
      potong_kuota_utama: Boolean(lt.potong_kuota_utama),
      status_aktif: Boolean(lt.status_aktif),
    });
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      setSubmitting(true);
      setMessage(null);

      const method = isEditing ? 'PUT' : 'POST';
      const res = await fetch('/api/admin/leave-types', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan jenis cuti.');

      setMessage({ type: 'success', text: data.message });
      setModalOpen(false);
      await loadData();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id, name) {
    if (!confirm(`Hapus jenis cuti "${name}"? Tindakan ini hanya dapat dilakukan jika belum ada pengajuan terkait.`)) {
      return;
    }

    try {
      setMessage(null);
      const res = await fetch(`/api/admin/leave-types?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menghapus jenis cuti.');

      setMessage({ type: 'success', text: data.message });
      await loadData();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#0B2545]">Pengaturan Jenis Cuti</h1>
            <p className="text-sm text-gray-500 mt-1">
              Konfigurasi aturan kuota, minimal hari pengajuan, dan syarat dokumen pendukung.
            </p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="btn-primary py-2.5 px-4 text-xs font-semibold flex items-center gap-2 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Tambah Jenis Cuti
          </button>
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

        {/* Tabel Jenis Cuti */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#0B2545]" />
              <h2 className="text-sm font-bold text-[#0B2545]">Daftar Kebijakan Cuti Karyawan</h2>
            </div>
            <span className="text-xs bg-[#13315C] text-white px-2.5 py-0.5 rounded-full font-medium">
              {leaveTypes.length} Jenis
            </span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-sm text-gray-500">Memuat data jenis cuti...</div>
          ) : leaveTypes.length === 0 ? (
            <div className="p-12 text-center text-sm text-gray-500">Belum ada data jenis cuti terdaftar.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="table-header">
                    <th className="py-2.5 px-4">Nama Jenis Cuti</th>
                    <th className="py-2.5 px-4">Kuota Default</th>
                    <th className="py-2.5 px-4">Aturan Pengajuan</th>
                    <th className="py-2.5 px-4">Potong Kuota</th>
                    <th className="py-2.5 px-4">Lampiran</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {leaveTypes.map((lt) => (
                    <tr key={lt.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 font-semibold text-gray-800">
                        <div>{lt.nama_cuti}</div>
                        {lt.deskripsi && (
                          <div className="text-[11px] text-gray-500 font-normal mt-0.5">
                            {lt.deskripsi}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-700">
                        {formatDecimal(lt.kuota_default)} hari
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {lt.minimal_h_pengajuan > 0 ? (
                          <span className="inline-block bg-amber-50 text-amber-800 px-2 py-0.5 rounded text-[11px]">
                            H-{lt.minimal_h_pengajuan} kerja
                          </span>
                        ) : (
                          <span className="text-gray-500">Fleksibel / Hari-H</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {lt.potong_kuota_utama ? (
                          <span className="text-emerald-700 font-medium">Ya (Tahunan)</span>
                        ) : (
                          <span className="text-gray-500">Tidak (Khusus)</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {lt.wajib_lampiran ? (
                          <span className="inline-block bg-rose-50 text-rose-700 px-2 py-0.5 rounded text-[11px] font-medium">
                            Wajib Dokumen
                          </span>
                        ) : (
                          <span className="text-gray-400">Opsional</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                            lt.status_aktif
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {lt.status_aktif ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEdit(lt)}
                            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                            title="Ubah jenis cuti"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(lt.id, lt.nama_cuti)}
                            className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                            title="Hapus jenis cuti"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Tambah / Edit Jenis Cuti */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full overflow-hidden border border-gray-200">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                <h3 className="text-base font-bold text-[#0B2545]">
                  {isEditing ? 'Ubah Jenis Cuti' : 'Tambah Jenis Cuti Baru'}
                </h3>
                <button
                  onClick={() => setModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
                <div>
                  <label className="block font-medium text-gray-700 mb-1">
                    Nama Jenis Cuti *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nama_cuti}
                    onChange={(e) => setFormData({ ...formData, nama_cuti: e.target.value })}
                    className="input-field"
                    placeholder="misal: Cuti Menikah, Cuti Sakit, Cuti Tahunan"
                  />
                </div>

                <div>
                  <label className="block font-medium text-gray-700 mb-1">
                    Deskripsi / Ketentuan Kebijakan
                  </label>
                  <textarea
                    rows={2}
                    value={formData.deskripsi}
                    onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                    className="input-field"
                    placeholder="Keterangan singkat mengenai dasar hukum atau syarat pengajuan..."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-medium text-gray-700 mb-1">
                      Kuota Default (Hari) *
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      required
                      value={formData.kuota_default}
                      onChange={(e) => setFormData({ ...formData, kuota_default: e.target.value })}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-gray-700 mb-1">
                      Minimal H- Pengajuan
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.minimal_h_pengajuan}
                      onChange={(e) => setFormData({ ...formData, minimal_h_pengajuan: e.target.value })}
                      className="input-field"
                      placeholder="0 jika hari-H"
                    />
                    <span className="text-[10px] text-gray-500">Contoh: 3 untuk minimal H-3</span>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-gray-100">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.potong_kuota_utama}
                      onChange={(e) => setFormData({ ...formData, potong_kuota_utama: e.target.checked })}
                      className="rounded border-gray-300 text-[#0B2545] focus:ring-[#0B2545]"
                    />
                    <span className="font-medium text-gray-700">
                      Memotong Kuota Tahunan Pegawai
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.wajib_lampiran}
                      onChange={(e) => setFormData({ ...formData, wajib_lampiran: e.target.checked })}
                      className="rounded border-gray-300 text-[#0B2545] focus:ring-[#0B2545]"
                    />
                    <span className="font-medium text-gray-700">
                      Wajib Melampirkan Dokumen Pendukung (Surat Dokter / Bukti Resmi)
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.status_aktif}
                      onChange={(e) => setFormData({ ...formData, status_aktif: e.target.checked })}
                      className="rounded border-gray-300 text-[#0B2545] focus:ring-[#0B2545]"
                    />
                    <span className="font-medium text-gray-700">
                      Status Aktif (Tersedia untuk Pengajuan Pegawai)
                    </span>
                  </label>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="btn-secondary py-2 px-4"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary py-2 px-4 disabled:opacity-50"
                  >
                    {submitting ? 'Menyimpan...' : isEditing ? 'Simpan Perubahan' : 'Buat Jenis Cuti'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
