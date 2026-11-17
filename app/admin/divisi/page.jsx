'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import {
  Building2,
  Plus,
  Edit2,
  Trash2,
  Users,
  X,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { formatDateIndo } from '@/lib/utils';

export default function AdminDivisiPage() {
  const [divisions, setDivisions] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ open: false, step: 1, division: null });
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState({
    id: null,
    nama_divisi: '',
    deskripsi: '',
    ketua_id: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const [dRes, uRes] = await Promise.all([
        fetch('/api/admin/divisions'),
        fetch('/api/admin/users'),
      ]);

      if (dRes.ok) {
        const d = await dRes.json();
        setDivisions(d.divisions || []);
      }
      if (uRes.ok) {
        const u = await uRes.json();
        setUsers(u.users || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function handleOpenCreate() {
    setIsEdit(false);
    setErrorMsg('');
    setFormData({
      id: null,
      nama_divisi: '',
      deskripsi: '',
      ketua_id: '',
    });
    setModalOpen(true);
  }

  function handleOpenEdit(d) {
    setIsEdit(true);
    setErrorMsg('');
    setFormData({
      id: d.id,
      nama_divisi: d.nama_divisi,
      deskripsi: d.deskripsi || '',
      ketua_id: d.ketua_id ? String(d.ketua_id) : '',
    });
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);

    try {
      const url = '/api/admin/divisions';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Terjadi kesalahan saat menyimpan divisi.');
        setSubmitting(false);
        return;
      }

      setToast(data.message);
      setModalOpen(false);
      await fetchData();
      setTimeout(() => setToast(''), 4000);
    } catch (err) {
      setErrorMsg('Terjadi kendala jaringan.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteConfirm() {
    if (deleteModal.step === 1) {
      // Langkah konfirmasi pertama -> pindah ke konfirmasi kedua
      setDeleteModal({ ...deleteModal, step: 2 });
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch(`/api/admin/divisions?id=${deleteModal.division.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Gagal menghapus divisi.');
        setSubmitting(false);
        return;
      }

      setToast(data.message);
      setDeleteModal({ open: false, step: 1, division: null });
      await fetchData();
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
        { href: '/admin/dashboard', label: 'Dashboard' },
        { label: 'Manajemen Divisi' },
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0B2545] tracking-tight">
            Manajemen Divisi & Unit Kerja
          </h1>
          <p className="text-xs text-[#4A5565] mt-1">
            Kelola struktur unit organisasi Bank Nusantara, penetapan pimpinan divisi, dan alokasi anggota.
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenCreate}
          className="btn-primary text-xs shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Divisi Baru</span>
        </button>
      </div>

      {/* Tabel Divisi */}
      <div className="bg-white rounded-md border border-[#D9DEE5] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left border-collapse">
            <thead>
              <tr>
                <th className="table-header">Nama Divisi</th>
                <th className="table-header">Deskripsi</th>
                <th className="table-header">Ketua Divisi</th>
                <th className="table-header text-center">Jumlah Anggota</th>
                <th className="table-header">Tanggal Dibentuk</th>
                <th className="table-header text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6EAF0] text-xs">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[#4A5565]">
                    Memuat data divisi...
                  </td>
                </tr>
              ) : divisions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[#4A5565]">
                    Belum ada divisi yang terdaftar.
                  </td>
                </tr>
              ) : (
                divisions.map((d) => (
                  <tr key={d.id} className="hover:bg-[#FBFAF7] transition-colors">
                    <td className="table-cell font-bold text-[#0B2545]">
                      {d.nama_divisi}
                    </td>
                    <td className="table-cell text-[#4A5565] max-w-xs truncate">
                      {d.deskripsi || '-'}
                    </td>
                    <td className="table-cell text-[#1B2430]">
                      {d.nama_ketua ? (
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{d.nama_ketua}</span>
                        </div>
                      ) : (
                        <span className="text-[#991B1B] italic">Belum Ditetapkan</span>
                      )}
                    </td>
                    <td className="table-cell text-center font-bold text-[#13315C]">
                      {d.jumlah_anggota || 0} orang
                    </td>
                    <td className="table-cell text-[#4A5565]">
                      {formatDateIndo(d.tanggal_dibentuk)}
                    </td>
                    <td className="table-cell text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(d)}
                        className="p-1 rounded text-[#13315C] hover:bg-[#F1F3F6]"
                        title="Ubah Divisi"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteModal({ open: true, step: 1, division: d })}
                        className="p-1 rounded text-[#991B1B] hover:bg-[#FEE2E2]"
                        title="Hapus Divisi"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Buat / Edit Divisi */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay">
          <div className="bg-white rounded-md border border-[#D9DEE5] max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E6EAF0]">
              <h3 className="text-base font-bold text-[#0B2545]">
                {isEdit ? 'Ubah Informasi Divisi' : 'Tambah Divisi Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 rounded text-[#4A5565] hover:text-[#1B2430]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded bg-[#FEE2E2] border border-[#FECACA] text-xs font-semibold text-[#991B1B] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#1B2430] uppercase mb-1">
                  Nama Divisi *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Audit Internal"
                  value={formData.nama_divisi}
                  onChange={(e) => setFormData({ ...formData, nama_divisi: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#1B2430] uppercase mb-1">
                  Deskripsi Divisi (Opsional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Tuliskan fungsi dan tanggung jawab divisi..."
                  value={formData.deskripsi}
                  onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                  className="input-field py-2 h-auto text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#1B2430] uppercase mb-1">
                  Ketua Divisi
                </label>
                <select
                  value={formData.ketua_id}
                  onChange={(e) => setFormData({ ...formData, ketua_id: e.target.value })}
                  className="input-field"
                >
                  <option value="">-- Pilih Ketua Divisi --</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nama_lengkap} ({u.role})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-[#4A5565] mt-1">
                  Catatan: Ketua divisi tidak boleh merangkap jabatan di divisi lain.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#E6EAF0]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  disabled={submitting}
                  className="btn-secondary text-xs h-10 px-4"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary text-xs h-10 px-5"
                >
                  {submitting ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Buat Divisi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Hapus Divisi (Konfirmasi 2 Kali sesuai Ketentuan PDF) */}
      {deleteModal.open && deleteModal.division && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay">
          <div className="bg-white rounded-md border border-[#D9DEE5] max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-[#991B1B]">
              {deleteModal.step === 1 ? 'Konfirmasi Pertama: Hapus Divisi' : 'Konfirmasi Kedua (Final): Hapus Divisi'}
            </h3>

            {deleteModal.step === 1 ? (
              <p className="text-xs text-[#4A5565] leading-relaxed">
                Anda akan menghapus divisi <strong className="text-[#0B2545]">{deleteModal.division.nama_divisi}</strong>. Seluruh anggota yang tergabung akan kehilangan atribut divisi ini (menjadi tanpa divisi). Lanjutkan ke konfirmasi akhir?
              </p>
            ) : (
              <div className="p-3 bg-[#FEE2E2] border border-[#FECACA] rounded text-xs text-[#991B1B] leading-relaxed">
                <strong>Peringatan Tegas:</strong> Tindakan ini permanen. Divisi "{deleteModal.division.nama_divisi}" akan dihapus dari sistem database. Klik "Hapus Sekarang" untuk mengeksekusi.
              </div>
            )}

            <div className="flex justify-end gap-3 pt-3 border-t border-[#E6EAF0]">
              <button
                type="button"
                onClick={() => setDeleteModal({ open: false, step: 1, division: null })}
                disabled={submitting}
                className="btn-secondary text-xs h-10 px-4"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={submitting}
                className="btn-danger text-xs h-10 px-4"
              >
                {submitting ? 'Memproses...' : deleteModal.step === 1 ? 'Lanjutkan (Tahap 2)' : 'Hapus Sekarang'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
