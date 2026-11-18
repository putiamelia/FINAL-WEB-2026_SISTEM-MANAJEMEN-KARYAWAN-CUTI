import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import { verifyToken, TOKEN_NAME } from '@/lib/auth';

export async function GET(request) {
  try {
    const token = request.cookies.get(TOKEN_NAME)?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded || (decoded.role !== 'Admin' && decoded.role !== 'HRD' && decoded.role !== 'Ketua Divisi')) {
      return NextResponse.json({ error: 'Akses khusus Admin, HRD, dan Ketua Divisi' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const divisi_id = searchParams.get('divisi_id');
    const status_aktif = searchParams.get('status_aktif');
    const search = searchParams.get('search');

    let sql = `
      SELECT u.id, u.username, u.email, u.nama_lengkap, u.role, u.jabatan,
             u.divisi_id, d.nama_divisi, u.kuota_tahunan_awal, u.sisa_kuota_tahunan,
             u.kuota_terpakai, u.nomor_telepon, u.alamat, u.status_aktif,
             u.tanggal_bergabung, u.foto_profil, u.created_at
      FROM users u
      LEFT JOIN divisions d ON u.divisi_id = d.id
      WHERE 1=1
    `;

    // Jika Ketua Divisi, batasi query khusus untuk anggota divisi miliknya
    if (decoded.role === 'Ketua Divisi' && decoded.divisi_id) {
      sql += ` AND u.divisi_id = ${parseInt(decoded.divisi_id, 10)}`;
    }
    const params = [];

    if (role && role !== 'Semua') {
      params.push(role);
      sql += ` AND u.role = $${params.length}`;
    }

    if (divisi_id && divisi_id !== 'Semua') {
      params.push(parseInt(divisi_id, 10));
      sql += ` AND u.divisi_id = $${params.length}`;
    }

    if (status_aktif && status_aktif !== 'Semua') {
      params.push(status_aktif === 'true');
      sql += ` AND u.status_aktif = $${params.length}`;
    }

    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      sql += ` AND (LOWER(u.nama_lengkap) LIKE $${params.length} OR LOWER(u.username) LIKE $${params.length} OR LOWER(u.email) LIKE $${params.length})`;
    }

    sql += ` ORDER BY u.created_at DESC`;

    const res = await query(sql, params);
    return NextResponse.json({ users: res.rows });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const token = request.cookies.get(TOKEN_NAME)?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'Admin') {
      return NextResponse.json({ error: 'Akses khusus Admin' }, { status: 403 });
    }

    const body = await request.json();
    const {
      username,
      email,
      password,
      nama_lengkap,
      role,
      jabatan,
      divisi_id,
      kuota_tahunan_awal = 12.0,
      nomor_telepon,
      alamat,
      tanggal_bergabung,
      foto_profil = '/assets/foto-karyawan.png',
    } = body;

    if (!username || !email || !password || !nama_lengkap || !role) {
      return NextResponse.json({ error: 'Semua field wajib diisi.' }, { status: 400 });
    }

    // Cek keunikan email & username
    const checkRes = await query(
      `SELECT id FROM users WHERE LOWER(email) = LOWER($1) OR LOWER(username) = LOWER($2)`,
      [email.trim(), username.trim()]
    );
    if (checkRes.rows.length > 0) {
      return NextResponse.json({ error: 'Email atau username sudah terdaftar.' }, { status: 400 });
    }

    const hashed = await bcrypt.hash(password, 10);
    const kuota = parseFloat(kuota_tahunan_awal) || 12.0;

    const insertRes = await query(
      `INSERT INTO users (
         username, email, password_hash, nama_lengkap, role, jabatan,
         divisi_id, kuota_tahunan_awal, sisa_kuota_tahunan, kuota_terpakai,
         nomor_telepon, alamat, status_aktif, tanggal_bergabung, foto_profil
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8, 0, $9, $10, TRUE, $11, $12)
       RETURNING id, username, email, nama_lengkap, role, foto_profil`,
      [
        username.trim(),
        email.trim(),
        hashed,
        nama_lengkap.trim(),
        role,
        jabatan || 'Staff',
        divisi_id ? parseInt(divisi_id, 10) : null,
        kuota,
        nomor_telepon || null,
        alamat || null,
        tanggal_bergabung || new Date().toISOString().slice(0, 10),
        foto_profil || '/assets/foto-karyawan.png',
      ]
    );

    return NextResponse.json({
      message: 'Pengguna berhasil ditambahkan.',
      user: insertRes.rows[0],
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const token = request.cookies.get(TOKEN_NAME)?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'Admin') {
      return NextResponse.json({ error: 'Akses khusus Admin' }, { status: 403 });
    }

    const body = await request.json();
    const {
      id,
      username,
      email,
      password,
      nama_lengkap,
      role,
      jabatan,
      divisi_id,
      status_aktif,
      nomor_telepon,
      alamat,
      foto_profil,
    } = body;

    if (!id || !username || !email || !nama_lengkap || !role) {
      return NextResponse.json({ error: 'Data wajib diisi lengkap.' }, { status: 400 });
    }

    // Cek keunikan email & username untuk ID lain
    const checkRes = await query(
      `SELECT id FROM users WHERE (LOWER(email) = LOWER($1) OR LOWER(username) = LOWER($2)) AND id != $3`,
      [email.trim(), username.trim(), id]
    );
    if (checkRes.rows.length > 0) {
      return NextResponse.json({ error: 'Email atau username sudah digunakan pengguna lain.' }, { status: 400 });
    }

    let updateSql = `
      UPDATE users
      SET username = $1, email = $2, nama_lengkap = $3, role = $4,
          jabatan = $5, divisi_id = $6, status_aktif = $7,
          nomor_telepon = $8, alamat = $9, updated_at = CURRENT_TIMESTAMP
    `;
    const params = [
      username.trim(),
      email.trim(),
      nama_lengkap.trim(),
      role,
      jabatan || 'Staff',
      divisi_id ? parseInt(divisi_id, 10) : null,
      status_aktif !== undefined ? status_aktif : true,
      nomor_telepon || null,
      alamat || null,
    ];

    if (foto_profil !== undefined) {
      params.push(foto_profil);
      updateSql += `, foto_profil = $${params.length}`;
    }

    if (password && password.trim() !== '') {
      params.push(await bcrypt.hash(password, 10));
      updateSql += `, password_hash = $${params.length}`;
    }

    params.push(id);
    updateSql += ` WHERE id = $${params.length} RETURNING id, username, email, nama_lengkap, role, foto_profil`;

    const res = await query(updateSql, params);
    return NextResponse.json({ message: 'Pengguna berhasil diperbarui.', user: res.rows[0] });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const token = request.cookies.get(TOKEN_NAME)?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'Admin') {
      return NextResponse.json({ error: 'Akses khusus Admin' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get('id'), 10);

    if (!id) return NextResponse.json({ error: 'ID pengguna tidak valid' }, { status: 400 });

    if (id === decoded.id) {
      return NextResponse.json({ error: 'Anda tidak dapat menghapus akun Anda sendiri.' }, { status: 400 });
    }

    // Cek role target (hanya boleh hapus Karyawan & Ketua Divisi)
    const targetRes = await query(`SELECT id, role, nama_lengkap FROM users WHERE id = $1`, [id]);
    if (targetRes.rows.length === 0) {
      return NextResponse.json({ error: 'Pengguna tidak ditemukan' }, { status: 404 });
    }
    const targetUser = targetRes.rows[0];

    if (targetUser.role === 'Admin') {
      return NextResponse.json({ error: 'Tidak dapat menghapus akun Administrator.' }, { status: 400 });
    }

    // Proteksi relasi data: tidak dapat dihapus jika memiliki cuti aktif / pending
    const activeLeaveRes = await query(
      `SELECT id FROM leave_requests WHERE user_id = $1 AND status IN ('Pending', 'Approved by Leader')`,
      [id]
    );
    if (activeLeaveRes.rows.length > 0) {
      return NextResponse.json(
        { error: 'Pengguna tidak dapat dihapus karena masih memiliki permohonan cuti aktif/pending.' },
        { status: 400 }
      );
    }

    await query(`DELETE FROM users WHERE id = $1`, [id]);
    return NextResponse.json({ message: `Pengguna ${targetUser.nama_lengkap} berhasil dihapus.` });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
