import { NextResponse } from 'next/server';
import { NotificationService } from '@/lib/notification';
import { getSupabaseAdminClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = getSupabaseAdminClient();

  try {
    console.log('⏰ Starting Cron Job: Notifications');

    // 1. Process Retry Queue
    await NotificationService.processRetryQueue();

    // 2. Check Deadlines
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Fetch active assignments with due dates
    const { data: steps, error } = await supabase
      .from('step_assignments')
      .select('*')
      .not('due_date', 'is', null)
      .is('completed_at', null);

    if (error) {
      console.error('Error fetching steps:', error);
      throw error;
    }

    console.log(`Found ${steps?.length || 0} active steps with deadlines.`);

    let notificationsSent = 0;

    for (const step of steps || []) {
      const dueDate = new Date(step.due_date);
      // Fix timezone issues if needed, usually dates are YYYY-MM-DD
      // If due_date is string YYYY-MM-DD, parsing it might default to UTC.
      // We'll treat it as local date (00:00).
      const dueDateTime = new Date(dueDate.toISOString().split('T')[0] + 'T00:00:00');
      
      const diffTime = dueDateTime.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // We want to notify exactly on 5 days remaining and 2 days remaining
      let warningType = null;
      if (diffDays === 5) warningType = 5;
      if (diffDays === 2) warningType = 2;

      if (warningType) {
        // Check if we already sent a warning TODAY for this step and type
        // This prevents duplicate alerts if the cron runs multiple times a day
        const messageSignature = `${warningType} dias para o vencimento`;
        
        const { data: existingAlert } = await supabase
          .from('alerts')
          .select('id')
          .eq('module_type', step.module_type)
          .eq('record_id', step.record_id)
          .eq('alert_for', 'deadline_warning')
          .ilike('message', `%${messageSignature}%`)
          .gte('created_at', new Date(today).toISOString()) 
          .single();

        if (!existingAlert) {
          // Fetch record details to get client name
          let clientName = `Processo ${step.record_id}`;
          const tableName = step.module_type; 
          
          try {
             const { data: record } = await supabase
               .from(tableName)
               .select('client_name')
               .eq('id', step.record_id)
               .single();
             if (record && record.client_name) clientName = record.client_name;
          } catch (e) {
             // Ignore table not found errors
          }

          const moduleSlug = step.module_type.replace(/_/g, '-');

          await NotificationService.createNotification(
            'deadline_warning',
            {
              moduleSlug: moduleSlug,
              recordId: step.record_id,
              processName: clientName,
              daysRemaining: diffDays,
              dueDate: step.due_date
            },
            step.module_type,
            step.record_id,
            `Alerta de Prazo: Faltam ${warningType} dias para o vencimento de etapa no processo de ${clientName}`
          );
          notificationsSent++;
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Cron processed successfully', 
      notificationsSent 
    });

  } catch (error: any) {
    console.error('Cron error:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 });
  }
}
