import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import { getPositionsByDivisionName } from '@/lib/positions';

// GET: Ambil daftar divisi beserta daftar jabatan terkait untuk dropdown saat registrasi
export async function GET() {
  try {
    const res = await query(
      `SELECT id, nama_divisi FROM divisions ORDER BY nama_divisi ASC`
    );

    // Ambil jabatan yang sudah ada di database per divisi
    const dbPositionsByDiv = {};
    try {
      const posRes = await query(
        `SELECT DISTINCT divisi_id, jabatan FROM users WHERE jabatan IS NOT NULL AND TRIM(jabatan) != ''`
      );
      posRes.rows.forEach((r) => {
        if (!dbPositionsByDiv[r.divisi_id]) dbPositionsByDiv[r.divisi_id] = [];
        if (!dbPositionsByDiv[r.divisi_id].includes(r.jabatan)) {
          dbPositionsByDiv[r.divisi_id].push(r.jabatan);
        }
      });
    } catch (e) {
      console.warn('Gagal memuat distinct jabatan dari users:', e.message);
    }

    const divisionsWithPositions = res.rows.map((d) => {
      const standardPositions = getPositionsByDivisionName(d.nama_divisi);
      const fromDb = dbPositionsByDiv[d.id] || [];
      const combined = Array.from(new Set([...standardPositions, ...fromDb]));
      return {
        ...d,
        positions: combined,
      };
    });

    return NextResponse.json({ divisions: divisionsWithPositions });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST: Registrasi akun pegawai baru dengan hashing password (bcryptjs)
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      username,
      email,
      password,
      nama_lengkap,
      divisi_id,
      jabatan = 'Staff',
      nomor_telepon = '',
      alamat = '',
    } = body;

    // Validasi field wajib
    if (!username || !email || !password || !nama_lengkap) {
      return NextResponse.json(
        { error: 'Nama lengkap, username, email, dan kata sandi wajib diisi.' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Kata sandi minimal harus 6 karakter.' },
        { status: 400 }
      );
    }

    // Cek apakah username atau email sudah terdaftar
    const checkRes = await query(
      `SELECT id FROM users WHERE LOWER(email) = LOWER($1) OR LOWER(username) = LOWER($2)`,
      [email.trim(), username.trim()]
    );
    if (checkRes.rows.length > 0) {
      return NextResponse.json(
        { error: 'Email atau username tersebut sudah terdaftar di sistem.' },
        { status: 400 }
      );
    }

    // Hash kata sandi menggunakan bcryptjs (bukan plaintext)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Default kuota tahunan sesuai ketentuan perbankan BNS (12 hari)
    const kuotaAwal = 12.0;

    const insertSql = `
      INSERT INTO users (
        username, email, password_hash, nama_lengkap, role, jabatan,
        divisi_id, kuota_tahunan_awal, sisa_kuota_tahunan, kuota_terpakai,
        nomor_telepon, alamat, status_aktif, tanggal_bergabung, foto_profil
      ) VALUES ($1, $2, $3, $4, 'Karyawan', $5, $6, $7, $7, 0, $8, $9, TRUE, CURRENT_DATE, NULL)
      RETURNING id, username, email, nama_lengkap, role, jabatan, sisa_kuota_tahunan
    `;

    const res = await query(insertSql, [
      username.trim(),
      email.trim(),
      hashedPassword,
      nama_lengkap.trim(),
      jabatan.trim() || 'Staff',
      divisi_id ? parseInt(divisi_id, 10) : null,
      kuotaAwal,
      nomor_telepon.trim() || null,
      alamat.trim() || null,
    ]);

    return NextResponse.json(
      {
        message: 'Registrasi berhasil! Akun Anda telah terdaftar dengan aman.',
        user: res.rows[0],
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('Error saat registrasi user:', err);
    return NextResponse.json(
      { error: 'Gagal melakukan registrasi: ' + err.message },
      { status: 500 }
    );
  }
}
