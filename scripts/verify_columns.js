const fs = require('fs');
const postgres = require('postgres');

async function verify() {
  let connectionString = process.env.DATABASE_URL;
  if (!connectionString && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      connectionString = `postgresql://postgres.phfzqvmofnqwxszdgjch:${process.env.SUPABASE_SERVICE_ROLE_KEY}@aws-0-us-east-2.pooler.supabase.com:6543/postgres`;
  }

  const sql = postgres(connectionString, { ssl: 'require' });

  try {
    await sql`SELECT cargo, salario FROM vistos LIMIT 1`;
    fs.writeFileSync('verification.txt', 'SUCCESS: Columns exist.');
  } catch (error) {
    fs.writeFileSync('verification.txt', 'ERROR: ' + error.message);
  } finally {
    await sql.end();
  }
}

verify();
