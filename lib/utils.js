/**
 * Utility functions for Sistem Manajemen Cuti Karyawan BNS Bank Nusantara
 */

function formatDecimal(num) {
  if (num === null || num === undefined) return '0';
  const val = parseFloat(num);
  if (isNaN(val)) return '0';
  return val.toString().replace('.', ',');
}

function formatDateIndo(dateStr) {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return String(dateStr);
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

function formatDateShort(dateStr) {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return String(dateStr);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

function formatDateRange(startDateStr, endDateStr) {
  if (!startDateStr || !endDateStr) return '-';
  const d1 = new Date(startDateStr);
  const d2 = new Date(endDateStr);
  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return `${startDateStr} - ${endDateStr}`;

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  if (d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth()) {
    if (d1.getDate() === d2.getDate()) {
      return `${d1.getDate()} ${months[d1.getMonth()]} ${d1.getFullYear()}`;
    }
    return `${d1.getDate()} - ${d2.getDate()} ${months[d1.getMonth()]} ${d1.getFullYear()}`;
  }
  return `${d1.getDate()} ${months[d1.getMonth()]} - ${d2.getDate()} ${months[d2.getMonth()]} ${d2.getFullYear()}`;
}

/**
 * Menghitung jumlah hari kerja (Senin - Jumat) antara dua tanggal
 */
function calculateWorkingDays(startDateStr, endDateStr, holidayDates = []) {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
    return 0;
  }

  const holidaySet = new Set(holidayDates.map(d => new Date(d).toISOString().slice(0, 10)));
  let count = 0;
  const current = new Date(start);

  while (current <= end) {
    const dayOfWeek = current.getDay();
    const dateIso = current.toISOString().slice(0, 10);
    // 0 = Minggu, 6 = Sabtu
    if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidaySet.has(dateIso)) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }

  return count;
}

const STATUS_BADGES = {
  'Pending': {
    bg: 'bg-[#FEF3C7]',
    text: 'text-[#92400E]',
    border: 'border-[#FDE68A]',
    label: 'Pending',
  },
  'Approved by Leader': {
    bg: 'bg-[#DBEAFE]',
    text: 'text-[#1E3A8A]',
    border: 'border-[#BFDBFE]',
    label: 'Approved by Leader',
  },
  'Approved': {
    bg: 'bg-[#DCFCE7]',
    text: 'text-[#14532D]',
    border: 'border-[#BBF7D0]',
    label: 'Approved',
  },
  'Rejected': {
    bg: 'bg-[#FEE2E2]',
    text: 'text-[#991B1B]',
    border: 'border-[#FECACA]',
    label: 'Rejected',
  },
  'Cancelled': {
    bg: 'bg-[#E5E7EB]',
    text: 'text-[#374151]',
    border: 'border-[#D1D5DB]',
    label: 'Cancelled',
  },
};

module.exports = {
  formatDecimal,
  formatDateIndo,
  formatDateShort,
  formatDateRange,
  calculateWorkingDays,
  STATUS_BADGES,
};
