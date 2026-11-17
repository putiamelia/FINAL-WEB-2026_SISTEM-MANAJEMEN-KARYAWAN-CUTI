'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import {
  Calendar,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  FileText,
  UserCheck,
  Send,
  RotateCcw,
  XCircle,
  Info,
} from 'lucide-react';
import { calculateWorkingDays, formatDecimal, formatDateIndo } from '@/lib/utils';

export default function PengajuanCutiPage() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [colleagues, setColleagues] = useState([]);
  const [holidays, setHolidays] = useState([]);

  // Form states
  const [selectedTypeId, setSelectedTypeId] = useState('');
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [tanggalMulai, setTanggalMulai] = useState('');
  const [tanggalSelesai, setTanggalSelesai] = useState('');
  const [alasan, setAlasan] = useState('');
  const [handoverUserId, setHandoverUserId] = useState('');
  const [catatanHandover, setCatatanHandover] = useState('');
  const [alamatCuti, setAlamatCuti] = useState('');
  const [nomorDarurat, setNomorDarurat] = useState('');
  const [lampiranUrl, setLampiranUrl] = useState('');

  // Status & Validation
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    async function initData() {
      try {
        const [profRes, typeRes, userRes, holRes] = await Promise.all([
          fetch('/api/user/profile'),
          fetch('/api/admin/leave-types'),
          fetch('/api/admin/users'),
          fetch('/api/admin/holidays'),
        ]);

        if (profRes.ok) {
          const p = await profRes.json();
          setProfile(p.profile);
          setAlamatCuti(p.profile?.alamat || '');
          setNomorDarurat(p.profile?.nomor_telepon || '');
        }

        if (typeRes.ok) {
          const t = await typeRes.json();
          setLeaveTypes(t.leaveTypes || []);
          if (t.leaveTypes && t.leaveTypes.length > 0) {
            setSelectedTypeId(String(t.leaveTypes[0].id));
          }
        }

        if (userRes.ok) {
          const u = await userRes.json();
          // Rekan divisi
          setColleagues(u.users || []);
        }

        if (holRes.ok) {
          const h = await holRes.json();
          setHolidays(h.holidays?.map((x) => x.tanggal) || []);
        }
      } catch (err) {
        console.error(err);
      }
    }
    initData();
  }, []);

  // Update tanggal selesai jika setengah hari
  useEffect(() => {
    if (isHalfDay && tanggalMulai) {
      setTanggalSelesai(tanggalMulai);
    }
  }, [isHalfDay, tanggalMulai]);

  const selectedType = leaveTypes.find((t) => String(t.id) === String(selectedTypeId));

  // Perhitungan total hari kerja
  let calculatedDays = 0;
  if (isHalfDay) {
    calculatedDays = tanggalMulai ? 0.5 : 0;
  } else if (tanggalMulai && tanggalSelesai) {
    calculatedDays = calculateWorkingDays(tanggalMulai, tanggalSelesai, holidays);
  }

  // Simulasi Kuota (What-If)
  const currentQuota = profile ? parseFloat(profile.sisa_kuota_tahunan) : 7.5;
  const isPotongKuota = selectedType ? selectedType.potong_kuota_utama : true;
  const simulatedQuota = isPotongKuota ? Math.max(0, currentQuota - calculatedDays) : currentQuota;

  // Validasi otomatis realtime
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let hMinValid = true;
  if (tanggalMulai && selectedType && selectedType.nama_cuti === 'Cuti Tahunan') {
    const sDate = new Date(tanggalMulai);
    sDate.setHours(0, 0, 0, 0);
    const diff = Math.ceil((sDate - today) / (1000 * 60 * 60 * 24));
    hMinValid = diff >= (selectedType.minimal_h_pengajuan || 3);
  }

  const quotaValid = !isPotongKuota || currentQuota >= calculatedDays;
  const doctorNoteValid = selectedType?.nama_cuti !== 'Cuti Sakit' || (lampiranUrl && lampiranUrl.trim() !== '');

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!selectedTypeId || !tanggalMulai || !tanggalSelesai || !alasan.trim()) {
      setErrorMsg('Mohon lengkapi semua field yang berbintang merah.');
      return;
    }

    if (calculatedDays <= 0) {
      setErrorMsg('Periode cuti tidak memiliki hari kerja efektif.');
      return;
    }

    if (!hMinValid) {
      setErrorMsg(`Cuti Tahunan harus diajukan minimal H-${selectedType?.minimal_h_pengajuan || 3} hari kerja.`);
      return;
    }

    if (!quotaValid) {
      setErrorMsg('Sisa kuota cuti tahunan Anda tidak mencukupi.');
      return;
    }

    if (!doctorNoteValid) {
      setErrorMsg('Cuti Sakit wajib menyertakan bukti lampiran surat dokter.');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/leave/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leave_type_id: parseInt(selectedTypeId, 10),
          is_half_day: isHalfDay,
          tanggal_mulai: tanggalMulai,
          tanggal_selesai: tanggalSelesai,
          alasan,
          handover_user_id: handoverUserId ? parseInt(handoverUserId, 10) : null,
          catatan_handover: catatanHandover,
          alamat_selama_cuti: alamatCuti,
          nomor_darurat: nomorDarurat,
          lampiran_url: lampiranUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Gagal mengirimkan pengajuan cuti.');
        setLoading(false);
        return;
      }

      setSuccessMsg('Pengajuan cuti berhasil dikirim! Menunggu verifikasi atasan.');
      setTimeout(() => {
        router.push('/karyawan/riwayat');
      }, 1500);
    } catch (err) {
      setErrorMsg('Terjadi kendala jaringan.');
      setLoading(false);
    }
  }

  function handleReset() {
    setIsHalfDay(false);
    setTanggalMulai('');
    setTanggalSelesai('');
    setAlasan('');
    setHandoverUserId('');
    setCatatanHandover('');
    setLampiranUrl('');
    setErrorMsg('');
    setSuccessMsg('');
  }

  return (
    <DashboardLayout
      breadcrumbs={[
        { href: '/karyawan/dashboard', label: 'Dashboard' },
        { label: 'Ajukan Cuti Baru' },
      ]}
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0B2545] tracking-tight">
          Formulir Pengajuan Cuti Pegawai
        </h1>
        <p className="text-xs text-[#4A5565] mt-1">
          Lengkapi formulir di bawah ini dengan data yang valid sesuai ketentuan kebijakan SDM Bank Nusantara.
        </p>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 rounded bg-[#FEE2E2] border border-[#FECACA] text-xs font-semibold text-[#991B1B] flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="mb-6 p-4 rounded bg-[#DCFCE7] border border-[#BBF7D0] text-xs font-semibold text-[#14532D] flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Formulir 4 Seksi A - D (Lebar 8 Kolom) */}
        <form onSubmit={handleSubmit} className="lg:col-span-8 space-y-6">
          {/* SEKSI A: JENIS CUTI */}
          <div className="bg-white rounded-md border border-[#D9DEE5] p-6 shadow-sm">
            <div className="flex items-center gap-2 pb-3 mb-4 border-b border-[#E6EAF0]">
              <span className="w-6 h-6 rounded-full bg-[#13315C] text-white text-xs font-bold flex items-center justify-center">
                A
              </span>
              <h2 className="text-sm font-bold text-[#0B2545]">Pilihan Jenis Cuti</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="leaveType" className="block text-xs font-semibold text-[#1B2430] uppercase mb-1.5">
                  Jenis Cuti <span className="text-[#991B1B]">*</span>
                </label>
                <select
                  id="leaveType"
                  value={selectedTypeId}
                  onChange={(e) => setSelectedTypeId(e.target.value)}
                  className="input-field"
                >
                  {leaveTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nama_cuti} {t.potong_kuota_utama ? '(Memotong Kuota Tahunan)' : '(Tidak Memotong Kuota)'}
                    </option>
                  ))}
                </select>
                {selectedType?.deskripsi && (
                  <p className="text-[11px] text-[#4A5565] mt-1.5 flex items-center gap-1">
                    <Info className="w-3.5 h-3.5 text-[#C8A24A] shrink-0" />
                    <span>{selectedType.deskripsi}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* SEKSI B: WAKTU & PERIODE CUTI */}
          <div className="bg-white rounded-md border border-[#D9DEE5] p-6 shadow-sm">
            <div className="flex items-center gap-2 pb-3 mb-4 border-b border-[#E6EAF0]">
              <span className="w-6 h-6 rounded-full bg-[#13315C] text-white text-xs font-bold flex items-center justify-center">
                B
              </span>
              <h2 className="text-sm font-bold text-[#0B2545]">Jadwal dan Durasi Pelaksanaan</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 bg-[#FBFAF7] p-3 rounded border border-[#E6EAF0]">
                <input
                  id="halfDayCheck"
                  type="checkbox"
                  checked={isHalfDay}
                  onChange={(e) => setIsHalfDay(e.target.checked)}
                  className="w-4 h-4 text-[#13315C] rounded border-[#D9DEE5] focus:ring-[#13315C]"
                />
                <label htmlFor="halfDayCheck" className="text-xs font-medium text-[#1B2430] cursor-pointer">
                  Ambil Cuti Setengah Hari (0,5 Hari Kerja)
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="startDate" className="block text-xs font-semibold text-[#1B2430] uppercase mb-1.5">
                    Tanggal Mulai <span className="text-[#991B1B]">*</span>
                  </label>
                  <input
                    id="startDate"
                    type="date"
                    required
                    value={tanggalMulai}
                    onChange={(e) => setTanggalMulai(e.target.value)}
                    className="input-field"
                  />
                </div>

                <div>
                  <label htmlFor="endDate" className="block text-xs font-semibold text-[#1B2430] uppercase mb-1.5">
                    Tanggal Selesai <span className="text-[#991B1B]">*</span>
                  </label>
                  <input
                    id="endDate"
                    type="date"
                    required
                    disabled={isHalfDay}
                    value={tanggalSelesai}
                    onChange={(e) => setTanggalSelesai(e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>

              {/* Ringkasan Durasi Hari Efektif */}
              <div className="bg-[#EEF1F5] p-3 rounded flex items-center justify-between text-xs">
                <span className="text-[#4A5565] font-medium">Total Hari Kerja Efektif:</span>
                <span className="text-base font-bold text-[#13315C]">
                  {formatDecimal(calculatedDays)} Hari
                </span>
              </div>
            </div>
          </div>

          {/* SEKSI C: ALASAN & DELEGASI TUGAS (HANDOVER) */}
          <div className="bg-white rounded-md border border-[#D9DEE5] p-6 shadow-sm">
            <div className="flex items-center gap-2 pb-3 mb-4 border-b border-[#E6EAF0]">
              <span className="w-6 h-6 rounded-full bg-[#13315C] text-white text-xs font-bold flex items-center justify-center">
                C
              </span>
              <h2 className="text-sm font-bold text-[#0B2545]">Alasan dan Serah Terima Tugas (Handover)</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="leaveReason" className="block text-xs font-semibold text-[#1B2430] uppercase mb-1.5">
                  Alasan Pengajuan Cuti <span className="text-[#991B1B]">*</span>
                </label>
                <textarea
                  id="leaveReason"
                  rows={3}
                  required
                  value={alasan}
                  onChange={(e) => setAlasan(e.target.value)}
                  placeholder="Tuliskan alasan permohonan cuti secara rinci dan jelas..."
                  className="input-field py-2 h-auto text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="handoverUser" className="block text-xs font-semibold text-[#1B2430] uppercase mb-1.5">
                    Rekan Pengganti (Handover)
                  </label>
                  <select
                    id="handoverUser"
                    value={handoverUserId}
                    onChange={(e) => setHandoverUserId(e.target.value)}
                    className="input-field"
                  >
                    <option value="">-- Pilih Rekan Pengganti --</option>
                    {colleagues
                      .filter((c) => c.id !== profile?.id)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nama_lengkap} ({c.jabatan || c.role})
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="handoverNotes" className="block text-xs font-semibold text-[#1B2430] uppercase mb-1.5">
                    Catatan Serah Terima Tugas
                  </label>
                  <input
                    id="handoverNotes"
                    type="text"
                    value={catatanHandover}
                    onChange={(e) => setCatatanHandover(e.target.value)}
                    placeholder="Contoh: Tiket komplain nasabah dialihkan..."
                    className="input-field"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SEKSI D: ALAMAT, KONTAK DARURAT & LAMPIRAN */}
          <div className="bg-white rounded-md border border-[#D9DEE5] p-6 shadow-sm">
            <div className="flex items-center gap-2 pb-3 mb-4 border-b border-[#E6EAF0]">
              <span className="w-6 h-6 rounded-full bg-[#13315C] text-white text-xs font-bold flex items-center justify-center">
                D
              </span>
              <h2 className="text-sm font-bold text-[#0B2545]">Alamat dan Dokumen Pendukung</h2>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="address" className="block text-xs font-semibold text-[#1B2430] uppercase mb-1.5">
                    Alamat Selama Menjalani Cuti
                  </label>
                  <input
                    id="address"
                    type="text"
                    value={alamatCuti}
                    onChange={(e) => setAlamatCuti(e.target.value)}
                    placeholder="Alamat domisili / kota tujuan"
                    className="input-field"
                  />
                </div>

                <div>
                  <label htmlFor="emergencyPhone" className="block text-xs font-semibold text-[#1B2430] uppercase mb-1.5">
                    Nomor Telepon / Kontak Darurat
                  </label>
                  <input
                    id="emergencyPhone"
                    type="text"
                    value={nomorDarurat}
                    onChange={(e) => setNomorDarurat(e.target.value)}
                    placeholder="08123456789"
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="docAttachment" className="block text-xs font-semibold text-[#1B2430] uppercase mb-1.5">
                  Lampiran Dokumen / Surat Dokter {selectedType?.wajib_lampiran && <span className="text-[#991B1B]">*</span>}
                </label>
                <input
                  id="docAttachment"
                  type="text"
                  value={lampiranUrl}
                  onChange={(e) => setLampiranUrl(e.target.value)}
                  placeholder="URL atau nama dokumen (misal: surat_dokter_siloam.pdf)"
                  className="input-field"
                />
                <p className="text-[11px] text-[#4A5565] mt-1">
                  {selectedType?.wajib_lampiran
                    ? 'Wajib melampirkan surat keterangan dokter yang sah.'
                    : 'Opsional: Lampirkan dokumen bukti pendukung bila diperlukan.'}
                </p>
              </div>
            </div>
          </div>

          {/* Tombol Aksi */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={handleReset}
              disabled={loading}
              className="btn-secondary text-xs h-11 px-5"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset</span>
            </button>
            <button
              type="submit"
              disabled={loading || calculatedDays <= 0 || !quotaValid || !hMinValid}
              className="btn-primary text-xs h-11 px-6"
            >
              <Send className="w-4 h-4" />
              <span>{loading ? 'Mengirimkan...' : 'Kirim Pengajuan Cuti'}</span>
            </button>
          </div>
        </form>

        {/* Kolom Kanan: Simulasi Kuota, Kalender & Verifikasi Realtime (4 Kolom) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Card 1: Simulasi Kuota (What-if) */}
          <div className="bg-white rounded-md border border-[#D9DEE5] p-5 shadow-sm">
            <h2 className="text-sm font-bold text-[#0B2545] border-b-2 border-[#C8A24A] pb-2 mb-3">
              Simulasi Kuota Cuti (What-If)
            </h2>
            <div className="p-4 bg-[#FBFAF7] rounded border border-[#E6EAF0] text-center space-y-2">
              <span className="text-[11px] font-semibold text-[#4A5565] uppercase">
                Perubahan Saldo Kuota Tahunan
              </span>
              <div className="text-2xl font-bold text-[#13315C] tracking-tight">
                {formatDecimal(currentQuota)} &rarr; {formatDecimal(simulatedQuota)} <span className="text-xs font-normal text-[#4A5565]">hari</span>
              </div>
              <p className="text-[11px] text-[#4A5565]">
                {isPotongKuota
                  ? `Pengajuan ini akan memotong ${formatDecimal(calculatedDays)} hari kerja.`
                  : 'Jenis cuti ini tidak memotong kuota tahunan Anda.'}
              </p>
            </div>
          </div>

          {/* Card 2: Status Validasi Otomatis */}
          <div className="bg-white rounded-md border border-[#D9DEE5] p-5 shadow-sm">
            <h2 className="text-sm font-bold text-[#0B2545] border-b-2 border-[#C8A24A] pb-2 mb-3">
              Pemeriksaan Kelayakan Otomatis
            </h2>
            <ul className="text-xs space-y-2.5">
              <li className="flex items-center gap-2">
                {quotaValid ? (
                  <CheckCircle className="w-4 h-4 text-[#14532D] shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-[#991B1B] shrink-0" />
                )}
                <span className={quotaValid ? 'text-[#14532D]' : 'text-[#991B1B] font-semibold'}>
                  Saldo kuota mencukupi ({formatDecimal(currentQuota)} hari)
                </span>
              </li>

              <li className="flex items-center gap-2">
                {hMinValid ? (
                  <CheckCircle className="w-4 h-4 text-[#14532D] shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-[#991B1B] shrink-0" />
                )}
                <span className={hMinValid ? 'text-[#14532D]' : 'text-[#991B1B] font-semibold'}>
                  Aturan minimal pengajuan (H-{selectedType?.minimal_h_pengajuan || 0})
                </span>
              </li>

              <li className="flex items-center gap-2">
                {doctorNoteValid ? (
                  <CheckCircle className="w-4 h-4 text-[#14532D] shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-[#991B1B] shrink-0" />
                )}
                <span className={doctorNoteValid ? 'text-[#14532D]' : 'text-[#991B1B] font-semibold'}>
                  Kelengkapan surat dokter/lampiran
                </span>
              </li>

              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-[#14532D] shrink-0" />
                <span className="text-[#14532D]">
                  Pemeriksaan hari kerja (Sabtu & Minggu dikecualikan)
                </span>
              </li>
            </ul>
          </div>

          {/* Card 3: Alur Persetujuan Bertingkat */}
          <div className="bg-[#FBFAF7] rounded-md border border-[#D9DEE5] p-5 shadow-sm">
            <h2 className="text-sm font-bold text-[#0B2545] border-b-2 border-[#C8A24A] pb-2 mb-3">
              Alur Persetujuan (Workflow)
            </h2>
            <div className="text-xs text-[#334155] space-y-2">
              <p className="font-semibold text-[#0B2545]">
                {profile?.role === 'Ketua Divisi' ? 'Alur Ketua Divisi:' : 'Alur Pegawai:'}
              </p>
              <div className="p-3 bg-white rounded border border-[#E6EAF0] text-[11px] leading-relaxed">
                {profile?.role === 'Ketua Divisi' ? (
                  <span>
                    Pengajuan langsung diteruskan ke <strong>Human Resources Division (HRD)</strong> untuk verifikasi dan persetujuan final.
                  </span>
                ) : (
                  <span>
                    1. Verifikasi awal oleh <strong>Ketua Divisi ({profile?.nama_divisi || 'Layanan Nasabah'})</strong>
                    <br />
                    2. Persetujuan final oleh <strong>Human Resources Division (HRD)</strong>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
