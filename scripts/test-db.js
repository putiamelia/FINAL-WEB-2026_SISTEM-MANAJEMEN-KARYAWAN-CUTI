const { Client } = require('pg');

const passwords = [
  'postgres',
  '123456',
  '12345678',
  '1234',
  'admin',
  'password',
  'putiamelia',
  'root',
  'postgres123',
  'admin123',
  'PutiAmelia',
  'puti',
  'amelia',
  'secret',
  ''
];

async function tryPassword(pw) {
  const client = new Client({
    host: 'localhost',
    port: 5433,
    user: 'postgres',
    password: pw,
    database: 'postgres',
    connectionTimeoutMillis: 1500,
  });

  try {
    await client.connect();
    console.log(`\n🎉🎉 FOUND WORKING PASSWORD: "${pw}"`);
    const res = await client.query('SELECT version();');
    console.log('Postgres version:', res.rows[0].version);
    await client.end();
    return true;
  } catch (err) {
    // console.log(`pw "${pw}": ${err.message}`);
    try { await client.end(); } catch (e) {}
    return false;
  }
}

async function main() {
  for (const pw of passwords) {
    const ok = await tryPassword(pw);
    if (ok) process.exit(0);
  }
  console.log('None of the common passwords worked.');
}

main();
