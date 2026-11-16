'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { User, Mail, Phone, MapPin, Building2, Shield, Calendar, Check, AlertCircle } from 'lucide-react';
import { formatDecimal, formatDateIndo } from '@/lib/utils';

export default function ProfilKaryawanPage() {
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

      setToast('Profil berhasil diperbarui.');
      setPassword('');
      setTimeout(() => setToast(''), 4000);
    } catch (err) {
      setError('Terjadi kendala jaringan.');
    } finally {
      setSaving(false);
    }
  }

  const sisa = profile ? parseFloat(profile.sisa_kuota_tahunan) : 7.5;
  const awal = profile ? parseFloat(profile.kuota_tahunan_awal) : 12.0;
  const terpakai = profile ? parseFloat(profile.kuota_terpakai) : 4.5;
  const percent = awal > 0 ? (sisa / awal) * 100 : 0;

  return (
    <DashboardLayout
      breadcrumbs={[
        { href: '/karyawan/dashboard', label: 'Dashboard' },
        { label: 'Profil Saya' },
      ]}
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0B2545] tracking-tight">
          Informasi Profil Pegawai
        </h1>
        <p className="text-xs text-[#4A5565] mt-1">
          Kelola data pribadi Anda dan periksa informasi kuota cuti tahunan.
        </p>
      </div>

      {toast && (
        <div className="mb-6 p-4 rounded bg-[#DCFCE7] border border-[#BBF7D0] text-xs font-semibold text-[#14532D] flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 rounded bg-[#FEE2E2] border border-[#FECACA] text-xs font-semibold text-[#991B1B] flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Kolom Kiri: Kartu Ringkasan Akun & Kuota (4 Kolom) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-md border border-[#D9DEE5] p-6 text-center shadow-sm">
            <img
              src={profile?.foto_profil || '/assets/foto-karyawati.png'}
              alt={profile?.nama_lengkap || 'Karyawan'}
              className="w-24 h-24 rounded-full mx-auto object-cover border-2 border-[#13315C] shadow-sm mb-4"
            />
            <h2 className="text-lg font-bold text-[#0B2545]">{profile?.nama_lengkap}</h2>
            <p className="text-xs text-[#4A5565]">{profile?.jabatan} &bull; {profile?.nama_divisi || 'Layanan Nasabah'}</p>
            <span className="inline-block mt-2 px-3 py-1 bg-[#DBEAFE] text-[#1E3A8A] text-xs font-semibold rounded">
              {profile?.role}
            </span>
          </div>

          {/* Kartu Ringkasan Kuota */}
          <div className="bg-[#FBFAF7] rounded-md border border-[#D9DEE5] p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-[#0B2545] uppercase tracking-wider border-b-2 border-[#C8A24A] pb-1.5">
              Saldo Kuota Cuti Tahunan
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#4A5565]">Total Kuota Awal:</span>
                <span className="font-semibold text-[#1B2430]">{formatDecimal(awal)} hari</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#4A5565]">Kuota Terpakai:</span>
                <span className="font-semibold text-[#991B1B]">{formatDecimal(terpakai)} hari</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-[#E6EAF0]">
                <span className="text-[#0B2545] font-bold">Sisa Kuota Aktif:</span>
                <span className="font-bold text-[#13315C] text-sm">{formatDecimal(sisa)} hari</span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-[#E2E8F0] h-2.5 rounded-full overflow-hidden mt-2">
              <div
                className="bg-[#13315C] h-full rounded-full transition-all"
                style={{ width: `${percent}%` }}
              />
            </div>
            <p className="text-[11px] text-[#4A5565] text-center">
              Tersisa {Math.round(percent)}% dari hak cuti tahunan berjalan.
            </p>
          </div>
        </div>

        {/* Kolom Kanan: Form Edit Data (8 Kolom) */}
        <div className="lg:col-span-8 bg-white rounded-md border border-[#D9DEE5] p-6 shadow-sm">
          <h2 className="text-base font-bold text-[#0B2545] border-b border-[#E6EAF0] pb-3 mb-6">
            Perbarui Informasi Diri
          </h2>

          <form onSubmit={handleUpdate} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#1B2430] uppercase mb-1.5">
                  Username
                </label>
                <input
                  type="text"
                  readOnly
                  value={profile?.username || ''}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1B2430] uppercase mb-1.5">
                  Email Pegawai
                </label>
                <input
                  type="email"
                  readOnly
                  value={profile?.email || ''}
                  className="input-field"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#1B2430] uppercase mb-1.5">
                  Nama Lengkap <span className="text-[#991B1B]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={namaLengkap}
                  onChange={(e) => setNamaLengkap(e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1B2430] uppercase mb-1.5">
                  Nomor Telepon / WhatsApp
                </label>
                <input
                  type="text"
                  value={nomorTelepon}
                  onChange={(e) => setNomorTelepon(e.target.value)}
                  className="input-field"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1B2430] uppercase mb-1.5">
                Alamat Tempat Tinggal
              </label>
              <textarea
                rows={2}
                value={alamat}
                onChange={(e) => setAlamat(e.target.value)}
                className="input-field py-2 h-auto text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#E6EAF0]">
              <div>
                <label className="block text-xs font-semibold text-[#1B2430] uppercase mb-1.5">
                  Ubah Kata Sandi (Opsional)
                </label>
                <input
                  type="password"
                  placeholder="Kosongkan jika tidak ingin mengubah"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1B2430] uppercase mb-1.5">
                  Tanggal Bergabung
                </label>
                <input
                  type="text"
                  readOnly
                  value={profile ? formatDateIndo(profile.tanggal_bergabung) : '-'}
                  className="input-field"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={saving}
                className="btn-primary text-xs h-11 px-6"
              >
                {saving ? 'Menyimpan Perubahan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
