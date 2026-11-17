'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarCheck, ShieldCheck, Users, AlertCircle, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('karis.kabanga');
  const [password, setPassword] = useState('password123');
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

  function setQuickAccount(user, pass) {
    setIdentifier(user);
    setPassword(pass);
    setErrorMsg('');
  }

  return (
    <main className="min-h-screen bg-[#F1F3F6] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-5xl bg-white rounded-lg shadow-sm border border-[#D9DEE5] overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">
        {/* Kolom Kiri: Branding & Visual BNS Bank Nusantara */}
        <div className="lg:col-span-7 flex flex-col justify-between bg-white border-b lg:border-b-0 lg:border-r border-[#D9DEE5]">
          {/* Bagian Atas: Logo & Tagline */}
          <div className="pt-8 sm:pt-10 px-6 sm:px-8 pb-0 text-center flex-1 flex flex-col justify-between">
            <div>
              {/* Logo BNS bersih tanpa garis kotak luar */}
              <div className="mb-3 sm:mb-4">
                <img
                  src="/assets/logo-bns.png"
                  alt="Bank Nusantara Logo"
                  className="h-14 sm:h-16 w-auto mx-auto object-contain"
                />
              </div>
              <p className="text-xs sm:text-sm text-[#4A5565] max-w-sm sm:max-w-md mx-auto leading-relaxed">
                Urus cuti tanpa ribet, nikmati waktu yang berarti. Satu tempat untuk pengajuan, persetujuan, dan jadwal cuti seluruh tim Anda.
              </p>
            </div>

            {/* Foto Karyawan BNS: Ukuran besar, Karyawati (hijab) di kiri, Karyawan (jas) di kanan, menyatu langsung dengan latar */}
            <div className="mt-4 sm:mt-6 flex items-end justify-center -space-x-6 sm:-space-x-10 px-2 overflow-hidden">
              <div className="w-48 sm:w-56 md:w-64 h-64 sm:h-80 md:h-[370px] relative z-10 flex items-end justify-center">
                <img
                  src="/assets/foto-karyawan.png"
                  alt="Karyawati Bank Nusantara"
                  className="w-full h-full object-contain object-bottom drop-shadow-sm"
                />
              </div>
              <div className="w-48 sm:w-56 md:w-64 h-68 sm:h-84 md:h-[390px] relative z-0 flex items-end justify-center">
                <img
                  src="/assets/foto-karyawati.png"
                  alt="Karyawan Bank Nusantara"
                  className="w-full h-full object-contain object-bottom drop-shadow-sm"
                />
              </div>
            </div>
          </div>

          {/* Bagian Bawah: Navy Banner Selamat Datang */}
          <div className="bg-[#0B2545] p-6 sm:p-8 text-white border-t border-[#081B33]">
            <div className="text-[11px] font-semibold text-[#E3C06D] tracking-widest uppercase mb-1">
              Selamat Datang
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-2">
              Insan Bank Nusantara
            </h1>
            <p className="text-xs sm:text-sm text-[#C9D3E3] mb-4">
              Masuk dengan akun pegawai untuk mengelola cuti Anda.
            </p>

            {/* Feature Chips */}
            <div className="flex flex-wrap gap-2 text-xs">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#13315C] text-[#C9D3E3] border border-[#17386B]">
                <CalendarCheck className="w-3.5 h-3.5 text-[#E3C06D]" aria-hidden="true" />
                <span>Pengajuan cuti</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#13315C] text-[#C9D3E3] border border-[#17386B]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#E3C06D]" aria-hidden="true" />
                <span>Persetujuan atasan</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#13315C] text-[#C9D3E3] border border-[#17386B]">
                <Users className="w-3.5 h-3.5 text-[#E3C06D]" aria-hidden="true" />
                <span>Jadwal tim</span>
              </div>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Formulir Login */}
        <div className="lg:col-span-5 p-6 sm:p-8 lg:p-10 flex flex-col justify-between bg-white">
          <div>
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-[#0B2545]">
                Masuk ke Akun Pegawai
              </h2>
              <div className="w-16 h-0.5 bg-[#C8A24A] mx-auto mt-2 mb-2.5"></div>
              <p className="text-xs text-[#4A5565]">
                Masuk dengan email atau username dan kata sandi akun Anda.
              </p>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded bg-[#FEE2E2] border border-[#FECACA] flex items-start gap-2 text-xs text-[#991B1B]">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="identifier"
                  className="block text-xs font-semibold text-[#1B2430] uppercase tracking-wider mb-1.5"
                >
                  Email atau username
                </label>
                <input
                  id="identifier"
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Contoh: rina.maharani"
                  className="input-field"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold text-[#1B2430] uppercase tracking-wider mb-1.5"
                >
                  Kata sandi
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="input-field"
                />
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-[#4A5565]">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-[#13315C] rounded border-[#D9DEE5] focus:ring-[#13315C]"
                  />
                  <span>Ingat saya di perangkat ini</span>
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
                className="w-full btn-primary text-sm mt-2"
              >
                {loading ? 'Memproses Masuk...' : 'Masuk'}
              </button>
            </form>

            {/* Info Kotak Penilai & Catatan Deteksi Role Otomatis */}
            <div className="mt-5 p-3 rounded bg-[#FBFAF7] border border-[#D9DEE5] text-xs text-[#4A5565] leading-relaxed">
              <p className="font-semibold text-[#0B2545] mb-1">Peran Terdeteksi Otomatis:</p>
              <p>
                Peran Anda (Admin, Karyawan, Ketua Divisi, atau HRD) terdeteksi otomatis setelah masuk. Kendala akun? Hubungi Admin sistem.
              </p>
            </div>

            {/* Akses Cepat untuk Penilai / Penguji Praktikum */}
            <div className="mt-4 pt-4 border-t border-[#E6EAF0]">
              <p className="text-[11px] font-semibold text-[#4A5565] uppercase tracking-wider mb-2">
                Akses Cepat Penguji:
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setQuickAccount('karis.kabanga', 'password123')}
                  className="p-2 rounded text-left border border-[#D9DEE5] hover:bg-[#F1F3F6] transition-colors"
                >
                  <span className="font-semibold text-[#13315C] block">Karyawan</span>
                  <span className="text-[11px] text-[#4A5565]">karis.kabanga</span>
                </button>
                <button
                  type="button"
                  onClick={() => setQuickAccount('dylan.dwiputra', 'password123')}
                  className="p-2 rounded text-left border border-[#D9DEE5] hover:bg-[#F1F3F6] transition-colors"
                >
                  <span className="font-semibold text-[#13315C] block">Ketua Divisi</span>
                  <span className="text-[11px] text-[#4A5565]">dylan.dwiputra</span>
                </button>
                <button
                  type="button"
                  onClick={() => setQuickAccount('puti.amelia', 'password123')}
                  className="p-2 rounded text-left border border-[#D9DEE5] hover:bg-[#F1F3F6] transition-colors"
                >
                  <span className="font-semibold text-[#13315C] block">HRD</span>
                  <span className="text-[11px] text-[#4A5565]">puti.amelia</span>
                </button>
                <button
                  type="button"
                  onClick={() => setQuickAccount('admin', 'password123')}
                  className="p-2 rounded text-left border border-[#D9DEE5] hover:bg-[#F1F3F6] transition-colors"
                >
                  <span className="font-semibold text-[#13315C] block">Admin</span>
                  <span className="text-[11px] text-[#4A5565]">admin</span>
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center text-[11px] text-[#4A5565]">
            &copy; 2026 Bank Nusantara. Sistem internal untuk pegawai.
          </div>
        </div>
      </div>
    </main>
  );
}
