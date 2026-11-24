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
  Search,
  Eye,
  Filter,
} from 'lucide-react';
import { formatDateIndo, formatDecimal, getAvatarUrl } from '@/lib/utils';

export default function AdminDivisiPage() {
  const [divisions, setDivisions] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [ketuaFilter, setKetuaFilter] = useState('Semua');
  const [anggotaFilter, setAnggotaFilter] = useState('Semua');
  const [sortBy, setSortBy] = useState('name_asc');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ open: false, step: 1, division: null });
  const [detailModal, setDetailModal] = useState({ open: false, division: null, members: [], loadingMembers: false });
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

  async function handleOpenDetail(d) {
    setDetailModal({ open: true, division: d, members: [], loadingMembers: true });
    try {
      const res = await fetch(`/api/admin/division-members?divisi_id=${d.id}`);
      if (res.ok) {
        const data = await res.json();
        setDetailModal({ open: true, division: d, members: data.members || [], loadingMembers: false });
      } else {
        const localMembers = users.filter((u) => u.divisi_id === d.id);
        setDetailModal({ open: true, division: d, members: localMembers, loadingMembers: false });
      }
    } catch (e) {
      const localMembers = users.filter((u) => u.divisi_id === d.id);
      setDetailModal({ open: true, division: d, members: localMembers, loadingMembers: false });
    }
  }

  const filteredDivisions = divisions
    .filter((d) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = d.nama_divisi?.toLowerCase().includes(q);
        const matchKetua = d.nama_ketua?.toLowerCase().includes(q);
        if (!matchName && !matchKetua) return false;
      }
      if (ketuaFilter === 'ada') {
        if (!d.ketua_id && !d.nama_ketua) return false;
      } else if (ketuaFilter === 'belum') {
        if (d.ketua_id || d.nama_ketua) return false;
      }
      const count = parseInt(d.jumlah_anggota || '0', 10);
      if (anggotaFilter === 'ada') {
        if (count === 0) return false;
      } else if (anggotaFilter === 'kosong') {
        if (count > 0) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'name_asc') return a.nama_divisi.localeCompare(b.nama_divisi);
      if (sortBy === 'name_desc') return b.nama_divisi.localeCompare(a.nama_divisi);
      if (sortBy === 'members_desc') return (parseInt(b.jumlah_anggota, 10) || 0) - (parseInt(a.jumlah_anggota, 10) || 0);
      if (sortBy === 'members_asc') return (parseInt(a.jumlah_anggota, 10) || 0) - (parseInt(b.jumlah_anggota, 10) || 0);
      if (sortBy === 'date_desc') return new Date(b.tanggal_dibentuk || 0) - new Date(a.tanggal_dibentuk || 0);
      if (sortBy === 'date_asc') return new Date(a.tanggal_dibentuk || 0) - new Date(b.tanggal_dibentuk || 0);
      return 0;
    });

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

      {/* Filter & Sort Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-md border border-[#D9DEE5] mb-6 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 shadow-sm text-xs">
        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5 sm:gap-3 flex-1">
          {/* Search Input with aligned icon */}
          <div className="relative flex-1 sm:flex-initial sm:w-64 min-w-[200px]">
            <Search className="w-4 h-4 text-[#4A5565] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari divisi / ketua..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field input-search !h-9 text-xs w-full"
            />
          </div>

          {/* Filter Status Ketua */}
          <div className="w-full sm:w-36">
            <select
              value={ketuaFilter}
              onChange={(e) => setKetuaFilter(e.target.value)}
              className="input-field !h-9 text-xs w-full"
            >
              <option value="Semua">Semua Pimpinan</option>
              <option value="ada">Ada Ketua</option>
              <option value="belum">Belum Ditetapkan</option>
            </select>
          </div>

          {/* Filter Jumlah Anggota */}
          <div className="w-full sm:w-36">
            <select
              value={anggotaFilter}
              onChange={(e) => setAnggotaFilter(e.target.value)}
              className="input-field !h-9 text-xs w-full"
            >
              <option value="Semua">Semua Anggota</option>
              <option value="ada">Ada Anggota</option>
              <option value="kosong">Kosong (0)</option>
            </select>
          </div>

          {/* Sort Dropdown */}
          <div className="w-full sm:w-48">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="input-field !h-9 text-xs w-full"
            >
              <option value="name_asc">Nama Divisi (A - Z)</option>
              <option value="name_desc">Nama Divisi (Z - A)</option>
              <option value="members_desc">Anggota Terbanyak</option>
              <option value="members_asc">Anggota Tersedikit</option>
              <option value="date_desc">Tgl Dibentuk (Terbaru)</option>
              <option value="date_asc">Tgl Dibentuk (Terlama)</option>
            </select>
          </div>
        </div>

        <div className="text-[#4A5565] font-semibold text-xs shrink-0 self-end sm:self-center">
          Total {filteredDivisions.length} Divisi
        </div>
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
              ) : filteredDivisions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[#4A5565]">
                    Tidak ada divisi yang sesuai dengan pencarian/filter.
                  </td>
                </tr>
              ) : (
                filteredDivisions.map((d) => (
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
                    <td className="table-cell text-right space-x-1.5 sm:space-x-2">
                      <button
                        type="button"
                        onClick={() => handleOpenDetail(d)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[#13315C] hover:bg-[#EEF1F5] font-semibold text-xs border border-[#D9DEE5]"
                        title="Lihat Anggota & Rincian Divisi"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Detail</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(d)}
                        className="p-1.5 rounded text-[#13315C] hover:bg-[#F1F3F6]"
                        title="Ubah Divisi"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteModal({ open: true, step: 1, division: d })}
                        className="p-1.5 rounded text-[#991B1B] hover:bg-[#FEE2E2]"
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
      {/* Modal Detail Divisi & Daftar Anggota */}
      {detailModal.open && detailModal.division && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay">
          <div className="bg-white rounded-md border border-[#D9DEE5] max-w-2xl w-full p-6 shadow-xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[#E6EAF0]">
              <div>
                <h3 className="text-base font-bold text-[#0B2545]">
                  Detail Divisi: {detailModal.division.nama_divisi}
                </h3>
                <p className="text-xs text-[#4A5565]">
                  Dibentuk pada {formatDateIndo(detailModal.division.tanggal_dibentuk)} &bull; {detailModal.members.length} Anggota Terdaftar
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDetailModal({ open: false, division: null, members: [], loadingMembers: false })}
                className="p-1 rounded text-[#4A5565] hover:text-[#1B2430]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs space-y-3 flex-1 overflow-y-auto pr-1">
              {/* Ringkasan Divisi */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-[#FBFAF7] rounded border border-[#E6EAF0]">
                <div>
                  <span className="text-[#4A5565] block font-semibold mb-0.5">Ketua Divisi:</span>
                  <span className="text-[#0B2545] font-bold">
                    {detailModal.division.nama_ketua || 'Belum Ditetapkan'}
                  </span>
                </div>
                <div>
                  <span className="text-[#4A5565] block font-semibold mb-0.5">Deskripsi:</span>
                  <span className="text-[#334155]">
                    {detailModal.division.deskripsi || 'Tidak ada deskripsi.'}
                  </span>
                </div>
              </div>

              {/* Tabel Daftar Anggota */}
              <div>
                <h4 className="font-bold text-[#0B2545] text-xs mb-2">
                  Daftar Anggota Divisi (Peran &amp; Status Aktif):
                </h4>
                <div className="border border-[#D9DEE5] rounded overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#EEF1F5]">
                        <th className="p-2.5 font-bold text-[#0B2545]">Pegawai</th>
                        <th className="p-2.5 font-bold text-[#0B2545]">Peran (Role)</th>
                        <th className="p-2.5 font-bold text-[#0B2545]">Jabatan</th>
                        <th className="p-2.5 font-bold text-[#0B2545] text-center">Status Aktif</th>
                        <th className="p-2.5 font-bold text-[#0B2545] text-center">Sisa Cuti</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E6EAF0]">
                      {detailModal.loadingMembers ? (
                        <tr>
                          <td colSpan={5} className="p-6 text-center text-[#4A5565]">
                            Memuat daftar anggota divisi...
                          </td>
                        </tr>
                      ) : detailModal.members.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-6 text-center text-[#4A5565]">
                            Belum ada anggota yang ditempatkan pada divisi ini.
                          </td>
                        </tr>
                      ) : (
                        detailModal.members.map((m) => (
                          <tr key={m.id} className="hover:bg-[#FBFAF7]">
                            <td className="p-2.5">
                              <div className="flex items-center gap-2">
                                <img
                                  src={getAvatarUrl(m.foto_profil)}
                                  alt={m.nama_lengkap}
                                  className="w-7 h-7 rounded-full object-cover border border-[#D9DEE5] bg-[#E2E8F0]"
                                />
                                <div>
                                  <p className="font-bold text-[#1B2430]">{m.nama_lengkap}</p>
                                  <p className="text-[10px] text-[#4A5565]">{m.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-2.5">
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#DBEAFE] text-[#1E3A8A]">
                                {m.role}
                              </span>
                            </td>
                            <td className="p-2.5 text-[#4A5565]">{m.jabatan || 'Staff'}</td>
                            <td className="p-2.5 text-center">
                              {m.status_aktif ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#DCFCE7] text-[#14532D]">
                                  Aktif
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#FEE2E2] text-[#991B1B]">
                                  Nonaktif
                                </span>
                              )}
                            </td>
                            <td className="p-2.5 text-center font-bold text-[#13315C]">
                              {formatDecimal(m.sisa_kuota_tahunan)} hr
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#E6EAF0]">
              <a
                href="/admin/anggota-divisi"
                className="text-xs text-[#13315C] font-semibold hover:underline"
              >
                &rarr; Kelola Penempatan Anggota
              </a>
              <button
                type="button"
                onClick={() => setDetailModal({ open: false, division: null, members: [], loadingMembers: false })}
                className="btn-secondary text-xs h-9 px-4"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
