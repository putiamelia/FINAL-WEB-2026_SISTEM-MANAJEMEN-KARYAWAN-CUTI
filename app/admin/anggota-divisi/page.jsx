'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Users, UserPlus, UserMinus, Building2, Search, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function AdminAnggotaDivisiPage() {
  const [divisions, setDivisions] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedDivisiId, setSelectedDivisiId] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  async function loadData() {
    try {
      setLoading(true);
      const [divRes, userRes] = await Promise.all([
        fetch('/api/admin/divisions'),
        fetch('/api/admin/users'),
      ]);
      const divData = await divRes.json();
      const userData = await userRes.json();

      const divs = divData.divisions || [];
      setDivisions(divs);
      setUsers(userData.users || []);

      if (divs.length > 0 && !selectedDivisiId) {
        setSelectedDivisiId(String(divs[0].id));
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Gagal memuat data anggota divisi.' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleAddMember(e) {
    e.preventDefault();
    if (!selectedUserId || !selectedDivisiId) return;

    try {
      setSubmitting(true);
      setMessage(null);
      const res = await fetch('/api/admin/division-members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: parseInt(selectedUserId, 10),
          divisi_id: parseInt(selectedDivisiId, 10),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menambahkan anggota.');

      setMessage({ type: 'success', text: data.message });
      setSelectedUserId('');
      await loadData();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRemoveMember(userId, userName) {
    if (!confirm(`Keluarkan ${userName} dari divisi ini? Akun pengguna tetap tersimpan di sistem.`)) {
      return;
    }

    try {
      setMessage(null);
      const res = await fetch(`/api/admin/division-members?user_id=${userId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mengeluarkan anggota.');

      setMessage({ type: 'success', text: data.message });
      await loadData();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  }

  const currentDivision = divisions.find((d) => String(d.id) === String(selectedDivisiId));
  const divisionMembers = users.filter((u) => String(u.divisi_id) === String(selectedDivisiId));
  const candidateUsers = users.filter((u) => String(u.divisi_id) !== String(selectedDivisiId));

  const filteredMembers = divisionMembers.filter(
    (m) =>
      m.nama_lengkap.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.nip && m.nip.toLowerCase().includes(searchQuery.toLowerCase())) ||
      m.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0B2545]">Pengaturan Anggota Divisi</h1>
          <p className="text-sm text-gray-500 mt-1">
            Kelola penempatan pegawai dan pimpinan unit kerja di Bank Nusantara.
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
          {/* Kolom Kiri: Pilih Divisi & Tambah Anggota */}
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                Pilih Divisi
              </label>
              <select
                value={selectedDivisiId}
                onChange={(e) => setSelectedDivisiId(e.target.value)}
                className="input-field"
              >
                {divisions.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nama_divisi} ({d.kode_divisi})
                  </option>
                ))}
              </select>

              {currentDivision && (
                <div className="mt-4 p-3 bg-gray-50 rounded border border-gray-100 text-xs text-gray-600 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Kode:</span>
                    <span className="font-semibold text-gray-800">{currentDivision.kode_divisi}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total Anggota:</span>
                    <span className="font-semibold text-[#0B2545]">{divisionMembers.length} Pegawai</span>
                  </div>
                  {currentDivision.deskripsi && (
                    <div className="pt-2 border-t border-gray-200 text-gray-500 italic">
                      {currentDivision.deskripsi}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
              <h2 className="text-sm font-bold text-[#0B2545] uppercase tracking-wider mb-3 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-[#C8A24A]" />
                Tambah Anggota ke Divisi
              </h2>
              <p className="text-xs text-gray-500 mb-4">
                Pilih pegawai yang belum memiliki divisi atau pindahkan pegawai dari divisi lain.
              </p>

              <form onSubmit={handleAddMember} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Pilih Pegawai
                  </label>
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    required
                    className="input-field"
                  >
                    <option value="">Pilih pegawai...</option>
                    {candidateUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.nama_lengkap} ({u.role}) {u.nama_divisi ? `[Saat ini: ${u.nama_divisi}]` : '[Belum ada divisi]'}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={submitting || !selectedUserId}
                  className="btn-primary w-full py-2.5 text-xs font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <UserPlus className="w-4 h-4" />
                  {submitting ? 'Menyimpan...' : 'Masukkan ke Divisi'}
                </button>
              </form>
            </div>
          </div>

          {/* Kolom Kanan: Daftar Anggota Divisi */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-[#0B2545]" />
                  <h2 className="text-sm font-bold text-[#0B2545]">
                    Anggota Divisi: {currentDivision ? currentDivision.nama_divisi : '...'}
                  </h2>
                  <span className="text-xs bg-[#13315C] text-white px-2 py-0.5 rounded-full font-medium">
                    {filteredMembers.length}
                  </span>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Cari nama, NIP, peran..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-3 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#0B2545]"
                  />
                </div>
              </div>

              {loading ? (
                <div className="p-12 text-center text-sm text-gray-500">Memuat anggota divisi...</div>
              ) : filteredMembers.length === 0 ? (
                <div className="p-12 text-center text-sm text-gray-500">
                  {divisionMembers.length === 0
                    ? 'Belum ada anggota yang ditempatkan pada divisi ini.'
                    : 'Tidak ada anggota yang cocok dengan pencarian.'}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="table-header">
                        <th className="py-2.5 px-4">Pegawai</th>
                        <th className="py-2.5 px-4">NIP / Email</th>
                        <th className="py-2.5 px-4">Peran</th>
                        <th className="py-2.5 px-4">Sisa Kuota</th>
                        <th className="py-2.5 px-4 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredMembers.map((m) => (
                        <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-4 font-semibold text-gray-800">
                            {m.nama_lengkap}
                          </td>
                          <td className="py-3 px-4 text-gray-600">
                            <div>{m.nip || 'Belum ada NIP'}</div>
                            <div className="text-[11px] text-gray-400">{m.email}</div>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                                m.role === 'Ketua Divisi'
                                  ? 'bg-amber-100 text-amber-800'
                                  : m.role === 'HRD'
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-blue-50 text-blue-700'
                              }`}
                            >
                              {m.role}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-medium text-gray-700">
                            {m.sisa_kuota_cuti} hari
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => handleRemoveMember(m.id, m.nama_lengkap)}
                              className="text-red-600 hover:text-red-800 text-xs font-semibold inline-flex items-center gap-1 hover:underline"
                              title="Keluarkan dari divisi ini"
                            >
                              <UserMinus className="w-3.5 h-3.5" />
                              Keluarkan
                            </button>
                          </td>
                        </tr>
                      ))}
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
