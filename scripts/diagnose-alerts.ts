import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAlertsTable() {
  console.log('Checking alerts table structure...');

  const { data: alerts, error } = await supabase
    .from('alerts')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error selecting from alerts:', error);
    return;
  }

  console.log('Successfully selected from alerts.');
  if (alerts && alerts.length > 0) {
    console.log('Existing alert structure:', Object.keys(alerts[0]));
  } else {
    console.log('Alerts table is empty, trying to insert a dummy record to check columns...');
    
    // Try to insert with ALL expected columns
    const { data: inserted, error: insertError } = await supabase
      .from('alerts')
      .insert({
        module_type: 'test_diagnosis',
        record_id: 1,
        alert_for: 'diagnosis',
        message: 'Test message',
        data: '{"test": true}',
        status: 'pending',
        retry_count: 0,
        is_read: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert failed:', insertError);
      console.log('This likely means columns are missing.');
    } else {
      console.log('Insert successful:', inserted);
      // Clean up
      await supabase.from('alerts').delete().eq('id', inserted.id);
    }
  }
}

checkAlertsTable();
