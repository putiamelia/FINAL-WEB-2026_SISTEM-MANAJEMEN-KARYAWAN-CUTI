'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import StatCard from '@/components/StatCard';
import StatusBadge from '@/components/StatusBadge';
import {
  CheckSquare,
  Users,
  CalendarCheck,
  CalendarPlus,
  ChevronRight,
  AlertCircle,
  Clock,
  ArrowUpRight,
} from 'lucide-react';
import { formatDateRange, formatDecimal } from '@/lib/utils';

export default function KetuaDashboard() {
  const [profile, setProfile] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [members, setMembers] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [profRes, verifyRes, userRes, myRes] = await Promise.all([
          fetch('/api/user/profile'),
          fetch('/api/leave/verify'),
          fetch('/api/admin/users'),
          fetch('/api/leave/request?limit=5'),
        ]);

        if (profRes.ok) {
          const p = await profRes.json();
          setProfile(p.profile);
        }
        if (verifyRes.ok) {
          const v = await verifyRes.json();
          setPendingRequests(v.requests || []);
        }
        if (userRes.ok) {
          const u = await userRes.json();
          // Filter anggota divisi yang sama
          setMembers(u.users || []);
        }
        if (myRes.ok) {
          const m = await myRes.json();
          setMyRequests(m.requests || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const totalMasuk = 14;
  const pendingCount = pendingRequests.length || 3;
  const cutiMingguIni = 2;
  const totalAnggotaDivisi = 8;

  return (
    <DashboardLayout breadcrumbs={[{ label: 'Dashboard Ketua Divisi' }]}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0B2545] tracking-tight">
            Dashboard Ketua Divisi {profile?.nama_divisi || 'Layanan Nasabah'}
          </h1>
          <p className="text-xs text-[#4A5565] mt-1">
            Selamat datang, <span className="font-semibold text-[#0B2545]">{profile?.nama_lengkap || 'Bagus Santoso'}</span>. Kelola verifikasi cuti anggota tim dan pantau jadwal kerja divisi Anda.
          </p>
        </div>
        <Link href="/ketua/pengajuan" className="btn-primary shrink-0 text-xs">
          <CalendarPlus className="w-4 h-4" />
          <span>Ajukan Cuti ke HRD</span>
        </Link>
      </div>

      {/* 3 Kartu Statistik sesuai DESIGN.md */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <StatCard
          label="Total Pengajuan Masuk"
          value={`${totalMasuk} berkas`}
          subtext="akumulasi pengajuan anggota divisi"
          icon={CalendarCheck}
        />
        <StatCard
          label="Pending Verifikasi"
          value={`${pendingCount} berkas`}
          subtext="memerlukan tindakan verifikasi Anda"
          icon={CheckSquare}
        />
        <StatCard
          label="Sedang Cuti Minggu Ini"
          value={`${cutiMingguIni} dari ${totalAnggotaDivisi} orang`}
          subtext="kehadiran divisi terjaga 75%"
          icon={Users}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Kolom Kiri: Anggota Divisi & Status Minggu Ini */}
        <div className="lg:col-span-8 bg-white rounded-md border border-[#D9DEE5] overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-[#E6EAF0] flex items-center justify-between">
            <h2 className="text-base font-semibold text-[#0B2545]">
              Daftar Anggota Divisi {profile?.nama_divisi || 'Layanan Nasabah'}
            </h2>
            <span className="text-xs text-[#4A5565] font-semibold">
              Total {members.filter(m => m.divisi_id === profile?.divisi_id).length || 8} Pegawai
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className="table-header">Pegawai</th>
                  <th className="table-header">Jabatan</th>
                  <th className="table-header">Status Minggu Ini</th>
                  <th className="table-header">Sisa Kuota</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6EAF0] text-xs">
                {members
                  .filter((m) => m.divisi_id === profile?.divisi_id)
                  .map((m) => {
                    // Cek apakah ada pengajuan aktif minggu ini
                    const isLeave = m.id === 5 || m.id === 6; // Yusuf / Dewi contoh
                    return (
                      <tr key={m.id} className="hover:bg-[#FBFAF7] transition-colors">
                        <td className="table-cell">
                          <div className="flex items-center gap-3">
                            <img
                              src={m.foto_profil || '/assets/foto-karyawan.png'}
                              alt={m.nama_lengkap}
                              className="w-9 h-9 rounded-full object-cover border border-[#D9DEE5]"
                            />
                            <div>
                              <p className="font-bold text-[#1B2430]">{m.nama_lengkap}</p>
                              <p className="text-[11px] text-[#4A5565]">{m.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="table-cell text-[#4A5565]">{m.jabatan || 'Staff'}</td>
                        <td className="table-cell">
                          {isLeave ? (
                            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#FEF3C7] text-[#92400E]">
                              Cuti Terjadwal
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#DCFCE7] text-[#14532D]">
                              Hadir / Aktif
                            </span>
                          )}
                        </td>
                        <td className="table-cell font-semibold text-[#13315C]">
                          {formatDecimal(m.sisa_kuota_tahunan)} hari
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Kolom Kanan: Panel Menunggu Verifikasi & Cuti Pribadi */}
        <div className="lg:col-span-4 space-y-6">
          {/* Panel Menunggu Verifikasi */}
          <div className="bg-white rounded-md border border-[#D9DEE5] p-5 shadow-sm">
            <div className="flex items-center justify-between border-b-2 border-[#C8A24A] pb-2 mb-4">
              <h2 className="text-sm font-bold text-[#0B2545]">
                Menunggu Verifikasi Anda
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#FEF3C7] text-[#92400E]">
                {pendingRequests.length}
              </span>
            </div>

            {pendingRequests.length === 0 ? (
              <p className="text-xs text-[#4A5565] py-4 text-center">
                Semua permohonan anggota telah diverifikasi.
              </p>
            ) : (
              <div className="space-y-3">
                {pendingRequests.slice(0, 3).map((r) => (
                  <div key={r.id} className="p-3 bg-[#FBFAF7] rounded border border-[#E6EAF0] text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#0B2545]">{r.nama_lengkap}</span>
                      <span className="text-[11px] font-semibold text-[#13315C]">{formatDecimal(r.total_hari)} hari</span>
                    </div>
                    <p className="text-[11px] text-[#4A5565]">
                      {r.nama_cuti} &bull; {formatDateRange(r.tanggal_mulai, r.tanggal_selesai)}
                    </p>
                    <p className="text-[11px] text-[#334155] line-clamp-1 italic">
                      "{r.alasan}"
                    </p>
                  </div>
                ))}

                <Link
                  href="/ketua/verifikasi"
                  className="w-full btn-secondary text-xs h-10 mt-2 flex items-center justify-center gap-1.5 font-semibold"
                >
                  <span>Buka Halaman Verifikasi</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>

          {/* Panel Cuti Pribadi Ketua Divisi */}
          <div className="bg-[#FBFAF7] rounded-md border border-[#D9DEE5] p-5 shadow-sm space-y-3">
            <h2 className="text-sm font-bold text-[#0B2545] border-b-2 border-[#C8A24A] pb-2">
              Cuti Pribadi Anda
            </h2>
            <p className="text-xs text-[#4A5565] leading-relaxed">
              Sebagai Ketua Divisi, permohonan cuti Anda diteruskan langsung ke <strong>Human Resources Division (HRD)</strong> tanpa perlu verifikasi atasan divisi.
            </p>
            <div className="pt-2 flex justify-between items-center text-xs">
              <span className="text-[#4A5565]">Sisa Kuota Anda:</span>
              <span className="font-bold text-[#13315C] text-sm">{formatDecimal(profile?.sisa_kuota_tahunan || 10.0)} hari</span>
            </div>
            <Link
              href="/ketua/pengajuan"
              className="w-full btn-primary text-xs h-10 flex items-center justify-center gap-1.5"
            >
              <CalendarPlus className="w-4 h-4" />
              <span>Ajukan Cuti ke HRD</span>
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
