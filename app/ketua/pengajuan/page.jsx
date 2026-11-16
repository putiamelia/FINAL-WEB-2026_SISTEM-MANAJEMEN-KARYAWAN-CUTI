'use client';

import PengajuanCutiPage from '@/app/karyawan/pengajuan/page';

// Reuse form pengajuan cuti dengan deteksi otomatis role Ketua Divisi -> HRD
export default function KetuaPengajuanPage() {
  return <PengajuanCutiPage />;
}
