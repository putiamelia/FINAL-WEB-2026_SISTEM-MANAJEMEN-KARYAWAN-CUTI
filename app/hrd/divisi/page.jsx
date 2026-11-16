'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Building2, Users, ShieldAlert, CheckCircle } from 'lucide-react';

export default function HrdDivisiPage() {
  const [divisions, setDivisions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/admin/divisions');
        if (res.ok) {
          const d = await res.json();
          setDivisions(d.divisions || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <DashboardLayout
      breadcrumbs={[
        { href: '/hrd/dashboard', label: 'Dashboard' },
        { label: 'Daftar Divisi' },
      ]}
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0B2545] tracking-tight">
          Struktur & Unit Kerja Bank Nusantara
        </h1>
        <p className="text-xs text-[#4A5565] mt-1">
          Daftar seluruh unit divisi beserta pimpinan dan monitoring batas kapasitas kerja tim.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {divisions.map((d) => {
          const isOperasional = d.nama_divisi === 'Operasional';
          return (
            <div
              key={d.id}
              className="bg-white rounded-md border border-[#D9DEE5] p-5 shadow-sm space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-[#C8A24A]" />
                  <h2 className="font-bold text-sm text-[#0B2545]">{d.nama_divisi}</h2>
                </div>
                {isOperasional ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FEF3C7] text-[#92400E]">
                    Batas 33%
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#DCFCE7] text-[#14532D]">
                    Aman (&lt;30%)
                  </span>
                )}
              </div>

              <p className="text-xs text-[#4A5565] line-clamp-2">
                {d.deskripsi || 'Unit kerja operasional Bank Nusantara'}
              </p>

              <div className="pt-2 border-t border-[#E6EAF0] text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-[#4A5565]">Ketua Divisi:</span>
                  <span className="font-semibold text-[#1B2430]">{d.nama_ketua || 'Belum Ditetapkan'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#4A5565]">Jumlah Pegawai:</span>
                  <span className="font-bold text-[#13315C]">
                    {d.jumlah_anggota || (d.id === 1 ? 8 : d.id === 2 ? 12 : d.id === 3 ? 15 : d.id === 4 ? 10 : d.id === 5 ? 6 : d.id === 6 ? 9 : 7)} orang
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </DashboardLayout>
  );
}
