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
  UploadCloud,
} from 'lucide-react';
import { formatDateIndo, formatDecimal, getAvatarUrl } from '@/lib/utils';
import { getPositionsForDivision, ROLE_DEFAULT_POSITIONS, DEFAULT_POSITIONS } from '@/lib/positions';

export default function AdminPenggunaPage() {
  const [users, setUsers] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('Semua');
  const [divisiFilter, setDivisiFilter] = useState('Semua');
  const [statusAktifFilter, setStatusAktifFilter] = useState('Semua');
  const [masaKerjaFilter, setMasaKerjaFilter] = useState('Semua');
  const [sortBy, setSortBy] = useState('default');
  const [search, setSearch] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ open: false, user: null });
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

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
  }, [roleFilter, divisiFilter, statusAktifFilter, masaKerjaFilter, sortBy]);

  async function fetchData() {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        role: roleFilter,
        divisi_id: divisiFilter,
        status_aktif: statusAktifFilter,
        masa_kerja: masaKerjaFilter,
        sort: sortBy,
      });

      const [uRes, dRes] = await Promise.all([
        fetch(`/api/admin/users?${queryParams.toString()}`),
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
    const firstDiv = divisions[0];
    const positions = getPositionsForDivision(firstDiv);
    setFormData({
      id: null,
      username: '',
      email: '',
      password: 'password123',
      nama_lengkap: '',
      role: 'Karyawan',
      jabatan: positions[0] || 'Staff',
      divisi_id: firstDiv?.id ? String(firstDiv.id) : '',
      kuota_tahunan_awal: 12.0,
      nomor_telepon: '',
      alamat: '',
      status_aktif: true,
      foto_profil: '',
    });
    setModalOpen(true);
  }

  function handleModalDivisionChange(newDivId) {
    const selectedDiv = divisions.find((d) => String(d.id) === String(newDivId));
    let newJabatan = '';
    if (selectedDiv) {
      const positions = getPositionsForDivision(selectedDiv);
      newJabatan = positions[0] || 'Staff';
    } else {
      const rolePositions = ROLE_DEFAULT_POSITIONS[formData.role] || DEFAULT_POSITIONS;
      newJabatan = rolePositions[0] || 'Staff';
    }
    setFormData((prev) => ({
      ...prev,
      divisi_id: newDivId,
      jabatan: newJabatan,
    }));
  }

  function handleModalRoleChange(newRole) {
    setFormData((prev) => {
      let updatedJabatan = prev.jabatan;
      if (!prev.divisi_id) {
        const rolePositions = ROLE_DEFAULT_POSITIONS[newRole] || DEFAULT_POSITIONS;
        updatedJabatan = rolePositions[0] || 'Staff';
      }
      return {
        ...prev,
        role: newRole,
        jabatan: updatedJabatan,
      };
    });
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
      foto_profil: (user.foto_profil && user.foto_profil.startsWith('/uploads/')) ? user.foto_profil : '',
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

  const modalSelectedDiv = divisions.find((d) => String(d.id) === String(formData.divisi_id));
  const modalPositions = modalSelectedDiv
    ? getPositionsForDivision(modalSelectedDiv)
    : (ROLE_DEFAULT_POSITIONS[formData.role] || DEFAULT_POSITIONS);

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

      {/* Filter & Sort Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-md border border-[#D9DEE5] mb-6 flex flex-col gap-3 shadow-sm text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {/* Search Input with aligned icon */}
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 text-[#4A5565] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari nama / email / username..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field input-search !h-9 text-xs w-full"
            />
          </div>

          {/* Role Filter Select */}
          <div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="input-field !h-9 text-xs w-full"
            >
              <option value="Semua">Semua Role</option>
              <option value="Admin">Admin</option>
              <option value="HRD">HRD</option>
              <option value="Ketua Divisi">Ketua Divisi</option>
              <option value="Karyawan">Karyawan</option>
            </select>
          </div>

          {/* Divisi Filter Select */}
          <div>
            <select
              value={divisiFilter}
              onChange={(e) => setDivisiFilter(e.target.value)}
              className="input-field !h-9 text-xs w-full"
            >
              <option value="Semua">Semua Divisi</option>
              {divisions.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nama_divisi}
                </option>
              ))}
            </select>
          </div>

          {/* Status Aktif Filter Select */}
          <div>
            <select
              value={statusAktifFilter}
              onChange={(e) => setStatusAktifFilter(e.target.value)}
              className="input-field !h-9 text-xs w-full"
            >
              <option value="Semua">Semua Status</option>
              <option value="true">Aktif</option>
              <option value="false">Nonaktif</option>
            </select>
          </div>

          {/* Masa Kerja Filter Select */}
          <div>
            <select
              value={masaKerjaFilter}
              onChange={(e) => setMasaKerjaFilter(e.target.value)}
              className="input-field !h-9 text-xs w-full"
            >
              <option value="Semua">Semua Masa Kerja</option>
              <option value="kurang_1_tahun">&lt; 1 Thn (Probation)</option>
              <option value="lebih_1_tahun">&ge; 1 Thn (Eligible Cuti)</option>
            </select>
          </div>
        </div>

        {/* Baris Kedua: Sortir & Total Counter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-[#E6EAF0]">
          <div className="flex items-center gap-2">
            <span className="text-[#4A5565] font-semibold">Urutkan:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="input-field !h-8 text-xs !w-auto"
            >
              <option value="default">Terbaru Dibuat</option>
              <option value="name_asc">Nama (A - Z)</option>
              <option value="name_desc">Nama (Z - A)</option>
              <option value="join_desc">Tgl Bergabung (Terbaru)</option>
              <option value="join_asc">Tgl Bergabung (Terlama)</option>
              <option value="divisi_asc">Divisi (A - Z)</option>
            </select>
          </div>
          <div className="text-[#4A5565] font-semibold text-xs">
            Menampilkan {filteredUsers.length} Pengguna
          </div>
        </div>
      </div>

      {/* Tabel Pengguna */}
      <div className="bg-white rounded-md border border-[#D9DEE5] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] text-left border-collapse">
            <thead>
              <tr>
                <th className="table-header">Pegawai</th>
                <th className="table-header">Role</th>
                <th className="table-header">Divisi</th>
                <th className="table-header">Jabatan</th>
                <th className="table-header text-center">Sisa Kuota</th>
                <th className="table-header text-center">Status</th>
                <th className="table-header">Tanggal Masuk</th>
                <th className="table-header text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6EAF0] text-xs">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-[#4A5565]">
                    Memuat data pengguna...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-[#4A5565]">
                    Tidak ada data pengguna yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-[#FBFAF7] transition-colors">
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <img
                          src={getAvatarUrl(u.foto_profil)}
                          alt={u.nama_lengkap}
                          className="w-9 h-9 rounded-full object-cover border border-[#D9DEE5] bg-[#E2E8F0]"
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
                    <td className="table-cell text-[#4A5565]">
                      {formatDateIndo(u.tanggal_bergabung)}
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
                      {(u.role === 'Karyawan' || u.role === 'Ketua Divisi') && (
                        <button
                          type="button"
                          onClick={() => setDeleteModal({ open: true, user: u })}
                          className="p-1 rounded text-[#991B1B] hover:bg-[#FEE2E2]"
                          title="Hapus Pengguna (Karyawan & Ketua Divisi)"
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
              {/* Unggah Foto Profil */}
              <div className="flex items-center gap-4 p-3.5 bg-gray-50 rounded-md border border-[#D9DEE5]">
                <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-[#13315C] bg-[#E2E8F0] shrink-0 shadow-sm flex items-center justify-center">
                  <img
                    src={getAvatarUrl(formData.foto_profil)}
                    alt="Foto Profil"
                    className="w-full h-full object-cover"
                  />
                  {uploadingPhoto && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <label className="block text-[11px] font-bold text-[#0B2545] uppercase tracking-wider">
                    Foto Profil Pegawai
                  </label>
                  <p className="text-[11px] text-[#4A5565]">
                    Format JPG, PNG, atau WebP (Maksimal 5 MB)
                  </p>
                  <div className="flex items-center gap-2 pt-0.5">
                    <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold bg-[#13315C] text-white hover:bg-[#0B2545] transition-colors shadow-sm">
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>{uploadingPhoto ? 'Mengunggah...' : (formData.foto_profil && formData.foto_profil.startsWith('/uploads/') ? 'Ganti Foto' : 'Tambahkan Foto')}</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        disabled={uploadingPhoto}
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setUploadingPhoto(true);
                          const upData = new FormData();
                          upData.append('file', file);
                          if (formData.id) {
                            upData.append('user_id', formData.id);
                          } else {
                            upData.append('is_new', 'true');
                          }
                          try {
                            const res = await fetch('/api/user/upload-avatar', { method: 'POST', body: upData });
                            const result = await res.json();
                            if (res.ok) {
                              setFormData((prev) => ({ ...prev, foto_profil: result.url }));
                            } else {
                              alert(result.error || 'Gagal mengunggah foto');
                            }
                          } catch (err) {
                            alert('Gagal mengunggah foto');
                          } finally {
                            setUploadingPhoto(false);
                            e.target.value = '';
                          }
                        }}
                      />
                    </label>
                    {formData.foto_profil && formData.foto_profil.startsWith('/uploads/') && (
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, foto_profil: '' })}
                        className="text-[11px] text-red-600 hover:text-red-700 underline px-1 py-1"
                      >
                        Hapus Foto
                      </button>
                    )}
                  </div>
                </div>
              </div>

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
                    onChange={(e) => handleModalRoleChange(e.target.value)}
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
                    onChange={(e) => handleModalDivisionChange(e.target.value)}
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
                    Jabatan / Posisi *
                  </label>
                  <select
                    value={formData.jabatan}
                    onChange={(e) => setFormData({ ...formData, jabatan: e.target.value })}
                    className="input-field"
                  >
                    {formData.jabatan && !modalPositions.includes(formData.jabatan) && (
                      <option value={formData.jabatan}>{formData.jabatan}</option>
                    )}
                    {modalPositions.map((pos) => (
                      <option key={pos} value={pos}>
                        {pos}
                      </option>
                    ))}
                  </select>
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
