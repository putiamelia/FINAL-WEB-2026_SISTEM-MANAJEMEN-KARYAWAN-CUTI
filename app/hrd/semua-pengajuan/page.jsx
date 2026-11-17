'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import StatusBadge from '@/components/StatusBadge';
import { History, FileDown, Filter, Eye, X, Building2, Search } from 'lucide-react';
import { formatDateRange, formatDecimal, formatDateIndo } from '@/lib/utils';

export default function SemuaPengajuanHrdPage() {
  const [requests, setRequests] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDivisi, setSelectedDivisi] = useState('Semua');
  const [selectedStatus, setSelectedStatus] = useState('Semua');
  const [search, setSearch] = useState('');
  const [detailModal, setDetailModal] = useState(null);

  useEffect(() => {
    async function loadDivs() {
      try {
        const res = await fetch('/api/admin/divisions');
        if (res.ok) {
          const d = await res.json();
          setDivisions(d.divisions || []);
        }
      } catch (e) {}
    }
    loadDivs();
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [selectedDivisi, selectedStatus]);

  async function fetchRequests() {
    try {
      setLoading(true);
      // Fetch all requests
      const res = await fetch('/api/admin/users'); // we can also fetch from a general route
      // Let's call the leave request route with hrd/admin context
      const reqRes = await fetch(`/api/leave/request?status=${encodeURIComponent(selectedStatus)}&limit=200`);
      if (reqRes.ok) {
        const d = await reqRes.json();
        setRequests(d.requests || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const filteredRequests = requests.filter((r) => {
    if (selectedDivisi !== 'Semua' && r.nama_divisi !== selectedDivisi) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        r.nama_lengkap?.toLowerCase().includes(q) ||
        r.nomor_pengajuan?.toLowerCase().includes(q) ||
        r.nama_cuti?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <DashboardLayout
      breadcrumbs={[
        { href: '/hrd/dashboard', label: 'Dashboard' },
        { label: 'Semua Pengajuan Cuti' },
      ]}
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0B2545] tracking-tight">
          Monitoring Seluruh Pengajuan Cuti Pegawai
        </h1>
        <p className="text-xs text-[#4A5565] mt-1">
          Pantau rekapitulasi permohonan cuti dari seluruh divisi dan cetak surat cuti resmi.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-md border border-[#D9DEE5] mb-6 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 shadow-sm text-xs">
        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5 sm:gap-3 flex-1">
          {/* Search Input with aligned icon */}
          <div className="relative flex-1 sm:flex-initial sm:w-64 min-w-[220px]">
            <Search className="w-4 h-4 text-[#4A5565] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari nama pegawai / no. cuti..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field input-search !h-9 text-xs w-full"
            />
          </div>

          {/* Divisi Select */}
          <div className="w-full sm:w-48">
            <select
              value={selectedDivisi}
              onChange={(e) => setSelectedDivisi(e.target.value)}
              className="input-field !h-9 text-xs w-full"
            >
              <option value="Semua">Semua Divisi</option>
              {divisions.map((d) => (
                <option key={d.id} value={d.nama_divisi}>
                  {d.nama_divisi}
                </option>
              ))}
            </select>
          </div>

          {/* Status Select */}
          <div className="w-full sm:w-40">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="input-field !h-9 text-xs w-full"
            >
              <option value="Semua">Semua Status</option>
              <option value="Pending">Pending</option>
              <option value="Approved by Leader">Approved by Leader</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="text-[#4A5565] font-semibold text-xs shrink-0 self-end sm:self-center">
          Ditemukan {filteredRequests.length} Berkas
        </div>
      </div>

      {/* Tabel */}
      <div className="bg-white rounded-md border border-[#D9DEE5] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left border-collapse">
            <thead>
              <tr>
                <th className="table-header">No. Pengajuan</th>
                <th className="table-header">Pegawai</th>
                <th className="table-header">Divisi</th>
                <th className="table-header">Jenis Cuti</th>
                <th className="table-header">Periode Cuti</th>
                <th className="table-header">Durasi</th>
                <th className="table-header">Status</th>
                <th className="table-header text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6EAF0] text-xs">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-[#4A5565]">
                    Memuat data seluruh permohonan...
                  </td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-[#4A5565]">
                    Tidak ada berkas cuti yang sesuai dengan kriteria filter.
                  </td>
                </tr>
              ) : (
                filteredRequests.map((r) => (
                  <tr key={r.id} className="hover:bg-[#FBFAF7] transition-colors">
                    <td className="table-cell font-semibold text-[#13315C]">
                      {r.nomor_pengajuan}
                    </td>
                    <td className="table-cell font-bold text-[#1B2430]">
                      {r.nama_lengkap}
                    </td>
                    <td className="table-cell text-[#4A5565]">
                      {r.nama_divisi || '-'}
                    </td>
                    <td className="table-cell font-medium text-[#1B2430]">
                      {r.nama_cuti}
                    </td>
                    <td className="table-cell text-[#334155]">
                      {formatDateRange(r.tanggal_mulai, r.tanggal_selesai)}
                    </td>
                    <td className="table-cell font-medium text-[#1B2430]">
                      {formatDecimal(r.total_hari)} hari
                    </td>
                    <td className="table-cell">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="table-cell text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => setDetailModal(r)}
                        className="text-[#13315C] hover:underline font-semibold"
                      >
                        Detail
                      </button>
                      {r.status === 'Approved' && (
                        <a
                          href={`/api/leave/pdf/${r.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[#14532D] hover:underline font-semibold ml-2"
                        >
                          <FileDown className="w-3.5 h-3.5" />
                          <span>Surat PDF</span>
                        </a>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Detail */}
      {detailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay">
          <div className="bg-white rounded-md border border-[#D9DEE5] max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E6EAF0]">
              <div>
                <h3 className="text-base font-bold text-[#0B2545]">
                  Detail Permohonan Cuti
                </h3>
                <p className="text-xs text-[#4A5565] font-mono">{detailModal.nomor_pengajuan}</p>
              </div>
              <button
                type="button"
                onClick={() => setDetailModal(null)}
                className="p-1 rounded text-[#4A5565] hover:text-[#1B2430]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs space-y-3">
              <div className="flex justify-between items-center p-2.5 bg-[#FBFAF7] rounded border border-[#E6EAF0]">
                <span className="font-semibold text-[#0B2545]">Status Pengajuan:</span>
                <StatusBadge status={detailModal.status} />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-[#4A5565]">Nama Pegawai:</span>
                  <span className="font-semibold text-[#1B2430]">{detailModal.nama_lengkap}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#4A5565]">Divisi:</span>
                  <span className="text-[#1B2430]">{detailModal.nama_divisi}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#4A5565]">Jenis Cuti:</span>
                  <span className="font-semibold text-[#1B2430]">{detailModal.nama_cuti}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#4A5565]">Periode:</span>
                  <span className="font-semibold text-[#1B2430]">
                    {formatDateRange(detailModal.tanggal_mulai, detailModal.tanggal_selesai)} ({formatDecimal(detailModal.total_hari)} hari)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#4A5565]">Alasan Cuti:</span>
                  <span className="text-[#1B2430] italic max-w-xs text-right">"{detailModal.alasan}"</span>
                </div>
                {detailModal.nama_handover && (
                  <div className="flex justify-between">
                    <span className="text-[#4A5565]">Rekan Handover:</span>
                    <span className="text-[#1B2430]">{detailModal.nama_handover}</span>
                  </div>
                )}
              </div>

              {detailModal.leader_notes && (
                <div className="p-3 bg-[#EEF1F5] rounded text-[11px] space-y-1">
                  <p className="font-semibold text-[#0B2545]">Catatan Atasan ({detailModal.nama_leader}):</p>
                  <p className="italic">"{detailModal.leader_notes}"</p>
                </div>
              )}

              {detailModal.hrd_notes && (
                <div className="p-3 bg-[#EEF1F5] rounded text-[11px] space-y-1">
                  <p className="font-semibold text-[#0B2545]">Catatan HRD ({detailModal.nama_hrd}):</p>
                  <p className="italic">"{detailModal.hrd_notes}"</p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-[#E6EAF0]">
              <button
                type="button"
                onClick={() => setDetailModal(null)}
                className="btn-secondary text-xs h-9 px-4"
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
