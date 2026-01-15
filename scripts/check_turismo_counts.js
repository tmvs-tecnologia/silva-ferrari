const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://phfzqvmofnqwxszdgjch.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBoZnpxdm1vZm5xd3hzemRnamNoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTY4MTUzMiwiZXhwIjoyMDc3MjU3NTMyfQ.CPi3Ighr9H8M-3ImsgEUtP44HawTJ_PtfNKEhROStZk";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkCounts() {
  console.log("--- Checking Record Counts ---");

  try {
    // 1. Check 'vistos' table for Tourism records
    const { count: vistosCount, error: vistosError } = await supabase
      .from('vistos')
      .select('*', { count: 'exact', head: true })
      .ilike('type', '%urismo%');

    if (vistosError) {
      console.error("Error checking 'vistos':", vistosError.message);
    } else {
      console.log(`Records in 'vistos' matching '%urismo%': ${vistosCount}`);
    }

    // 2. Check 'turismo' table total count
    const { count: turismoCount, error: turismoError } = await supabase
      .from('turismo')
      .select('*', { count: 'exact', head: true });

    if (turismoError) {
      console.error("Error checking 'turismo':", turismoError.message);
      if (turismoError.code === '42P01') {
        console.log("-> Table 'turismo' likely does not exist.");
      }
    } else {
      console.log(`Total records in 'turismo': ${turismoCount}`);
    }

    // 3. Diagnosis
    if (vistosCount > 0 && (turismoCount === 0 || turismoCount === null)) {
      console.log("\n[DIAGNOSIS] Migration required: Data exists in 'vistos' but 'turismo' is empty.");
    } else if (vistosCount === 0 && turismoCount > 0) {
      console.log("\n[DIAGNOSIS] Migration complete: Data is in 'turismo' and cleared from 'vistos' (or verified).");
    } else if (vistosCount > 0 && turismoCount > 0) {
      console.log("\n[DIAGNOSIS] Mixed state: Records exist in both tables. Potential duplication or partial migration.");
    } else {
      console.log("\n[DIAGNOSIS] No data found in either table.");
    }

  } catch (err) {
    console.error("Unexpected error:", err);
  }
}

checkCounts();
