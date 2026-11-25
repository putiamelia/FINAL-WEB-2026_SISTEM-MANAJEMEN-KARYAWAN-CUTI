'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import StatCard from '@/components/StatCard';
import StatusBadge from '@/components/StatusBadge';
import {
  CalendarRange,
  CalendarCheck,
  CalendarDays,
  Users,
  CheckSquare,
  Search,
  Filter,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  Clock,
  UserCheck,
  FileText,
  Building2,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  User,
  Phone,
  MapPin,
  Calendar,
} from 'lucide-react';
import {
  formatDateRange,
  formatDecimal,
  formatDateIndo,
  formatDateShort,
  getAvatarUrl,
} from '@/lib/utils';

export default function JadwalCutiDivisiPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    division: null,
    today: '',
    stats: {
      totalAnggota: 0,
      sedangCuti: 0,
      cutiTerjadwal: 0,
      pendingVerifikasi: 0,
      totalApproved: 0,
      tingkatKehadiran: 100,
    },
    members: [],
    leaves: [],
  });

  // UI state
  const [activeTab, setActiveTab] = useState('pengajuan'); // 'pengajuan' | 'anggota' | 'kalender'
  const [filterKategori, setFilterKategori] = useState('semua'); // 'semua' | 'sedang' | 'terjadwal' | 'pending' | 'selesai'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJenisCuti, setSelectedJenisCuti] = useState('Semua');
  const [selectedStatus, setSelectedStatus] = useState('Semua');
  const [detailModal, setDetailModal] = useState(null);

  // Calendar state
  const [calendarDate, setCalendarDate] = useState(() => {
    // Default calendar date in 2026
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selectedCalendarDay, setSelectedCalendarDay] = useState(null);

  useEffect(() => {
    fetchDivisionLeaves();
  }, []);

  async function fetchDivisionLeaves() {
    try {
      setLoading(true);
      const res = await fetch('/api/leave/division-leaves');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        console.error('Failed to load division leaves');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // List of unique leave types from leaves
  const leaveTypes = useMemo(() => {
    const set = new Set();
    data.leaves.forEach((l) => {
      if (l.nama_cuti) set.add(l.nama_cuti);
    });
    return Array.from(set);
  }, [data.leaves]);

  // Filtered leaves
  const filteredLeaves = useMemo(() => {
    return data.leaves.filter((item) => {
      // 1. Filter Kategori Tab
      if (filterKategori === 'sedang') {
        if (item.kategori_cuti !== 'SEDANG_CUTI') return false;
      } else if (filterKategori === 'terjadwal') {
        if (item.kategori_cuti !== 'CUTI_TERJADWAL') return false;
      } else if (filterKategori === 'pending') {
        if (item.status !== 'Pending') return false;
      } else if (filterKategori === 'selesai') {
        if (item.kategori_cuti !== 'SELESAI') return false;
      }

      // 2. Filter Jenis Cuti
      if (selectedJenisCuti !== 'Semua' && item.nama_cuti !== selectedJenisCuti) {
        return false;
      }

      // 3. Filter Status
      if (selectedStatus !== 'Semua' && item.status !== selectedStatus) {
        return false;
      }

      // 4. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.nama_lengkap?.toLowerCase().includes(q);
        const matchesJabatan = item.jabatan?.toLowerCase().includes(q);
        const matchesNomor = item.nomor_pengajuan?.toLowerCase().includes(q);
        const matchesAlasan = item.alasan?.toLowerCase().includes(q);
        const matchesHandover = item.nama_handover?.toLowerCase().includes(q);
        if (!matchesName && !matchesJabatan && !matchesNomor && !matchesAlasan && !matchesHandover) {
          return false;
        }
      }

      return true;
    });
  }, [data.leaves, filterKategori, selectedJenisCuti, selectedStatus, searchQuery]);

  // Filtered members for Tab 2
  const filteredMembers = useMemo(() => {
    return data.members.filter((m) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        m.nama_lengkap?.toLowerCase().includes(q) ||
        m.jabatan?.toLowerCase().includes(q) ||
        m.email?.toLowerCase().includes(q)
      );
    });
  }, [data.members, searchQuery]);

  // Helper Calendar logic
  const calendarDays = useMemo(() => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const daysInMonth = lastDayOfMonth.getDate();
    // 0 = Sunday, 1 = Monday, ... convert to Monday = 0
    let startDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const days = [];

    // Prev month padding
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const dayNum = prevMonthLastDay - i;
      const d = new Date(year, month - 1, dayNum);
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      days.push({
        date: d,
        iso,
        dayNum,
        isCurrentMonth: false,
        leaves: [],
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;

      // Check which approved leaves cover this day
      const dayLeaves = data.leaves.filter((l) => {
        if (l.status !== 'Approved' && l.status !== 'Approved by Leader') return false;
        return iso >= l.tanggal_mulai_formatted && iso <= l.tanggal_selesai_formatted;
      });

      days.push({
        date: d,
        iso,
        dayNum: i,
        isCurrentMonth: true,
        leaves: dayLeaves,
      });
    }

    // Next month padding to fill complete weeks (multiples of 7)
    const remainingDays = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remainingDays; i++) {
      const d = new Date(year, month + 1, i);
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({
        date: d,
        iso,
        dayNum: i,
        isCurrentMonth: false,
        leaves: [],
      });
    }

    return days;
  }, [calendarDate, data.leaves]);

  function prevMonth() {
    setCalendarDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    setSelectedCalendarDay(null);
  }

  function nextMonth() {
    setCalendarDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    setSelectedCalendarDay(null);
  }

  function resetToday() {
    const d = new Date();
    setCalendarDate(new Date(d.getFullYear(), d.getMonth(), 1));
    setSelectedCalendarDay(null);
  }

  const divisionName = data.division?.nama_divisi || 'Layanan Nasabah';

  return (
    <DashboardLayout
      breadcrumbs={[
        { href: '/ketua/dashboard', label: 'Dashboard' },
        { label: 'Jadwal Cuti Divisi' },
      ]}
    >
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#0B2545] tracking-tight">
              Jadwal Cuti Karyawan Divisi {divisionName}
            </h1>
            <span className="hidden sm:inline-block px-2.5 py-0.5 rounded text-[11px] font-bold bg-[#13315C] text-white">
              Divisi Aktif
            </span>
          </div>
          <p className="text-xs text-[#4A5565] mt-1">
            Pantau seluruh pegawai divisi Anda yang sedang mengambil cuti hari ini, jadwal cuti mendatang, serta status ketersediaan tim.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={fetchDivisionLeaves}
            disabled={loading}
            className="btn-secondary text-xs !h-9 px-3 gap-1.5"
            title="Muat ulang data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Segarkan</span>
          </button>

          {data.stats.pendingVerifikasi > 0 && (
            <Link
              href="/ketua/verifikasi"
              className="btn-primary text-xs !h-9 px-3.5 gap-1.5 bg-[#C8A24A] hover:bg-[#B38F3B] text-[#0B2545]"
            >
              <CheckSquare className="w-4 h-4" />
              <span>Verifikasi ({data.stats.pendingVerifikasi})</span>
            </Link>
          )}
        </div>
      </div>

      {/* 4 Kartu Statistik Ringkasan Divisi */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Sedang Cuti Hari Ini"
          value={`${data.stats.sedangCuti} orang`}
          subtext={
            data.stats.sedangCuti > 0
              ? 'anggota divisi tidak berdinas hari ini'
              : 'semua anggota divisi hadir bertugas'
          }
          icon={Users}
        />
        <StatCard
          label="Cuti Terjadwal (Mendatang)"
          value={`${data.stats.cutiTerjadwal} permohonan`}
          subtext="sudah disetujui untuk jadwal mendatang"
          icon={CalendarCheck}
        />
        <StatCard
          label="Menunggu Verifikasi Anda"
          value={`${data.stats.pendingVerifikasi} berkas`}
          subtext={
            data.stats.pendingVerifikasi > 0
              ? 'memerlukan tindakan verifikasi Anda'
              : 'semua pengajuan telah diverifikasi'
          }
          icon={CheckSquare}
        />
        <StatCard
          label="Tingkat Kehadiran Divisi"
          value={`${data.stats.tingkatKehadiran}%`}
          subtext={`${data.stats.totalAnggota - data.stats.sedangCuti} dari ${data.stats.totalAnggota} pegawai bertugas`}
          icon={UserCheck}
        />
      </div>

      {/* Mode View Tabs (Daftar Pengajuan, Roster Anggota, Kalender Jadwal) */}
      <div className="bg-white rounded-md border border-[#D9DEE5] shadow-sm mb-6 overflow-hidden">
        <div className="border-b border-[#E6EAF0] px-4 pt-3 flex flex-wrap items-center justify-between gap-3 bg-[#FBFAF7]">
          {/* Main Tabs */}
          <div className="flex items-center space-x-1 sm:space-x-2">
            <button
              type="button"
              onClick={() => setActiveTab('pengajuan')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
                activeTab === 'pengajuan'
                  ? 'border-[#13315C] text-[#13315C] bg-white'
                  : 'border-transparent text-[#4A5565] hover:text-[#0B2545]'
              }`}
            >
              <CalendarRange className="w-4 h-4" />
              <span>Daftar Pengajuan Cuti</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-[#E6EAF0] text-[#13315C]">
                {data.leaves.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('anggota')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
                activeTab === 'anggota'
                  ? 'border-[#13315C] text-[#13315C] bg-white'
                  : 'border-transparent text-[#4A5565] hover:text-[#0B2545]'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Status Kehadiran Anggota Tim</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-[#E6EAF0] text-[#13315C]">
                {data.members.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('kalender')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
                activeTab === 'kalender'
                  ? 'border-[#13315C] text-[#13315C] bg-white'
                  : 'border-transparent text-[#4A5565] hover:text-[#0B2545]'
              }`}
            >
              <CalendarDays className="w-4 h-4" />
              <span>Kalender Jadwal Cuti</span>
            </button>
          </div>

          <div className="text-[11px] text-[#4A5565] py-2">
            Per Tanggal: <strong className="text-[#0B2545]">{formatDateIndo(data.today || new Date())}</strong>
          </div>
        </div>

        {/* ============================================================== */}
        {/* TAB 1: DAFTAR PENGAJUAN CUTI (TABEL LENGKAP & FILTER)           */}
        {/* ============================================================== */}
        {activeTab === 'pengajuan' && (
          <div className="p-4 sm:p-5 space-y-4">
            {/* Filter Tabs Kategori */}
            <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-[#E6EAF0] text-xs">
              <span className="text-[#4A5565] font-semibold text-[11px] mr-1">Kategori:</span>

              <button
                type="button"
                onClick={() => setFilterKategori('semua')}
                className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                  filterKategori === 'semua'
                    ? 'bg-[#13315C] text-white'
                    : 'bg-[#F1F3F6] text-[#4A5565] hover:bg-[#E6EAF0]'
                }`}
              >
                Semua ({data.leaves.length})
              </button>

              <button
                type="button"
                onClick={() => setFilterKategori('sedang')}
                className={`px-3 py-1 rounded text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                  filterKategori === 'sedang'
                    ? 'bg-[#DC2626] text-white'
                    : 'bg-[#FEE2E2] text-[#991B1B] hover:bg-[#FECACA]'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-current"></span>
                <span>Sedang Cuti ({data.leaves.filter((l) => l.kategori_cuti === 'SEDANG_CUTI').length})</span>
              </button>

              <button
                type="button"
                onClick={() => setFilterKategori('terjadwal')}
                className={`px-3 py-1 rounded text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                  filterKategori === 'terjadwal'
                    ? 'bg-[#D97706] text-white'
                    : 'bg-[#FEF3C7] text-[#92400E] hover:bg-[#FDE68A]'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Cuti Terjadwal ({data.leaves.filter((l) => l.kategori_cuti === 'CUTI_TERJADWAL').length})</span>
              </button>

              <button
                type="button"
                onClick={() => setFilterKategori('pending')}
                className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                  filterKategori === 'pending'
                    ? 'bg-[#C8A24A] text-[#0B2545]'
                    : 'bg-[#FDF6E2] text-[#855B14] hover:bg-[#FCECC3]'
                }`}
              >
                Menunggu Verifikasi ({data.leaves.filter((l) => l.status === 'Pending').length})
              </button>

              <button
                type="button"
                onClick={() => setFilterKategori('selesai')}
                className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                  filterKategori === 'selesai'
                    ? 'bg-[#4B5563] text-white'
                    : 'bg-[#F1F3F6] text-[#4A5565] hover:bg-[#E6EAF0]'
                }`}
              >
                Riwayat Selesai ({data.leaves.filter((l) => l.kategori_cuti === 'SELESAI').length})
              </button>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
              <div className="relative flex-1 sm:max-w-xs">
                <Search className="w-4 h-4 text-[#4A5565] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Cari nama pegawai / no. cuti / alasan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-field input-search !h-9 text-xs w-full"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                {/* Filter Jenis Cuti */}
                <select
                  value={selectedJenisCuti}
                  onChange={(e) => setSelectedJenisCuti(e.target.value)}
                  className="input-field !h-9 text-xs !w-auto min-w-[140px]"
                >
                  <option value="Semua">Semua Jenis Cuti</option>
                  {leaveTypes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>

                {/* Filter Status Resmi */}
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="input-field !h-9 text-xs !w-auto min-w-[140px]"
                >
                  <option value="Semua">Semua Status</option>
                  <option value="Pending">Pending</option>
                  <option value="Approved by Leader">Approved by Leader</option>
                  <option value="Approved">Approved (Final)</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {/* Tabel Daftar Pengajuan */}
            <div className="overflow-x-auto border border-[#E6EAF0] rounded">
              <table className="w-full text-left border-collapse min-w-[760px]">
                <thead>
                  <tr>
                    <th className="table-header">Pegawai</th>
                    <th className="table-header">Jenis Cuti</th>
                    <th className="table-header">Periode Cuti</th>
                    <th className="table-header">Status & Kategori</th>
                    <th className="table-header">Petugas Pengganti</th>
                    <th className="table-header text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6EAF0] text-xs">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-[#4A5565]">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#13315C]" />
                        Memuat data pengajuan cuti divisi...
                      </td>
                    </tr>
                  ) : filteredLeaves.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-[#4A5565]">
                        <CalendarCheck className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="font-semibold text-sm text-[#0B2545]">
                          Tidak Ada Pengajuan Cuti Sesuai Filter
                        </p>
                        <p className="text-[11px] text-[#4A5565] mt-1">
                          Coba ganti kata kunci pencarian atau sesuaikan pilihan kategori di atas.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredLeaves.map((item) => {
                      const isSedangCuti = item.kategori_cuti === 'SEDANG_CUTI';
                      const isCutiTerjadwal = item.kategori_cuti === 'CUTI_TERJADWAL';

                      return (
                        <tr key={item.id} className="hover:bg-[#FBFAF7] transition-colors">
                          {/* Kolom Pegawai */}
                          <td className="table-cell">
                            <div className="flex items-center gap-3">
                              <img
                                src={getAvatarUrl(item.foto_profil)}
                                alt={item.nama_lengkap}
                                className="w-9 h-9 rounded-full object-cover border border-[#D9DEE5] bg-[#E2E8F0] shrink-0"
                              />
                              <div>
                                <p className="font-bold text-[#1B2430]">{item.nama_lengkap}</p>
                                <p className="text-[11px] text-[#4A5565]">{item.jabatan || 'Staff'}</p>
                              </div>
                            </div>
                          </td>

                          {/* Kolom Jenis Cuti */}
                          <td className="table-cell">
                            <span className="font-semibold text-[#0B2545] block">
                              {item.nama_cuti}
                            </span>
                            <span className="text-[10px] text-[#4A5565] font-mono">
                              {item.nomor_pengajuan}
                            </span>
                          </td>

                          {/* Kolom Periode */}
                          <td className="table-cell">
                            <div className="font-medium text-[#1B2430]">
                              {formatDateRange(item.tanggal_mulai, item.tanggal_selesai)}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[11px] font-semibold text-[#13315C]">
                                {formatDecimal(item.total_hari)} hari
                              </span>
                              {item.is_half_day && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#EFF6FF] text-[#1D4ED8]">
                                  Half Day
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Kolom Status & Kategori */}
                          <td className="table-cell">
                            <div className="space-y-1">
                              {/* Kategori Badge Khusus */}
                              {isSedangCuti ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-[#FEE2E2] text-[#991B1B] border border-[#FECACA]">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626] animate-pulse"></span>
                                  Sedang Cuti
                                </span>
                              ) : isCutiTerjadwal ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
                                  <Clock className="w-3 h-3 text-[#D97706]" />
                                  Cuti Terjadwal
                                </span>
                              ) : null}

                              {/* Status Badge Resmi */}
                              <div>
                                <StatusBadge status={item.status} />
                              </div>
                            </div>
                          </td>

                          {/* Kolom Handover */}
                          <td className="table-cell text-[#4A5565]">
                            {item.nama_handover ? (
                              <div>
                                <p className="font-semibold text-[#1B2430]">{item.nama_handover}</p>
                                {item.catatan_handover && (
                                  <p className="text-[10px] text-[#4A5565] line-clamp-1 italic">
                                    "{item.catatan_handover}"
                                  </p>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400 italic">-</span>
                            )}
                          </td>

                          {/* Kolom Aksi */}
                          <td className="table-cell text-right">
                            <button
                              type="button"
                              onClick={() => setDetailModal(item)}
                              className="btn-secondary !h-8 px-2.5 text-[11px] font-semibold inline-flex items-center gap-1"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Detail</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: STATUS KEHADIRAN ANGGOTA TIM (LIVE ROSTER)              */}
        {/* ============================================================== */}
        {activeTab === 'anggota' && (
          <div className="p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <p className="text-[#4A5565]">
                Daftar lengkap seluruh <strong>{data.members.length} anggota</strong> Divisi {divisionName} beserta status operasional hari ini.
              </p>

              <div className="relative sm:w-64">
                <Search className="w-4 h-4 text-[#4A5565] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Cari anggota divisi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-field input-search !h-9 text-xs w-full"
                />
              </div>
            </div>

            <div className="overflow-x-auto border border-[#E6EAF0] rounded">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr>
                    <th className="table-header">Pegawai</th>
                    <th className="table-header">Jabatan & Peran</th>
                    <th className="table-header">Status Kehadiran Hari Ini</th>
                    <th className="table-header">Keterangan Cuti Aktif / Mendatang</th>
                    <th className="table-header">Sisa Kuota</th>
                    <th className="table-header text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6EAF0] text-xs">
                  {filteredMembers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-400">
                        Tidak ada anggota divisi yang sesuai pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredMembers.map((member) => {
                      const isLeader = member.role === 'Ketua Divisi';
                      const status = member.status_kehadiran;

                      let statusBadge = (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold bg-[#DCFCE7] text-[#14532D]">
                          <span className="w-2 h-2 rounded-full bg-[#16A34A]"></span>
                          Hadir / Aktif
                        </span>
                      );

                      if (status === 'Sedang Cuti') {
                        statusBadge = (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold bg-[#FEE2E2] text-[#991B1B]">
                            <span className="w-2 h-2 rounded-full bg-[#DC2626] animate-pulse"></span>
                            Sedang Cuti
                          </span>
                        );
                      } else if (status === 'Cuti Terjadwal') {
                        statusBadge = (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold bg-[#FEF3C7] text-[#92400E]">
                            <Clock className="w-3.5 h-3.5 text-[#D97706]" />
                            Cuti Terjadwal
                          </span>
                        );
                      } else if (status === 'Menunggu Verifikasi') {
                        statusBadge = (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold bg-[#FDF6E2] text-[#855B14]">
                            <AlertCircle className="w-3.5 h-3.5 text-[#C8A24A]" />
                            Menunggu Verifikasi
                          </span>
                        );
                      }

                      return (
                        <tr key={member.id} className="hover:bg-[#FBFAF7] transition-colors">
                          {/* Pegawai */}
                          <td className="table-cell">
                            <div className="flex items-center gap-3">
                              <img
                                src={getAvatarUrl(member.foto_profil)}
                                alt={member.nama_lengkap}
                                className="w-9 h-9 rounded-full object-cover border border-[#D9DEE5] bg-[#E2E8F0] shrink-0"
                              />
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <p className="font-bold text-[#1B2430]">{member.nama_lengkap}</p>
                                  {isLeader && (
                                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#13315C] text-white">
                                      Ketua
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-[#4A5565]">{member.email}</p>
                              </div>
                            </div>
                          </td>

                          {/* Jabatan */}
                          <td className="table-cell text-[#4A5565]">
                            <span className="font-medium text-[#1B2430]">{member.jabatan || 'Staff'}</span>
                            <span className="block text-[11px] text-[#4A5565]">{member.role}</span>
                          </td>

                          {/* Status Kehadiran */}
                          <td className="table-cell">{statusBadge}</td>

                          {/* Keterangan Cuti */}
                          <td className="table-cell">
                            {member.active_leave ? (
                              <div className="text-[11px] space-y-0.5">
                                <p className="font-semibold text-[#0B2545]">
                                  {member.active_leave.nama_cuti}
                                </p>
                                <p className="text-[#4A5565]">
                                  {formatDateRange(
                                    member.active_leave.tanggal_mulai,
                                    member.active_leave.tanggal_selesai
                                  )}{' '}
                                  ({formatDecimal(member.active_leave.total_hari)} hari)
                                </p>
                              </div>
                            ) : (
                              <span className="text-gray-400 italic">Tidak ada cuti aktif/terjadwal</span>
                            )}
                          </td>

                          {/* Sisa Kuota */}
                          <td className="table-cell">
                            <span className="font-bold text-[#13315C]">
                              {formatDecimal(member.sisa_kuota_tahunan)} hari
                            </span>
                            <span className="block text-[10px] text-[#4A5565]">
                              dari {formatDecimal(member.kuota_tahunan_awal || 12)} hari
                            </span>
                          </td>

                          {/* Aksi */}
                          <td className="table-cell text-right">
                            <button
                              type="button"
                              onClick={() => {
                                setSearchQuery(member.nama_lengkap);
                                setActiveTab('pengajuan');
                              }}
                              className="text-[11px] text-[#13315C] font-semibold hover:underline inline-flex items-center gap-1"
                            >
                              <span>Lihat Cuti</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: KALENDER JADWAL CUTI DIVISI                             */}
        {/* ============================================================== */}
        {activeTab === 'kalender' && (
          <div className="p-4 sm:p-5 space-y-4">
            {/* Calendar Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E6EAF0]">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#0B2545]">
                  {calendarDate.toLocaleString('id-ID', { month: 'long', year: 'numeric' })}
                </h2>
                <button
                  type="button"
                  onClick={resetToday}
                  className="px-2.5 py-1 rounded border border-[#D9DEE5] text-[11px] font-semibold text-[#13315C] hover:bg-gray-50"
                >
                  Bulan Sekarang
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={prevMonth}
                  className="p-1.5 rounded border border-[#D9DEE5] hover:bg-gray-50 text-[#0B2545]"
                  title="Bulan sebelumnya"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={nextMonth}
                  className="p-1.5 rounded border border-[#D9DEE5] hover:bg-gray-50 text-[#0B2545]"
                  title="Bulan berikutnya"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="border border-[#D9DEE5] rounded overflow-hidden">
              {/* Day Headers (Senin - Minggu) */}
              <div className="grid grid-cols-7 bg-[#EEF1F5] text-center border-b border-[#D9DEE5] text-xs font-semibold text-[#13315C] py-2">
                <div>Sen</div>
                <div>Sel</div>
                <div>Rab</div>
                <div>Kam</div>
                <div>Jum</div>
                <div className="text-red-600">Sab</div>
                <div className="text-red-600">Min</div>
              </div>

              {/* Day Cells */}
              <div className="grid grid-cols-7 divide-x divide-y divide-[#E6EAF0] text-xs">
                {calendarDays.map((cell, idx) => {
                  const isToday = cell.iso === data.today;
                  const hasLeaves = cell.leaves.length > 0;
                  const isWeekend = idx % 7 === 5 || idx % 7 === 6;

                  return (
                    <div
                      key={cell.iso + '-' + idx}
                      onClick={() => hasLeaves && setSelectedCalendarDay(cell)}
                      className={`min-h-[90px] sm:min-h-[110px] p-1.5 sm:p-2 flex flex-col justify-between transition-colors ${
                        !cell.isCurrentMonth
                          ? 'bg-[#F8FAFC] text-gray-300'
                          : isWeekend
                          ? 'bg-[#FBFAF7]'
                          : 'bg-white'
                      } ${hasLeaves ? 'cursor-pointer hover:bg-[#F0F7FF]' : ''} ${
                        isToday ? 'ring-2 ring-inset ring-[#C8A24A]' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold ${
                            isToday
                              ? 'bg-[#13315C] text-white font-bold'
                              : isWeekend
                              ? 'text-red-600'
                              : 'text-[#1B2430]'
                          }`}
                        >
                          {cell.dayNum}
                        </span>

                        {isToday && (
                          <span className="text-[9px] font-bold text-[#C8A24A] uppercase tracking-wider hidden sm:inline">
                            Hari Ini
                          </span>
                        )}
                      </div>

                      {/* Chips per cuti */}
                      <div className="space-y-1 overflow-y-auto max-h-16">
                        {cell.leaves.slice(0, 2).map((l) => (
                          <div
                            key={l.id}
                            className={`p-1 rounded text-[10px] font-semibold truncate ${
                              l.kategori_cuti === 'SEDANG_CUTI'
                                ? 'bg-[#FEE2E2] text-[#991B1B] border border-[#FECACA]'
                                : 'bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]'
                            }`}
                            title={`${l.nama_lengkap} - ${l.nama_cuti}`}
                          >
                            <span className="font-bold">{l.nama_lengkap}</span>
                            <span className="hidden sm:inline font-normal"> &bull; {l.nama_cuti}</span>
                          </div>
                        ))}

                        {cell.leaves.length > 2 && (
                          <div className="text-[10px] font-bold text-[#13315C] text-center bg-[#E6EAF0] rounded py-0.5">
                            +{cell.leaves.length - 2} cuti lainnya
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Calendar Legend */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-[#4A5565] pt-2">
              <span className="font-semibold text-[#0B2545]">Keterangan Kalender:</span>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-[#13315C]"></span>
                <span>Hari Ini</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-[#FEE2E2] border border-[#FECACA]"></span>
                <span>Sedang Cuti Aktif</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-[#FEF3C7] border border-[#FDE68A]"></span>
                <span>Cuti Terjadwal (Mendatang)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-[#FBFAF7] border border-[#E6EAF0]"></span>
                <span>Akhir Pekan</span>
              </div>
            </div>

            {/* Selected Day Leave Drawer / Card */}
            {selectedCalendarDay && (
              <div className="p-4 bg-[#FBFAF7] rounded border border-[#C8A24A] space-y-3">
                <div className="flex items-center justify-between border-b border-[#E6EAF0] pb-2">
                  <h3 className="font-bold text-sm text-[#0B2545] flex items-center gap-2">
                    <CalendarCheck className="w-4 h-4 text-[#C8A24A]" />
                    <span>Daftar Karyawan Cuti pada: {formatDateIndo(selectedCalendarDay.iso)}</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setSelectedCalendarDay(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedCalendarDay.leaves.map((l) => (
                    <div
                      key={l.id}
                      className="p-3 bg-white rounded border border-[#D9DEE5] shadow-sm flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <img
                          src={getAvatarUrl(l.foto_profil)}
                          alt={l.nama_lengkap}
                          className="w-8 h-8 rounded-full object-cover border border-[#D9DEE5]"
                        />
                        <div>
                          <p className="font-bold text-[#1B2430]">{l.nama_lengkap}</p>
                          <p className="text-[11px] text-[#4A5565]">{l.jabatan}</p>
                          <p className="text-[11px] font-semibold text-[#13315C] mt-0.5">
                            {l.nama_cuti} &bull; {formatDateRange(l.tanggal_mulai, l.tanggal_selesai)}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setDetailModal(l)}
                        className="btn-secondary !h-7 px-2 text-[10px]"
                      >
                        Detail
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* MODAL DETAIL PENGAJUAN CUTI LENGKAP                            */}
      {/* ============================================================== */}
      {detailModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-md max-w-2xl w-full border border-[#D9DEE5] shadow-xl overflow-hidden my-8">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-[#0B2545] text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base tracking-tight">
                  Detail Pengajuan Cuti Karyawan
                </h3>
                <p className="text-xs text-[#9FB0CC] font-mono mt-0.5">
                  Nomor: {detailModal.nomor_pengajuan}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDetailModal(null)}
                className="text-white/80 hover:text-white p-1 rounded hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 text-xs max-h-[75vh] overflow-y-auto">
              {/* Pegawai Info Box */}
              <div className="p-4 bg-[#FBFAF7] rounded border border-[#E6EAF0] flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <img
                    src={getAvatarUrl(detailModal.foto_profil)}
                    alt={detailModal.nama_lengkap}
                    className="w-12 h-12 rounded-full object-cover border border-[#D9DEE5] bg-[#E2E8F0]"
                  />
                  <div>
                    <h4 className="font-bold text-sm text-[#0B2545]">{detailModal.nama_lengkap}</h4>
                    <p className="text-xs text-[#4A5565]">{detailModal.jabatan || 'Staff'}</p>
                    <p className="text-[11px] text-[#4A5565]">{detailModal.email}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[11px] text-[#4A5565] block">Sisa Kuota Tahunan:</span>
                  <span className="text-base font-bold text-[#13315C]">
                    {formatDecimal(detailModal.sisa_kuota_tahunan)} hari
                  </span>
                </div>
              </div>

              {/* Rincian Cuti Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-[11px] text-[#4A5565] font-semibold">Jenis Cuti:</span>
                  <p className="font-bold text-sm text-[#0B2545]">{detailModal.nama_cuti}</p>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] text-[#4A5565] font-semibold">Status Pengajuan:</span>
                  <div>
                    <StatusBadge status={detailModal.status} />
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] text-[#4A5565] font-semibold">Periode Cuti:</span>
                  <p className="font-semibold text-xs text-[#1B2430]">
                    {formatDateRange(detailModal.tanggal_mulai, detailModal.tanggal_selesai)}
                  </p>
                  <p className="text-[11px] text-[#4A5565]">
                    Total: <strong>{formatDecimal(detailModal.total_hari)} hari kerja</strong>
                    {detailModal.is_half_day && ' (Setengah Hari)'}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] text-[#4A5565] font-semibold">Tanggal Diajukan:</span>
                  <p className="font-medium text-xs text-[#1B2430]">
                    {formatDateIndo(detailModal.tanggal_pengajuan || detailModal.created_at)}
                  </p>
                </div>
              </div>

              {/* Alasan Cuti */}
              <div className="space-y-1 p-3 bg-[#F1F3F6] rounded">
                <span className="text-[11px] font-bold text-[#0B2545]">Alasan Cuti:</span>
                <p className="text-xs text-[#334155] leading-relaxed italic">
                  "{detailModal.alasan}"
                </p>
              </div>

              {/* Handover & Kontak Darurat */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#E6EAF0]">
                <div className="space-y-1">
                  <span className="text-[11px] text-[#4A5565] font-semibold flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#13315C]" />
                    <span>Petugas Pengganti (Handover):</span>
                  </span>
                  <p className="font-bold text-xs text-[#0B2545]">
                    {detailModal.nama_handover || 'Tidak ada serah terima'}
                  </p>
                  {detailModal.catatan_handover && (
                    <p className="text-[11px] text-[#4A5565] italic">
                      "{detailModal.catatan_handover}"
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] text-[#4A5565] font-semibold flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-[#13315C]" />
                    <span>Kontak Darurat & Alamat:</span>
                  </span>
                  <p className="font-medium text-xs text-[#1B2430]">
                    No: {detailModal.nomor_darurat || '-'}
                  </p>
                  <p className="text-[11px] text-[#4A5565] flex items-center gap-1">
                    <MapPin className="w-3 h-3 shrink-0" />
                    <span>{detailModal.alamat_selama_cuti || '-'}</span>
                  </p>
                </div>
              </div>

              {/* Jejak Verifikasi Atasan & HRD */}
              <div className="pt-2 border-t border-[#E6EAF0] space-y-2">
                <span className="text-[11px] font-bold text-[#0B2545]">Jejak Persetujuan:</span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                  {/* Ketua Divisi */}
                  <div className="p-2.5 rounded bg-white border border-[#D9DEE5]">
                    <span className="font-bold text-[#13315C] block">Verifikasi Ketua Divisi</span>
                    <p className="text-[#4A5565]">
                      Oleh: <strong>{detailModal.nama_leader || '-'}</strong>
                    </p>
                    <p className="text-[#4A5565]">
                      Waktu: {detailModal.leader_approval_date ? formatDateIndo(detailModal.leader_approval_date) : '-'}
                    </p>
                    {detailModal.leader_notes && (
                      <p className="text-[#334155] italic mt-1 border-t pt-1">
                        "{detailModal.leader_notes}"
                      </p>
                    )}
                  </div>

                  {/* HRD */}
                  <div className="p-2.5 rounded bg-white border border-[#D9DEE5]">
                    <span className="font-bold text-[#13315C] block">Persetujuan Final HRD</span>
                    <p className="text-[#4A5565]">
                      Oleh: <strong>{detailModal.nama_hrd || '-'}</strong>
                    </p>
                    <p className="text-[#4A5565]">
                      Waktu: {detailModal.hrd_approval_date ? formatDateIndo(detailModal.hrd_approval_date) : '-'}
                    </p>
                    {detailModal.hrd_notes && (
                      <p className="text-[#334155] italic mt-1 border-t pt-1">
                        "{detailModal.hrd_notes}"
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Lampiran jika ada */}
              {detailModal.lampiran_url && (
                <div className="pt-2 border-t border-[#E6EAF0]">
                  <span className="text-[11px] font-semibold text-[#4A5565] block mb-1">
                    Dokumen Lampiran (Surat Dokter / Dokumen Pendukung):
                  </span>
                  <a
                    href={detailModal.lampiran_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#E6EAF0] text-[#13315C] font-semibold hover:bg-[#D9DEE5]"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Lihat Dokumen Lampiran</span>
                  </a>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-[#F1F3F6] border-t border-[#D9DEE5] flex items-center justify-between">
              {detailModal.status === 'Pending' ? (
                <Link
                  href="/ketua/verifikasi"
                  className="btn-primary text-xs !h-9 px-4 gap-1.5 bg-[#C8A24A] hover:bg-[#B38F3B] text-[#0B2545]"
                >
                  <CheckSquare className="w-4 h-4" />
                  <span>Proses Verifikasi di Halaman Verifikasi</span>
                </Link>
              ) : (
                <div></div>
              )}

              <button
                type="button"
                onClick={() => setDetailModal(null)}
                className="btn-secondary text-xs !h-9 px-4"
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
