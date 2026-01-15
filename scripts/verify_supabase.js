const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load env vars manually if dotenv is not available, or just use the known keys for this environment
const SUPABASE_URL = "https://phfzqvmofnqwxszdgjch.supabase.co";
// Using service role key for verification to ensure we have permissions
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBoZnpxdm1vZm5xd3hzemRnamNoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTY4MTUzMiwiZXhwIjoyMDc3MjU3NTMyfQ.CPi3Ighr9H8M-3ImsgEUtP44HawTJ_PtfNKEhROStZk";

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
