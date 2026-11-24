'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CalendarCheck, ShieldCheck, Users, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [activeRole, setActiveRole] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password, rememberMe }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Autentikasi gagal. Silakan periksa kembali email/username dan kata sandi Anda.');
        setLoading(false);
        return;
      }

      // Redirect otomatis sesuai role pengguna
      const role = data.user.role;
      if (role === 'Admin') {
        router.push('/admin/dashboard');
      } else if (role === 'HRD') {
        router.push('/hrd/dashboard');
      } else if (role === 'Ketua Divisi') {
        router.push('/ketua/dashboard');
      } else {
        router.push('/karyawan/dashboard');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Terjadi kendala koneksi ke server. Pastikan database dan server berjalan.');
      setLoading(false);
    }
  }

  function setQuickAccount(roleName, user, pass) {
    setActiveRole(roleName);
    setIdentifier(user);
    setPassword(pass);
    setErrorMsg('');
  }

  return (
    <main className="min-h-screen w-full bg-white flex flex-col lg:grid lg:grid-cols-12 overflow-x-hidden">
      {/* Kolom Kiri: Branding & Visual BNS Bank Nusantara (Desktop 7 cols / Mobile & Tablet stacked di bawah) */}
      <div className="order-2 lg:order-1 lg:col-span-7 flex flex-col justify-between bg-white border-t lg:border-t-0 lg:border-r border-[#D9DEE5] lg:min-h-screen">
        {/* Bagian Atas: Logo, Tagline, dan Foto Karyawan Besar (Tampil di Desktop / Layar Lebar) */}
        <div className="pt-8 sm:pt-12 px-6 sm:px-12 text-center flex-1 flex flex-col justify-between">
          <div className="hidden lg:block">
            {/* Logo BNS bersih tanpa kotak garis luar, berlatar putih murni */}
            <div className="mb-4 sm:mb-5">
              <img
                src="/assets/logo-bns.png"
                alt="Bank Nusantara Logo"
                className="h-16 sm:h-20 w-auto mx-auto object-contain"
              />
            </div>
            <p className="text-base sm:text-lg text-[#334155] max-w-xl mx-auto leading-relaxed font-medium">
              Urus cuti tanpa ribet, nikmati waktu yang berarti. Satu tempat untuk pengajuan, persetujuan, dan jadwal cuti seluruh tim Anda.
            </p>
          </div>

          {/* Foto Karyawan BNS: Ukuran besar, tampil penuh di layar desktop/laptop */}
          <div className="hidden lg:flex items-end justify-center -space-x-10 sm:-space-x-16 px-4 overflow-hidden pt-4">
            <div className="w-56 sm:w-72 md:w-80 lg:w-96 h-80 sm:h-96 md:h-[430px] lg:h-[470px] relative z-10 flex items-end justify-center">
              <img
                src="/assets/foto-karyawan.png"
                alt="Karyawati Bank Nusantara"
                className="w-full h-full object-contain object-bottom drop-shadow-sm"
              />
            </div>
            <div className="w-56 sm:w-72 md:w-80 lg:w-96 h-84 sm:h-[400px] md:h-[450px] lg:h-[490px] relative z-0 flex items-end justify-center">
              <img
                src="/assets/foto-karyawati.png"
                alt="Karyawan Bank Nusantara"
                className="w-full h-full object-contain object-bottom drop-shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* Bagian Bawah: Navy Banner Selamat Datang */}
        <div className="bg-[#0B2545] p-6 sm:p-8 lg:p-12 text-white border-t border-[#081B33]">
          <div className="text-xs sm:text-sm font-bold text-[#E3C06D] tracking-widest uppercase mb-1.5">
            Selamat Datang
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-white mb-2">
            Insan Bank Nusantara
          </h1>
          <p className="text-xs sm:text-sm lg:text-base text-[#C9D3E3] mb-4 lg:mb-5">
            Masuk dengan akun pegawai untuk mengelola cuti Anda.
          </p>

          {/* Feature Chips */}
          <div className="flex flex-wrap gap-2 sm:gap-2.5 text-xs sm:text-sm">
            <div className="flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded bg-[#13315C] text-[#C9D3E3] border border-[#17386B] font-medium">
              <CalendarCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#E3C06D]" aria-hidden="true" />
              <span>Pengajuan cuti</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded bg-[#13315C] text-[#C9D3E3] border border-[#17386B] font-medium">
              <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#E3C06D]" aria-hidden="true" />
              <span>Persetujuan atasan</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded bg-[#13315C] text-[#C9D3E3] border border-[#17386B] font-medium">
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#E3C06D]" aria-hidden="true" />
              <span>Jadwal tim</span>
            </div>
          </div>
        </div>
      </div>

      {/* Kolom Kanan: Formulir Login (Tampil di atas saat mobile/tablet agar langsung bisa login) */}
      <div className="order-1 lg:order-2 lg:col-span-5 p-5 sm:p-10 lg:p-12 xl:p-16 flex flex-col justify-between bg-white lg:min-h-screen">
        <div className="max-w-md w-full mx-auto my-auto py-4 sm:py-6">
          {/* Header Mobile / Tablet: Logo BNS tampil di atas form saat layar kecil/tablet */}
          <div className="lg:hidden text-center mb-6">
            <img
              src="/assets/logo-bns.png"
              alt="Bank Nusantara Logo"
              className="h-12 sm:h-14 w-auto mx-auto object-contain mb-2.5"
            />
            <p className="text-xs sm:text-sm text-[#4A5565] max-w-sm mx-auto leading-relaxed">
              Urus cuti tanpa ribet, nikmati waktu yang berarti. Satu tempat untuk pengajuan, persetujuan, dan jadwal cuti.
            </p>
          </div>

          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0B2545]">
              Masuk ke Akun Pegawai
            </h2>
            <div className="w-16 h-0.5 bg-[#C8A24A] mx-auto mt-2 mb-2 sm:mb-2.5"></div>
            <p className="text-xs sm:text-sm text-[#4A5565]">
              Masuk dengan email atau username dan kata sandi akun Anda.
            </p>
          </div>

          {errorMsg && (
            <div className="mb-5 p-3.5 rounded bg-[#FEE2E2] border border-[#FECACA] flex items-start gap-2 text-xs sm:text-sm text-[#991B1B]">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            <div>
              <label
                htmlFor="identifier"
                className="block text-xs sm:text-sm font-bold text-[#1B2430] uppercase tracking-wider mb-2"
              >
                Email atau username
              </label>
              <input
                id="identifier"
                type="text"
                required
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.target.value);
                  setActiveRole('');
                }}
                placeholder="Masukkan email atau username..."
                className="input-field h-11 sm:h-12 text-sm sm:text-base px-3.5 w-full"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs sm:text-sm font-bold text-[#1B2430] uppercase tracking-wider mb-2"
              >
                Kata sandi
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setActiveRole('');
                }}
                placeholder="Masukkan kata sandi..."
                className="input-field h-11 sm:h-12 text-sm sm:text-base px-3.5 w-full"
              />
            </div>

            <div className="flex items-center justify-between text-xs sm:text-sm pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-[#4A5565]">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-[#13315C] rounded border-[#D9DEE5] focus:ring-[#13315C]"
                />
                <span>Ingat saya</span>
              </label>
              <button
                type="button"
                onClick={() => alert('Silakan hubungi Admin sistem atau HRD untuk reset kata sandi Anda.')}
                className="text-[#13315C] font-semibold hover:underline"
              >
                Lupa kata sandi?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary h-11 sm:h-12 text-base font-semibold mt-2"
            >
              {loading ? 'Memproses Masuk...' : 'Masuk'}
            </button>

            <div className="text-center pt-2">
              <span className="text-xs text-[#4A5565]">Belum memiliki akun pegawai? </span>
              <Link href="/register" className="text-xs font-semibold text-[#13315C] hover:underline">
                Daftar Akun Baru
              </Link>
            </div>
          </form>

          {/* Info Kotak Penilai & Catatan Deteksi Role Otomatis */}
          <div className="mt-6 p-3.5 rounded bg-[#FBFAF7] border border-[#D9DEE5] text-xs sm:text-sm text-[#4A5565] leading-relaxed">
            <p className="font-bold text-[#0B2545] mb-1">Peran Terdeteksi Otomatis:</p>
            <p>
              Peran Anda (Admin, Karyawan, Ketua Divisi, atau HRD) terdeteksi otomatis setelah masuk. Kendala akun? Hubungi Admin sistem.
            </p>
          </div>

          {/* Akses Cepat untuk Penilai / Penguji Praktikum */}
          <div className="mt-5 pt-5 border-t border-[#E6EAF0]">
            <p className="text-xs font-bold text-[#4A5565] uppercase tracking-wider mb-2.5">
              Akses Cepat Penguji:
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
              <button
                type="button"
                onClick={() => setQuickAccount('Karyawan', 'karis.kabanga', 'password123')}
                className={`p-2.5 rounded text-left border transition-all ${
                  activeRole === 'Karyawan'
                    ? 'border-[#13315C] bg-[#EEF1F5] ring-2 ring-[#13315C]/20 shadow-sm'
                    : 'border-[#D9DEE5] hover:bg-[#F1F3F6]'
                }`}
              >
                <span className="font-bold text-[#13315C] block">Karyawan</span>
                <span className="text-xs text-[#4A5565]">karis.kabanga</span>
              </button>
              <button
                type="button"
                onClick={() => setQuickAccount('Ketua Divisi', 'dylan.dwiputra', 'password123')}
                className={`p-2.5 rounded text-left border transition-all ${
                  activeRole === 'Ketua Divisi'
                    ? 'border-[#13315C] bg-[#EEF1F5] ring-2 ring-[#13315C]/20 shadow-sm'
                    : 'border-[#D9DEE5] hover:bg-[#F1F3F6]'
                }`}
              >
                <span className="font-bold text-[#13315C] block">Ketua Divisi</span>
                <span className="text-xs text-[#4A5565]">dylan.dwiputra</span>
              </button>
              <button
                type="button"
                onClick={() => setQuickAccount('HRD', 'puti.amelia', 'password123')}
                className={`p-2.5 rounded text-left border transition-all ${
                  activeRole === 'HRD'
                    ? 'border-[#13315C] bg-[#EEF1F5] ring-2 ring-[#13315C]/20 shadow-sm'
                    : 'border-[#D9DEE5] hover:bg-[#F1F3F6]'
                }`}
              >
                <span className="font-bold text-[#13315C] block">HRD</span>
                <span className="text-xs text-[#4A5565]">puti.amelia</span>
              </button>
              <button
                type="button"
                onClick={() => setQuickAccount('Admin', 'admin', 'password123')}
                className={`p-2.5 rounded text-left border transition-all ${
                  activeRole === 'Admin'
                    ? 'border-[#13315C] bg-[#EEF1F5] ring-2 ring-[#13315C]/20 shadow-sm'
                    : 'border-[#D9DEE5] hover:bg-[#F1F3F6]'
                }`}
              >
                <span className="font-bold text-[#13315C] block">Admin</span>
                <span className="text-xs text-[#4A5565]">admin</span>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-[#4A5565]">
          &copy; 2026 Bank Nusantara. Sistem internal untuk pegawai.
        </div>
      </div>
    </main>
  );
}
