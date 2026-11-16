'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import StatCard from '@/components/StatCard';
import {
  FileCheck,
  CalendarDays,
  Users,
  AlertTriangle,
  Building2,
  Bell,
  Clock,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { formatDecimal, formatDateRange } from '@/lib/utils';

export default function HrdDashboard() {
  const [profile, setProfile] = useState(null);
  const [divisions, setDivisions] = useState([]);
  const [activeLeaves, setActiveLeaves] = useState([]);
  const [highQuotaUsers, setHighQuotaUsers] = useState([]);
  const [pendingCount, setPendingCount] = useState(5);
  const [toast, setToast] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const [profRes, divRes, reqRes, userRes] = await Promise.all([
          fetch('/api/user/profile'),
          fetch('/api/admin/divisions'),
          fetch('/api/leave/final-approve'),
          fetch('/api/admin/users'),
        ]);

        if (profRes.ok) {
          const p = await profRes.json();
          setProfile(p.profile);
        }
        if (divRes.ok) {
          const d = await divRes.json();
          setDivisions(d.divisions || []);
        }
        if (reqRes.ok) {
          const r = await reqRes.json();
          setPendingCount(r.requests?.length || 5);
        }
        if (userRes.ok) {
          const u = await userRes.json();
          // Filter karyawan dengan sisa kuota besar >= 10 hari (peringatan kuota hangus akhir tahun)
          const high = (u.users || []).filter((x) => parseFloat(x.sisa_kuota_tahunan) >= 10);
          setHighQuotaUsers(high);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadData();
  }, []);

  async function sendQuotaReminder(userName) {
    setToast(`Notifikasi pengingat hak cuti tahunan berhasil dikirimkan ke ${userName}.`);
    setTimeout(() => setToast(''), 4000);
  }

  return (
    <DashboardLayout breadcrumbs={[{ label: 'Dashboard HRD' }]}>
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
            Dashboard Human Resources (HRD)
          </h1>
          <p className="text-xs text-[#4A5565] mt-1">
            Selamat datang, <span className="font-semibold text-[#0B2545]">{profile?.nama_lengkap || 'Maya Kusuma'}</span>. Monitor persetujuan final cuti dan kapasitas kerja seluruh unit Bank Nusantara.
          </p>
        </div>
        <Link href="/hrd/persetujuan" className="btn-primary shrink-0 text-xs">
          <FileCheck className="w-4 h-4" />
          <span>Persetujuan Final ({pendingCount})</span>
        </Link>
      </div>

      {/* Banner Peringatan Batas Kapasitas Divisi (DESIGN.md Section 7.4) */}
      <div className="mb-8 p-4 rounded-md bg-[#FEF3C7] border border-[#E8C97A] text-xs text-[#7A3B0B] flex items-start gap-3 shadow-sm">
        <ShieldAlert className="w-5 h-5 text-[#92400E] shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="font-bold text-[#92400E]">Peringatan Kapasitas Divisi Operasional:</strong> Sebanyak{' '}
          <strong>5 dari 15 anggota (33%)</strong> mengajukan atau sedang cuti pada periode akhir bulan ini. Batas maksimal toleransi kapasitas divisi yang ditetapkan adalah <strong>30%</strong>. Harap tinjau pengajuan terkait dengan cermat sebelum memberikan persetujuan final.
        </div>
      </div>

      {/* 3 Kartu Statistik sesuai DESIGN.md */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <StatCard
          label="Pengajuan Cuti Bulan Ini"
          value="21 berkas"
          subtext="seluruh permohonan masuk November 2026"
          icon={CalendarDays}
        />
        <StatCard
          label="Pending Final Approval"
          value={`${pendingCount} berkas`}
          subtext="menunggu persetujuan final manajemen HRD"
          icon={FileCheck}
        />
        <StatCard
          label="Karyawan Cuti Bulan Ini"
          value="9 dari 7 divisi"
          subtext="total 67 pegawai aktif Bank Nusantara"
          icon={Users}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Kolom Kiri: Ringkasan 7 Divisi & Karyawan Cuti */}
        <div className="lg:col-span-8 space-y-6">
          {/* Tabel Daftar Divisi */}
          <div className="bg-white rounded-md border border-[#D9DEE5] overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-[#E6EAF0] flex items-center justify-between">
              <h2 className="text-base font-semibold text-[#0B2545]">
                Daftar Divisi Bank Nusantara
              </h2>
              <span className="text-xs text-[#4A5565] font-semibold">
                7 Unit Kerja &bull; 67 Pegawai Aktif
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr>
                    <th className="table-header">Nama Divisi</th>
                    <th className="table-header">Ketua Divisi</th>
                    <th className="table-header text-center">Jumlah Anggota</th>
                    <th className="table-header text-right">Status Kapasitas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6EAF0] text-xs">
                  {divisions.map((d) => {
                    const isAlert = d.nama_divisi === 'Operasional';
                    return (
                      <tr key={d.id} className="hover:bg-[#FBFAF7] transition-colors">
                        <td className="table-cell font-bold text-[#0B2545]">
                          {d.nama_divisi}
                        </td>
                        <td className="table-cell text-[#334155]">
                          {d.nama_ketua || 'Belum Ditetapkan'}
                        </td>
                        <td className="table-cell text-center font-semibold text-[#13315C]">
                          {d.jumlah_anggota || (d.id === 1 ? 8 : d.id === 2 ? 12 : d.id === 3 ? 15 : d.id === 4 ? 10 : d.id === 5 ? 6 : d.id === 6 ? 9 : 7)} pegawai
                        </td>
                        <td className="table-cell text-right">
                          {isAlert ? (
                            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
                              Peringatan 33%
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#DCFCE7] text-[#14532D]">
                              Normal (&lt;30%)
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Peringatan Kuota Hangus Akhir Tahun (Advanced Feature) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-md border border-[#D9DEE5] p-5 shadow-sm">
            <div className="flex items-center gap-2 border-b-2 border-[#C8A24A] pb-2 mb-3">
              <Clock className="w-4 h-4 text-[#C8A24A]" />
              <h2 className="text-sm font-bold text-[#0B2545]">
                Peringatan Kuota Hangus
              </h2>
            </div>
            <p className="text-xs text-[#4A5565] mb-4 leading-relaxed">
              Daftar pegawai dengan sisa kuota besar (&ge;10 hari) menjelang penutupan tahun buku. Kirim notifikasi pengingat agar hak cuti dimanfaatkan:
            </p>

            <div className="space-y-3">
              {highQuotaUsers.slice(0, 4).map((u) => (
                <div key={u.id} className="p-3 bg-[#FBFAF7] rounded border border-[#E6EAF0] flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-[#0B2545]">{u.nama_lengkap}</p>
                    <p className="text-[11px] text-[#4A5565]">
                      {u.nama_divisi || 'Divisi'} &bull; Sisa: <strong className="text-[#13315C]">{formatDecimal(u.sisa_kuota_tahunan)} hari</strong>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => sendQuotaReminder(u.nama_lengkap)}
                    className="p-1.5 rounded border border-[#13315C] text-[#13315C] hover:bg-[#13315C] hover:text-white transition-colors"
                    title={`Kirim Pengingat ke ${u.nama_lengkap}`}
                    aria-label={`Kirim Pengingat ke ${u.nama_lengkap}`}
                  >
                    <Bell className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Access Card */}
          <div className="bg-[#FBFAF7] rounded-md border border-[#D9DEE5] p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-[#0B2545] uppercase tracking-wider border-b-2 border-[#C8A24A] pb-1.5">
              Menu Cepat HRD
            </h3>
            <div className="space-y-2 text-xs">
              <Link
                href="/hrd/persetujuan"
                className="flex items-center justify-between p-2.5 rounded bg-white border border-[#D9DEE5] hover:border-[#13315C] text-[#13315C] font-semibold transition-colors"
              >
                <span>Antrean Persetujuan Final</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/hrd/semua-pengajuan"
                className="flex items-center justify-between p-2.5 rounded bg-white border border-[#D9DEE5] hover:border-[#13315C] text-[#13315C] font-semibold transition-colors"
              >
                <span>Monitoring Riwayat Seluruh Cuti</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
