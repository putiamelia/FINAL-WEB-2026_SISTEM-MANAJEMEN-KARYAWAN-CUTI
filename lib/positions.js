/**
 * Pemetaan Posisi/Jabatan Resmi per Divisi Bank Nusantara
 * Sesuai struktur data organisasi perbankan e-Cuti Bank Nusantara
 */

export const DIVISION_POSITIONS = {
  'Layanan Nasabah': [
    'Customer Service Officer',
    'Senior Customer Service',
    'Customer Care Representative',
    'Front Office Staff',
    'Teller Service Officer',
    'Customer Relations Staff',
    'Head of Customer Service',
    'Staff Layanan Nasabah',
  ],
  'Kredit dan Pembiayaan': [
    'Credit Analyst',
    'Senior Credit Analyst',
    'Loan Officer',
    'Account Officer',
    'Credit Administration Staff',
    'Head of Credit Division',
    'Staff Kredit & Pembiayaan',
  ],
  'Operasional': [
    'Operations Specialist',
    'Operational Staff',
    'Clearing & Settlement Staff',
    'General Affairs Staff',
    'Back Office Officer',
    'Head of Operations',
  ],
  'Teknologi Informasi': [
    'Junior IT Engineer',
    'Senior IT Engineer',
    'IT Support Specialist',
    'Software Engineer',
    'Database Administrator',
    'Network & Infrastructure Engineer',
    'Sistem Administrator',
  ],
  'Kepatuhan dan Risiko': [
    'Risk Analyst',
    'Senior Risk Analyst',
    'Compliance Officer',
    'Internal Auditor',
    'Risk Management Staff',
    'Legal & Compliance Staff',
    'Human Resource Manager',
  ],
  'Keuangan': [
    'Finance & Accounting Staff',
    'Financial Analyst',
    'Treasury Officer',
    'Accounting Supervisor',
    'Tax Officer',
    'Cash Management Specialist',
  ],
  'Pemasaran': [
    'Marketing Specialist',
    'Digital Marketing Officer',
    'Relationship Manager',
    'Brand & Communications Staff',
    'Public Relations Officer',
    'Marketing Campaign Officer',
  ],
};

export const DEFAULT_POSITIONS = [
  'Staff',
  'Senior Staff',
  'Officer',
  'Specialist',
  'Supervisor',
  'Manager',
];

export const ROLE_DEFAULT_POSITIONS = {
  'Admin': ['Sistem Administrator', 'IT Administrator', 'Staff Admin'],
  'HRD': ['Human Resource Manager', 'HR Specialist', 'HR Officer'],
  'Ketua Divisi': ['Head of Division', 'Ketua Divisi', 'Supervisor'],
  'Karyawan': DEFAULT_POSITIONS,
};

/**
 * Mengambil daftar jabatan berdasarkan nama divisi
 */
export function getPositionsByDivisionName(divisionName) {
  if (!divisionName) return DEFAULT_POSITIONS;
  const normalized = divisionName.trim().toLowerCase();
  for (const [key, list] of Object.entries(DIVISION_POSITIONS)) {
    if (key.toLowerCase() === normalized) {
      return list;
    }
  }
  return DEFAULT_POSITIONS;
}

/**
 * Mengambil daftar jabatan berdasarkan objek divisi
 */
export function getPositionsForDivision(division) {
  if (!division) return DEFAULT_POSITIONS;
  if (Array.isArray(division.positions) && division.positions.length > 0) {
    return division.positions;
  }
  return getPositionsByDivisionName(division.nama_divisi || division.name);
}
