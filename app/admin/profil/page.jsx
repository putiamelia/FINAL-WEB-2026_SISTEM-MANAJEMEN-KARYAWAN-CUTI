'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { User, Mail, Phone, MapPin, Building2, Shield, Calendar, Check, AlertCircle } from 'lucide-react';
import { formatDateIndo } from '@/lib/utils';

export default function ProfilAdminPage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [namaLengkap, setNamaLengkap] = useState('');
  const [nomorTelepon, setNomorTelepon] = useState('');
  const [alamat, setAlamat] = useState('');
  const [password, setPassword] = useState('');
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch('/api/user/profile');
        if (res.ok) {
          const data = await res.json();
          setProfile(data.profile);
          setNamaLengkap(data.profile.nama_lengkap || '');
          setNomorTelepon(data.profile.nomor_telepon || '');
          setAlamat(data.profile.alamat || '');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  async function handleUpdate(e) {
    e.preventDefault();
    setError('');
    setToast('');
    setSaving(true);

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama_lengkap: namaLengkap,
          nomor_telepon: nomorTelepon,
          alamat: alamat,
          password: password.trim() ? password : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Gagal memperbarui profil');
        setSaving(false);
        return;
      }

      setToast('Profil berhasil diperbarui');
      setPassword('');
      setSaving(false);
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan sistem');
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center text-sm text-gray-500">Memuat profil...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0B2545]">Profil Administrator</h1>
          <p className="text-sm text-gray-500 mt-1">
            Informasi akun dan kredensial administrator sistem e-Cuti Bank Nusantara.
          </p>
        </div>

        {toast && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded flex items-center gap-2 text-sm">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{toast}</span>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded flex items-center gap-2 text-sm">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Kartu Info Akun */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 flex flex-col items-center text-center shadow-sm">
            <div className="w-20 h-20 rounded-full bg-[#0B2545] text-[#C8A24A] font-bold text-2xl flex items-center justify-center mb-4 shadow">
              {profile?.nama_lengkap?.charAt(0) || 'A'}
            </div>
            <h2 className="text-base font-bold text-[#0B2545]">{profile?.nama_lengkap}</h2>
            <div className="text-xs text-gray-500 font-mono mt-0.5">NIP: {profile?.nip || '-'}</div>

            <span className="inline-block mt-3 px-3 py-1 bg-purple-100 text-purple-800 text-xs font-semibold rounded-full">
              {profile?.role}
            </span>

            <div className="w-full mt-6 pt-6 border-t border-gray-200 space-y-3 text-left text-xs">
              <div className="flex items-center gap-2 text-gray-600">
                <Building2 className="w-4 h-4 text-gray-400" />
                <span>{profile?.nama_divisi || 'Divisi IT & Keamanan'}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="truncate">{profile?.email}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span>Bergabung: {formatDateIndo(profile?.tanggal_masuk)}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Shield className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700 font-medium">Hak Akses Penuh Sistem</span>
              </div>
            </div>
          </div>

          {/* Form Edit */}
          <div className="md:col-span-2 bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <h3 className="text-base font-bold text-[#0B2545] mb-4 pb-2 border-b border-gray-100">
              Perbarui Data Pribadi
            </h3>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Nama Lengkap
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={namaLengkap}
                    onChange={(e) => setNamaLengkap(e.target.value)}
                    className="input-field pl-9"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Email Kantor (Read-only)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    disabled
                    value={profile?.email || ''}
                    className="input-field pl-9 bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                </div>
                <span className="text-[11px] text-gray-400">Email digunakan sebagai pengenal akun resmi.</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Nomor Telepon / WhatsApp
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={nomorTelepon}
                    onChange={(e) => setNomorTelepon(e.target.value)}
                    placeholder="081234567890"
                    className="input-field pl-9"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Alamat Domisili
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={alamat}
                    onChange={(e) => setAlamat(e.target.value)}
                    placeholder="Jl. Thamrin No. 45, Jakarta Pusat"
                    className="input-field pl-9"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Ganti Kata Sandi (Opsional)
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Kosongkan jika tidak ingin mengubah kata sandi"
                  className="input-field"
                />
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary py-2.5 px-6 text-xs font-semibold disabled:opacity-50"
                >
                  {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
