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

async function migrate() {
  loadDotEnvIfNeeded();
  let connectionString = process.env.DATABASE_URL;
  if (!connectionString && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      connectionString = `postgresql://postgres.phfzqvmofnqwxszdgjch:${process.env.SUPABASE_SERVICE_ROLE_KEY}@aws-0-us-east-2.pooler.supabase.com:6543/postgres`;
  }

  if (!connectionString) {
    console.error('DATABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not defined');
    process.exit(1);
  }

  console.log('Connecting to database...');
  // Add ?sslmode=require if not present and using the fallback
  if (!connectionString.includes('sslmode=') && !connectionString.includes('localhost')) {
      // Postgres.js handles ssl option in constructor, but connection string params also work.
      // We will pass ssl: 'require' in options to be safe.
  }

  const sql = postgres(connectionString, { ssl: 'require' });

  try {
    console.log('Adding cargo column...');
    await sql`ALTER TABLE "vistos" ADD COLUMN IF NOT EXISTS "cargo" text`;
    console.log('Added cargo column.');

    console.log('Adding salario column...');
    await sql`ALTER TABLE "vistos" ADD COLUMN IF NOT EXISTS "salario" text`;
    console.log('Added salario column.');

    console.log('Adding data_finalizacao column...');
    await sql`ALTER TABLE "vistos" ADD COLUMN IF NOT EXISTS "data_finalizacao" text`;
    console.log('Added data_finalizacao column.');

    console.log('Adding observacoes_finais column...');
    await sql`ALTER TABLE "vistos" ADD COLUMN IF NOT EXISTS "observacoes_finais" text`;
    console.log('Added observacoes_finais column.');

    console.log('Adding data_agendamento_pf column...');
    await sql`ALTER TABLE "vistos" ADD COLUMN IF NOT EXISTS "data_agendamento_pf" text`;
    console.log('Added data_agendamento_pf column.');

    await sql`NOTIFY pgrst, 'reload schema'`;
    
    console.log('Migration completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

migrate();
