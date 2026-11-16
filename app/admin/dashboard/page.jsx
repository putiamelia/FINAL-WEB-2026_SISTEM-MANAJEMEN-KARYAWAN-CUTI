'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import StatCard from '@/components/StatCard';
import {
  Users,
  CalendarDays,
  Clock,
  Building2,
  AlertCircle,
  ShieldCheck,
  ChevronRight,
  Layers,
} from 'lucide-react';
import { formatDateIndo, formatDecimal } from '@/lib/utils';

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [uRes, dRes] = await Promise.all([
          fetch('/api/admin/users'),
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
    loadData();
  }, []);

  // Filter karyawan dengan masa kerja < 1 tahun dari tanggal 16 November 2026
  // (misal tanggal bergabung setelah 16 November 2025)
  const probationaryUsers = users.filter((u) => {
    if (!u.tanggal_bergabung) return false;
    const joinDate = new Date(u.tanggal_bergabung);
    const benchmark = new Date('2025-11-16');
    return joinDate > benchmark;
  });

  return (
    <DashboardLayout breadcrumbs={[{ label: 'Dashboard Admin' }]}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0B2545] tracking-tight">
            Dashboard Administrator Sistem
          </h1>
          <p className="text-xs text-[#4A5565] mt-1">
            Pusat manajemen master data pegawai, divisi, konfigurasi jenis cuti, dan integritas sistem Bank Nusantara.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/pengguna" className="btn-primary text-xs">
            <Users className="w-4 h-4" />
            <span>Kelola Pegawai</span>
          </Link>
        </div>
      </div>

      {/* 4 Kartu Statistik sesuai DESIGN.md Section 7.5 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total Karyawan"
          value="67 aktif"
          subtext="4 pegawai tidak aktif"
          icon={Users}
        />
        <StatCard
          label="Pengajuan Cuti Bulan Ini"
          value="21 berkas"
          subtext="periode berjalan November 2026"
          icon={CalendarDays}
        />
        <StatCard
          label="Pending Approval"
          value="8 berkas"
          subtext="3 di Ketua Divisi + 5 di HRD"
          icon={Clock}
        />
        <StatCard
          label="Total Divisi"
          value={`${divisions.length || 7} divisi`}
          subtext="semua divisi terstruktur aktif"
          icon={Building2}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Kolom Kiri: Tabel Karyawan Masa Kerja < 1 Tahun (Belum Eligible Cuti Tahunan) */}
        <div className="lg:col-span-7 bg-white rounded-md border border-[#D9DEE5] overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-[#E6EAF0] flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-[#0B2545]">
                Pegawai Masa Kerja &lt; 1 Tahun
              </h2>
              <p className="text-[11px] text-[#4A5565]">
                Status dalam masa percobaan atau belum eligible hak cuti tahunan penuh (12 hari).
              </p>
            </div>
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#FEF3C7] text-[#92400E]">
              {probationaryUsers.length} Pegawai
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className="table-header">Nama Pegawai</th>
                  <th className="table-header">Jabatan & Divisi</th>
                  <th className="table-header">Tanggal Bergabung</th>
                  <th className="table-header text-right">Status Kuota</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6EAF0] text-xs">
                {probationaryUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-[#4A5565]">
                      Seluruh pegawai telah memiliki masa kerja di atas 1 tahun.
                    </td>
                  </tr>
                ) : (
                  probationaryUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-[#FBFAF7] transition-colors">
                      <td className="table-cell">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={u.foto_profil || '/assets/foto-karyawan.png'}
                            alt={u.nama_lengkap}
                            className="w-8 h-8 rounded-full object-cover border border-[#D9DEE5]"
                          />
                          <span className="font-bold text-[#1B2430]">{u.nama_lengkap}</span>
                        </div>
                      </td>
                      <td className="table-cell text-[#4A5565]">
                        {u.jabatan} &bull; {u.nama_divisi || 'Tanpa Divisi'}
                      </td>
                      <td className="table-cell text-[#334155]">
                        {formatDateIndo(u.tanggal_bergabung)}
                      </td>
                      <td className="table-cell text-right">
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#E5E7EB] text-[#374151]">
                          Menunggu 1 Thn
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Kolom Kanan: Ringkasan Anggota per Divisi */}
        <div className="lg:col-span-5 bg-white rounded-md border border-[#D9DEE5] overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-[#E6EAF0] flex items-center justify-between">
            <h2 className="text-base font-semibold text-[#0B2545]">
              Ringkasan Anggota per Divisi
            </h2>
            <Link href="/admin/divisi" className="text-xs text-[#13315C] font-semibold hover:underline">
              Kelola
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className="table-header">Nama Divisi</th>
                  <th className="table-header">Ketua</th>
                  <th className="table-header text-right">Anggota</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6EAF0] text-xs">
                {divisions.map((d) => (
                  <tr key={d.id} className="hover:bg-[#FBFAF7] transition-colors">
                    <td className="table-cell font-bold text-[#0B2545]">
                      {d.nama_divisi}
                    </td>
                    <td className="table-cell text-[#4A5565]">
                      {d.nama_ketua || 'Belum Ada'}
                    </td>
                    <td className="table-cell text-right font-bold text-[#13315C]">
                      {d.jumlah_anggota || (d.id === 1 ? 8 : d.id === 2 ? 12 : d.id === 3 ? 15 : d.id === 4 ? 10 : d.id === 5 ? 6 : d.id === 6 ? 9 : 7)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-[#FBFAF7] font-bold text-xs">
                  <td className="table-cell text-[#0B2545]" colSpan={2}>
                    Total Seluruh Anggota Aktif
                  </td>
                  <td className="table-cell text-right text-[#13315C]">
                    67 Pegawai
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
