
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@/db/schema';

// Construir a URL de conexão do Supabase
const connectionString = `postgresql://postgres.phfzqvmofnqwxszdgjch:${process.env.SUPABASE_SERVICE_ROLE_KEY}@aws-0-us-east-2.pooler.supabase.com:6543/postgres`;

const client = postgres(connectionString, {
  max: 1,
  options: {
    search_path: 'public'
  }
});

export const db = drizzle(client, { schema });

export type Database = typeof db;