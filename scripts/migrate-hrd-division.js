const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Parse .env.local manually
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim();
        process.env[key] = val;
      }
    }
  });
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:amelia28@localhost:5433/db_cuti_karyawan',
});

async function migrate() {
  let client;
  try {
    client = await pool.connect();
    console.log('Connected to PostgreSQL database...');

    // 1. Cek apakah divisi Human Resources sudah ada
    let divRes = await client.query(`SELECT id, nama_divisi FROM divisions WHERE nama_divisi = 'Human Resources'`);
    let hrdDivId;

    if (divRes.rows.length === 0) {
      console.log('Menambahkan divisi Human Resources...');
      const insertDiv = await client.query(`
        INSERT INTO divisions (nama_divisi, deskripsi, tanggal_dibentuk)
        VALUES ('Human Resources', 'Pengelolaan kepegawaian, pengembangan talenta, dan kesejahteraan karyawan', '2020-01-15')
        RETURNING id, nama_divisi
      `);
      hrdDivId = insertDiv.rows[0].id;
      console.log(`Divisi Human Resources berhasil ditambahkan dengan ID: ${hrdDivId}`);
    } else {
      hrdDivId = divRes.rows[0].id;
      console.log(`Divisi Human Resources sudah ada dengan ID: ${hrdDivId}`);
    }

    // 2. Update akun HRD (Puti Amelia dan semua akun role HRD) ke divisi Human Resources
    const updateRes = await client.query(`
      UPDATE users 
      SET divisi_id = $1 
      WHERE role = 'HRD' OR username = 'puti.amelia' OR email = 'hrd@banknusantara.co.id'
      RETURNING id, username, nama_lengkap, role, divisi_id
    `, [hrdDivId]);

    console.log('Akun HRD yang diperbarui:', updateRes.rows);
    console.log('Migrasi selesai dengan sukses!');
  } catch (err) {
    console.error('Error saat migrasi:', err);
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

migrate();
