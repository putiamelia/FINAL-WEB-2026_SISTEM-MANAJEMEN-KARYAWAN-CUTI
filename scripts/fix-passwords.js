const { Client } = require('pg');
const bcrypt = require('bcryptjs');

async function main() {
  const validHash = bcrypt.hashSync('password123', 10);
  const client = new Client({
    host: 'localhost',
    port: 5433,
    user: 'postgres',
    password: 'amelia28',
    database: 'db_cuti_karyawan',
  });

  try {
    await client.connect();
    console.log('Connected to db_cuti_karyawan on port 5433.');

    const res = await client.query('UPDATE users SET password_hash = $1', [validHash]);
    console.log(`Berhasil memperbarui kata sandi untuk ${res.rowCount} pengguna ke 'password123'!`);

    const users = await client.query('SELECT id, username, email, nama_lengkap, role FROM users');
    console.table(users.rows);

    await client.end();
  } catch (err) {
    console.error('Error fixing passwords:', err.message);
  }
}

main();
