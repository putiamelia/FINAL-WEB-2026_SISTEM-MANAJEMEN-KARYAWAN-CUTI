'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UserPlus, ArrowLeft, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    nama_lengkap: '',
    username: '',
    email: '',
    divisi_id: '',
    jabatan: 'Staff',
    password: '',
    confirmPassword: '',
    nomor_telepon: '',
    alamat: '',
  });

  const [divisions, setDivisions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    async function loadDivisions() {
      try {
        const res = await fetch('/api/auth/register');
        if (res.ok) {
          const data = await res.json();
          setDivisions(data.divisions || []);
          if (data.divisions && data.divisions.length > 0) {
            setFormData((prev) => ({ ...prev, divisi_id: data.divisions[0].id.toString() }));
          }
        }
      } catch (err) {
        console.error('Gagal memuat divisi:', err);
      }
    }
    loadDivisions();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (formData.password !== formData.confirmPassword) {
      setErrorMsg('Konfirmasi kata sandi tidak cocok. Harap periksa kembali.');
      return;
    }

    if (formData.password.length < 6) {
      setErrorMsg('Kata sandi minimal harus 6 karakter.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama_lengkap: formData.nama_lengkap,
          username: formData.username,
          email: formData.email,
          divisi_id: formData.divisi_id,
          jabatan: formData.jabatan,
          password: formData.password,
          nomor_telepon: formData.nomor_telepon,
          alamat: formData.alamat,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Gagal melakukan pendaftaran akun.');
        setLoading(false);
        return;
      }

      setSuccessMsg('Pendaftaran akun berhasil! Mengalihkan ke halaman masuk...');
      setTimeout(() => {
        router.push('/');
      }, 1800);
    } catch (err) {
      console.error(err);
      setErrorMsg('Terjadi kendala koneksi ke server. Pastikan database aktif.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F1F3F6] flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl">
        {/* Header Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center bg-white p-2.5 rounded-lg shadow-sm border border-[#D9DEE5] mb-3">
            <img src="/assets/logo-bns.png" alt="Bank Nusantara" className="h-10 w-auto object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-[#0B2545] tracking-tight">
            Registrasi Pegawai Baru
          </h1>
          <p className="text-xs text-[#4A5565] mt-1">
            Daftarkan akun pegawai Bank Nusantara Anda untuk akses sistem e-Cuti resmi.
          </p>
        </div>

        {/* Card Form */}
        <div className="bg-white py-6 px-6 sm:px-8 rounded-lg shadow-sm border border-[#D9DEE5]">
          {errorMsg && (
            <div className="mb-5 p-3.5 rounded bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 p-3.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Nama Lengkap */}
            <div>
              <label className="block font-semibold text-[#1B2430] mb-1">
                Nama Lengkap Pegawai <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="cth. Bagas Pratama, S.E."
                value={formData.nama_lengkap}
                onChange={(e) => setFormData({ ...formData, nama_lengkap: e.target.value })}
                className="input-field text-xs h-10 w-full"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Username */}
              <div>
                <label className="block font-semibold text-[#1B2430] mb-1">
                  Username <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="cth. bagas.pratama"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="input-field text-xs h-10 w-full"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block font-semibold text-[#1B2430] mb-1">
                  Email Perusahaan <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="bagas@banknusantara.co.id"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input-field text-xs h-10 w-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Divisi */}
              <div>
                <label className="block font-semibold text-[#1B2430] mb-1">
                  Divisi Penempatan <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.divisi_id}
                  onChange={(e) => setFormData({ ...formData, divisi_id: e.target.value })}
                  className="input-field text-xs h-10 w-full"
                >
                  {divisions.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.nama_divisi}
                    </option>
                  ))}
                </select>
              </div>

              {/* Jabatan */}
              <div>
                <label className="block font-semibold text-[#1B2430] mb-1">
                  Jabatan / Posisi
                </label>
                <input
                  type="text"
                  placeholder="cth. Customer Service Staff"
                  value={formData.jabatan}
                  onChange={(e) => setFormData({ ...formData, jabatan: e.target.value })}
                  className="input-field text-xs h-10 w-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Kata Sandi */}
              <div>
                <label className="block font-semibold text-[#1B2430] mb-1">
                  Kata Sandi <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="Minimal 6 karakter"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="input-field text-xs h-10 w-full"
                />
              </div>

              {/* Konfirmasi Kata Sandi */}
              <div>
                <label className="block font-semibold text-[#1B2430] mb-1">
                  Ulangi Kata Sandi <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="Ketik ulang kata sandi"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="input-field text-xs h-10 w-full"
                />
              </div>
            </div>

            {/* Nomor Telepon */}
            <div>
              <label className="block font-semibold text-[#1B2430] mb-1">
                Nomor Telepon / WhatsApp
              </label>
              <input
                type="text"
                placeholder="cth. 08123456789"
                value={formData.nomor_telepon}
                onChange={(e) => setFormData({ ...formData, nomor_telepon: e.target.value })}
                className="input-field text-xs h-10 w-full"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full text-xs h-10 font-semibold flex items-center justify-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>{loading ? 'Mendaftarkan akun...' : 'Daftar Akun Baru'}</span>
              </button>
            </div>
          </form>

          <div className="mt-5 pt-4 border-t border-[#E6EAF0] text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#13315C] hover:underline"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Sudah memiliki akun? Masuk ke sistem</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
