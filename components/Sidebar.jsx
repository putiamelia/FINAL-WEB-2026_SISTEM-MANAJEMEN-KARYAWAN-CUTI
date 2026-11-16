'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  CalendarPlus,
  History,
  User,
  LogOut,
  CheckSquare,
  FileCheck,
  Building2,
  Users,
  Layers,
  CalendarRange,
  Menu,
  X,
  FileText,
} from 'lucide-react';

export default function Sidebar({ user }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/');
      router.refresh();
    } catch (err) {
      console.error(err);
      window.location.href = '/';
    }
  }

  const role = user?.role || 'Karyawan';

  let menuSections = [];

  if (role === 'Karyawan') {
    menuSections = [
      {
        label: 'MENU UTAMA',
        items: [
          { href: '/karyawan/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { href: '/karyawan/pengajuan', label: 'Ajukan Cuti', icon: CalendarPlus },
          { href: '/karyawan/riwayat', label: 'Riwayat Pengajuan', icon: History },
        ],
      },
      {
        label: 'AKUN',
        items: [
          { href: '/karyawan/profil', label: 'Profil Saya', icon: User },
        ],
      },
    ];
  } else if (role === 'Ketua Divisi') {
    menuSections = [
      {
        label: 'MENU UTAMA',
        items: [
          { href: '/ketua/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { href: '/ketua/verifikasi', label: 'Verifikasi Pengajuan', icon: CheckSquare },
          { href: '/ketua/pengajuan', label: 'Ajukan Cuti ke HRD', icon: CalendarPlus },
          { href: '/ketua/riwayat', label: 'Riwayat Pengajuan', icon: History },
        ],
      },
      {
        label: 'AKUN',
        items: [
          { href: '/ketua/profil', label: 'Profil Saya', icon: User },
        ],
      },
    ];
  } else if (role === 'HRD') {
    menuSections = [
      {
        label: 'MENU UTAMA',
        items: [
          { href: '/hrd/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { href: '/hrd/persetujuan', label: 'Persetujuan Final', icon: FileCheck },
          { href: '/hrd/semua-pengajuan', label: 'Semua Pengajuan', icon: History },
          { href: '/hrd/divisi', label: 'Daftar Divisi', icon: Building2 },
        ],
      },
      {
        label: 'AKUN',
        items: [
          { href: '/hrd/profil', label: 'Profil Saya', icon: User },
        ],
      },
    ];
  } else if (role === 'Admin') {
    menuSections = [
      {
        label: 'MENU UTAMA',
        items: [
          { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { href: '/admin/pengguna', label: 'Pengguna', icon: Users },
          { href: '/admin/divisi', label: 'Divisi', icon: Building2 },
          { href: '/admin/anggota-divisi', label: 'Anggota Divisi', icon: Users },
          { href: '/admin/jenis-cuti', label: 'Jenis Cuti', icon: Layers },
          { href: '/admin/hari-libur', label: 'Hari Libur & Cuti', icon: CalendarRange },
          { href: '/admin/blackout', label: 'Blackout Period', icon: FileText },
        ],
      },
      {
        label: 'AKUN',
        items: [
          { href: '/admin/profil', label: 'Profil', icon: User },
        ],
      },
    ];
  }

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#0B2545] text-white p-5 justify-between">
      <div>
        {/* Brand Logo Box in cream as specified in DESIGN.md */}
        <div className="bg-[#FBFAF7] p-2.5 rounded mb-6 flex flex-col items-center justify-center border border-[#D9DEE5]">
          <img
            src="/assets/logo-bns.png"
            alt="Logo Bank Nusantara"
            className="h-10 w-auto object-contain"
          />
          <span className="text-xs font-semibold text-[#13315C] mt-1 tracking-wide">
            e-Cuti Karyawan
          </span>
        </div>

        {/* Navigation Groups */}
        <nav aria-label="Navigasi Utama" className="space-y-6">
          {menuSections.map((section, idx) => (
            <div key={idx}>
              <div className="text-[11px] font-semibold text-[#9FB0CC] tracking-wider mb-2 px-3">
                {section.label}
              </div>
              <ul className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded text-sm transition-colors ${
                          isActive
                            ? 'bg-[#17386B] text-white font-semibold'
                            : 'text-[#C9D3E3] hover:text-white hover:bg-[#13315C]/50'
                        }`}
                      >
                        <Icon
                          className={`w-5 h-5 ${
                            isActive ? 'text-[#E3C06D]' : 'text-[#C9D3E3]'
                          }`}
                          strokeWidth={1.8}
                          aria-hidden="true"
                        />
                        <span>{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      {/* User Card at bottom of sidebar */}
      <div className="pt-4 border-t border-[#13315C]">
        <div className="bg-[#13315C] rounded p-3 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={user?.foto_profil || '/assets/foto-karyawan.png'}
              alt={user?.nama_lengkap || 'User'}
              className="w-10 h-10 rounded-full object-cover shrink-0 border border-white/20"
            />
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate text-white">
                {user?.nama_lengkap || 'Pengguna'}
              </p>
              <p className="text-xs text-[#9FB0CC] truncate">
                {user?.role}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            title="Keluar"
            aria-label="Keluar dari akun"
            className="p-1.5 rounded text-[#C9D3E3] hover:text-white hover:bg-white/10 transition-colors shrink-0"
          >
            <LogOut className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile top trigger bar */}
      <div className="lg:hidden flex items-center justify-between bg-[#0B2545] text-white px-4 py-3 border-b border-[#13315C]">
        <div className="flex items-center gap-2">
          <img src="/assets/logo-bns.png" alt="BNS" className="h-6 w-auto bg-[#FBFAF7] p-1 rounded" />
          <span className="font-semibold text-sm">e-Cuti BNS</span>
        </div>
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded hover:bg-[#13315C] text-white"
          aria-label={mobileOpen ? 'Tutup menu' : 'Buka menu'}
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Desktop Static Sidebar */}
      <aside className="hidden lg:block w-[260px] shrink-0 min-h-screen">
        <div className="fixed top-0 bottom-0 w-[260px]">
          {sidebarContent}
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div className="relative w-[280px] max-w-full h-full z-10">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
