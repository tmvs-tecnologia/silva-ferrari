const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error('Missing SUPABASE env vars (NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY)');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function verifySupabase() {
  console.log("--- Supabase Connection Verification ---");
  console.log(`URL: ${SUPABASE_URL}`);
  
  try {
    // 1. Check basic connection by querying a known table or just checking health
    // We'll try to select from 'turismo' directly
    console.log("Checking 'turismo' table access...");
    
    const { data, error, count } = await supabase
      .from('turismo')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error("❌ Connection Failed or Table Missing:");
      console.error(error);
      
      if (error.code === '42P01') {
        console.error("Diagnosis: The table 'turismo' does not exist.");
        console.error("Action: Please run the SQL migration 'drizzle/0099_migrate_turismo.sql' in Supabase SQL Editor.");
      }
      process.exit(1);
    }

    console.log("✅ Connection Successful!");
    console.log(`✅ Table 'turismo' exists.`);
    console.log(`📊 Current record count: ${count}`);

    // 2. Check if we can read one record
    if (count > 0) {
      const { data: records, error: readError } = await supabase
        .from('turismo')
        .select('id, client_name, status')
        .limit(1);
        
      if (readError) {
        console.error("❌ Failed to read records:", readError);
      } else {
        console.log("✅ Read test successful. Sample record:", records[0]);
      }
    } else {
      console.log("ℹ️ Table is empty. No read test performed.");
    }

  } catch (err) {
    console.error("❌ Unexpected error:", err);
    process.exit(1);
  }
}

verifySupabase();
