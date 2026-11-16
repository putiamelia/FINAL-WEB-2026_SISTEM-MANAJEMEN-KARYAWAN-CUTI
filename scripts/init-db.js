const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function main() {
  let config = {
    host: process.env.PGHOST || 'localhost',
    port: parseInt(process.env.PGPORT || '5432', 10),
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || '',
    database: process.env.PGDATABASE || 'postgres',
  };

  if (process.env.DATABASE_URL) {
    try {
      const u = new URL(process.env.DATABASE_URL);
      config = {
        host: u.hostname || 'localhost',
        port: parseInt(u.port || '5432', 10),
        user: decodeURIComponent(u.username || 'postgres'),
        password: decodeURIComponent(u.password || ''),
        database: u.pathname ? u.pathname.replace(/^\//, '') : 'postgres',
      };
    } catch (e) {
      console.warn('Could not parse DATABASE_URL, using default config:', e.message);
    }
  }

  console.log(`Connecting to PostgreSQL at ${config.host}:${config.port} as ${config.user}...`);
  const adminClient = new Client(config);

  try {
    await adminClient.connect();
    console.log('Connected to PostgreSQL server.');

    // Check if target database exists
    const targetDb = process.env.TARGET_DB || 'db_cuti_karyawan';
    const checkDb = await adminClient.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [targetDb]
    );

    if (checkDb.rows.length === 0) {
      console.log(`Creating database "${targetDb}"...`);
      await adminClient.query(`CREATE DATABASE "${targetDb}";`);
      console.log(`Database "${targetDb}" created successfully.`);
    } else {
      console.log(`Database "${targetDb}" already exists.`);
    }
    await adminClient.end();

    // Connect to target database and run database.sql
    const targetClient = new Client({
      ...config,
      database: targetDb,
    });
    await targetClient.connect();
    console.log(`Connected to database "${targetDb}". Running database.sql...`);

    const sqlPath = path.join(__dirname, '..', 'database.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    await targetClient.query(sqlContent);
    console.log('database.sql executed successfully!');

    // Verify tables
    const tables = await targetClient.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    console.log('Created tables:');
    tables.rows.forEach(r => console.log(` - ${r.table_name}`));

    await targetClient.end();
    console.log('\nDatabase setup complete!');
  } catch (err) {
    console.error('Error during database initialization:', err.message);
    process.exit(1);
  }
}

main();
