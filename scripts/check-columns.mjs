import postgres from 'postgres';
import fs from 'node:fs';
import path from 'node:path';

function loadDotEnvIfNeeded() {
  const envPath = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) return;
  const raw = fs.readFileSync(envPath, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    const key = match[1];
    if (process.env[key] !== undefined) continue;
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

async function checkColumns() {
  loadDotEnvIfNeeded();
  let connectionString = process.env.DATABASE_URL;
  if (!connectionString && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      connectionString = `postgresql://postgres.phfzqvmofnqwxszdgjch:${process.env.SUPABASE_SERVICE_ROLE_KEY}@aws-0-us-east-2.pooler.supabase.com:6543/postgres`;
  }

  if (!connectionString) {
    console.error('DATABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not defined');
    process.exit(1);
  }

  const sql = postgres(connectionString, { ssl: 'require' });

  try {
    console.log('Checking for cargo column...');
    // Try to select the column. If it doesn't exist, this will throw.
    await sql`SELECT cargo, salario FROM vistos LIMIT 1`;
    console.log('Columns cargo and salario exist!');
  } catch (error) {
    console.error('Check failed:', error.message);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

checkColumns();
