'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Edit2,
  Trash2,
  X,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { formatDateIndo, formatDecimal } from '@/lib/utils';

export default function AdminPenggunaPage() {
  const [users, setUsers] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('Semua');
  const [divisiFilter, setDivisiFilter] = useState('Semua');
  const [search, setSearch] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ open: false, user: null });
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Form Fields
  const [formData, setFormData] = useState({
    id: null,
    username: '',
    email: '',
    password: '',
    nama_lengkap: '',
    role: 'Karyawan',
    jabatan: '',
    divisi_id: '',
    kuota_tahunan_awal: 12.0,
    nomor_telepon: '',
    alamat: '',
    status_aktif: true,
  });

  useEffect(() => {
    fetchData();
  }, [roleFilter, divisiFilter]);

  async function fetchData() {
    try {
      setLoading(true);
      const [uRes, dRes] = await Promise.all([
        fetch(`/api/admin/users?role=${encodeURIComponent(roleFilter)}&divisi_id=${encodeURIComponent(divisiFilter)}`),
        fetch('/api/admin/divisions'),
      ]);

      if (uRes.ok) {
        const u = await uRes.json();
        setUsers(u.users || []);
      }
      if (dRes.ok) {
        const d = await dRes.json();
        setDivisions(d.divisions || []);
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
      username: '',
      email: '',
      password: 'password123',
      nama_lengkap: '',
      role: 'Karyawan',
      jabatan: 'Staff',
      divisi_id: divisions[0]?.id ? String(divisions[0].id) : '',
      kuota_tahunan_awal: 12.0,
      nomor_telepon: '',
      alamat: '',
      status_aktif: true,
    });
    setModalOpen(true);
  }

  function handleOpenEdit(user) {
    setIsEdit(true);
    setErrorMsg('');
    setFormData({
      id: user.id,
      username: user.username,
      email: user.email,
      password: '',
      nama_lengkap: user.nama_lengkap,
      role: user.role,
      jabatan: user.jabatan || '',
      divisi_id: user.divisi_id ? String(user.divisi_id) : '',
      kuota_tahunan_awal: user.kuota_tahunan_awal || 12.0,
      nomor_telepon: user.nomor_telepon || '',
      alamat: user.alamat || '',
      status_aktif: user.status_aktif,
    });
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);

    try {
      const url = '/api/admin/users';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Terjadi kesalahan saat menyimpan data.');
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
    if (!deleteModal.user) return;
    try {
      setSubmitting(true);
      const res = await fetch(`/api/admin/users?id=${deleteModal.user.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Gagal menghapus pengguna.');
        setSubmitting(false);
        return;
      }

      setToast(data.message);
      setDeleteModal({ open: false, user: null });
      await fetchData();
      setTimeout(() => setToast(''), 4000);
    } catch (err) {
      alert('Terjadi kesalahan jaringan.');
    } finally {
      setSubmitting(false);
    }
  }

  const filteredUsers = users.filter((u) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        u.nama_lengkap?.toLowerCase().includes(q) ||
        u.username?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <DashboardLayout
      breadcrumbs={[
        { href: '/admin/dashboard', label: 'Dashboard' },
        { label: 'Manajemen Pengguna' },
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
            Manajemen Pengguna (Pegawai & Pejabat)
          </h1>
          <p className="text-xs text-[#4A5565] mt-1">
            Kelola data akun seluruh pegawai, hak akses (role), divisi, dan alokasi saldo cuti awal.
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenCreate}
          className="btn-primary text-xs shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tambah Pengguna Baru</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-md border border-[#D9DEE5] mb-6 flex flex-wrap items-center justify-between gap-4 shadow-sm text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-[#4A5565] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari nama / email / username..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-9 h-9 text-xs w-64"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="input-field h-9 text-xs w-36"
          >
            <option value="Semua">Semua Role</option>
            <option value="Admin">Admin</option>
            <option value="HRD">HRD</option>
            <option value="Ketua Divisi">Ketua Divisi</option>
            <option value="Karyawan">Karyawan</option>
          </select>

          <select
            value={divisiFilter}
            onChange={(e) => setDivisiFilter(e.target.value)}
            className="input-field h-9 text-xs w-48"
          >
            <option value="Semua">Semua Divisi</option>
            {divisions.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nama_divisi}
              </option>
            ))}
          </select>
        </div>

        <span className="text-[#4A5565] font-semibold">
          Total {filteredUsers.length} Pengguna
        </span>
      </div>

      {/* Tabel Pengguna */}
      <div className="bg-white rounded-md border border-[#D9DEE5] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th className="table-header">Pegawai</th>
                <th className="table-header">Role</th>
                <th className="table-header">Divisi</th>
                <th className="table-header">Jabatan</th>
                <th className="table-header text-center">Sisa Kuota</th>
                <th className="table-header text-center">Status</th>
                <th className="table-header text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6EAF0] text-xs">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[#4A5565]">
                    Memuat data pengguna...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[#4A5565]">
                    Tidak ada data pengguna yang sesuai.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-[#FBFAF7] transition-colors">
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <img
                          src={u.foto_profil || '/assets/foto-karyawan.png'}
                          alt={u.nama_lengkap}
                          className="w-9 h-9 rounded-full object-cover border border-[#D9DEE5]"
                        />
                        <div>
                          <p className="font-bold text-[#1B2430]">{u.nama_lengkap}</p>
                          <p className="text-[11px] text-[#4A5565]">{u.username} &bull; {u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#DBEAFE] text-[#1E3A8A]">
                        {u.role}
                      </span>
                    </td>
                    <td className="table-cell text-[#334155]">{u.nama_divisi || '-'}</td>
                    <td className="table-cell text-[#4A5565]">{u.jabatan || 'Staff'}</td>
                    <td className="table-cell text-center font-bold text-[#13315C]">
                      {formatDecimal(u.sisa_kuota_tahunan)} hari
                    </td>
                    <td className="table-cell text-center">
                      {u.status_aktif ? (
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#DCFCE7] text-[#14532D]">
                          Aktif
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#FEE2E2] text-[#991B1B]">
                          Nonaktif
                        </span>
                      )}
                    </td>
                    <td className="table-cell text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(u)}
                        className="p-1 rounded text-[#13315C] hover:bg-[#F1F3F6]"
                        title="Ubah Pengguna"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {u.role !== 'Admin' && (
                        <button
                          type="button"
                          onClick={() => setDeleteModal({ open: true, user: u })}
                          className="p-1 rounded text-[#991B1B] hover:bg-[#FEE2E2]"
                          title="Hapus Pengguna"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Modal Tambah / Edit Pengguna */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay">
          <div className="bg-white rounded-md border border-[#D9DEE5] max-w-lg w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#E6EAF0]">
              <h3 className="text-base font-bold text-[#0B2545]">
                {isEdit ? 'Ubah Informasi Pengguna' : 'Tambah Pengguna Baru'}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#1B2430] uppercase mb-1">
                    Username *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#1B2430] uppercase mb-1">
                    Email Pegawai *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#1B2430] uppercase mb-1">
                    Nama Lengkap *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nama_lengkap}
                    onChange={(e) => setFormData({ ...formData, nama_lengkap: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#1B2430] uppercase mb-1">
                    Role Pengguna *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="input-field"
                  >
                    <option value="Karyawan">Karyawan</option>
                    <option value="Ketua Divisi">Ketua Divisi</option>
                    <option value="HRD">HRD</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#1B2430] uppercase mb-1">
                    Divisi
                  </label>
                  <select
                    value={formData.divisi_id}
                    onChange={(e) => setFormData({ ...formData, divisi_id: e.target.value })}
                    className="input-field"
                  >
                    <option value="">-- Tanpa Divisi --</option>
                    {divisions.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.nama_divisi}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[#1B2430] uppercase mb-1">
                    Jabatan
                  </label>
                  <input
                    type="text"
                    value={formData.jabatan}
                    onChange={(e) => setFormData({ ...formData, jabatan: e.target.value })}
                    placeholder="Contoh: Customer Service"
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#1B2430] uppercase mb-1">
                  {isEdit ? 'Ubah Kata Sandi (Kosongkan jika tidak diubah)' : 'Kata Sandi *'}
                </label>
                <input
                  type="password"
                  required={!isEdit}
                  placeholder="••••••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="input-field"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="statusAktif"
                  checked={formData.status_aktif}
                  onChange={(e) => setFormData({ ...formData, status_aktif: e.target.checked })}
                  className="w-4 h-4 text-[#13315C] rounded border-[#D9DEE5]"
                />
                <label htmlFor="statusAktif" className="font-semibold text-[#1B2430] cursor-pointer">
                  Akun Aktif (Dapat Masuk ke Sistem)
                </label>
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
                  {submitting ? 'Menyimpan...' : isEdit ? 'Perbarui Data' : 'Tambah Pengguna'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Hapus Pengguna */}
      {deleteModal.open && deleteModal.user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay">
          <div className="bg-white rounded-md border border-[#D9DEE5] max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-[#0B2545]">
              Konfirmasi Hapus Pengguna
            </h3>
            <p className="text-xs text-[#4A5565]">
              Apakah Anda yakin ingin menghapus akun pegawai <strong className="text-[#0B2545]">{deleteModal.user.nama_lengkap}</strong> ({deleteModal.user.role})? Tindakan ini tidak dapat dibatalkan.
            </p>

            <div className="flex justify-end gap-3 pt-3 border-t border-[#E6EAF0]">
              <button
                type="button"
                onClick={() => setDeleteModal({ open: false, user: null })}
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
                {submitting ? 'Menghapus...' : 'Ya, Hapus Pengguna'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
