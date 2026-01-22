import { getSupabaseAdminClient } from '@/lib/supabase-server'

const WEBHOOK_URL = 'https://n8n.intelektus.tech/webhook/notificacao';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export type NotificationType = 'new_process' | 'new_responsible' | 'deadline_warning';

export class NotificationService {
  private static getSupabase() {
    return getSupabaseAdminClient()
  }

  static async createNotification(
    type: NotificationType,
    data: any,
    moduleType: string,
    recordId: number,
    message: string
  ) {
    const supabase = this.getSupabase();

    // 1. Save to Alerts table
    // IMPORTANT: We must handle cases where schema might be outdated (missing 'data', 'status', etc.)
    // We try to insert with full fields first. If it fails, we fall back to basic fields.
    
    let alert;
    
    try {
      const { data: inserted, error } = await supabase
        .from('alerts')
        .insert({
          module_type: moduleType,
          record_id: recordId,
          alert_for: type,
          message: message,
          data: JSON.stringify(data),
          status: 'pending',
          retry_count: 0,
          is_read: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      alert = inserted;
    } catch (insertError) {
      console.warn('Full insert failed, trying fallback (legacy schema)...', insertError);
      
      // Fallback: Insert without new columns
      const { data: fallbackInserted, error: fallbackError } = await supabase
        .from('alerts')
        .insert({
          module_type: moduleType,
          record_id: recordId,
          alert_for: type,
          message: message,
          is_read: false,
          created_at: new Date().toISOString()
        })
        .select()
        .single();
        
      if (fallbackError) {
        console.error('CRITICAL: Failed to save notification even with fallback:', fallbackError);
        // Even if DB fails, we should TRY to send the webhook if it's critical
      } else {
        alert = fallbackInserted;
      }
    }

    // 2. Trigger Webhook
    // We proceed even if alert wasn't saved (alert.id might be undefined)
    const alertId = alert?.id || 0; 
    
    try {
      console.log(`[Notification] Attempting webhook for ${type} (ID: ${alertId})`);
      await this.sendWebhook(alertId, type, data);
    } catch (err) {
      console.error(`[Notification] Webhook failed for ${type}:`, err);
    }

    return alert;
  }

  static async sendWebhook(alertId: number, type: NotificationType, data: any) {
    const supabase = this.getSupabase();
    
    try {
      const payload = this.formatPayload(type, data);
      
      console.log(`Sending webhook for alert ${alertId}`, payload);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Webhook failed: ${response.status} ${response.statusText}`);
      }

      console.log(`Webhook sent successfully for alert ${alertId}`);

      // Success: Update status
      await supabase
        .from('alerts')
        .update({ status: 'sent', updated_at: new Date().toISOString() })
        .eq('id', alertId);

      return true;
    } catch (error) {
      console.error(`Webhook error for alert ${alertId}:`, error);
      
      // Update retry count
      const { data: current } = await supabase
        .from('alerts')
        .select('retry_count')
        .eq('id', alertId)
        .single();
        
      const newCount = (current?.retry_count || 0) + 1;
      const newStatus = newCount >= 5 ? 'failed' : 'pending';
      
      await supabase
        .from('alerts')
        .update({ 
          retry_count: newCount, 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', alertId);
        
      throw error;
    }
  }

  static async processRetryQueue() {
    const supabase = this.getSupabase();
    
    // Find pending notifications that haven't been updated in the last 1 minute (to avoid race conditions with immediate send)
    // Or just pick pending ones.
    const { data: pendingAlerts, error } = await supabase
      .from('alerts')
      .select('*')
      .eq('status', 'pending')
      .lt('retry_count', 5)
      .limit(50); // Process in batches

    if (error || !pendingAlerts) return;

    for (const alert of pendingAlerts) {
      try {
        const data = alert.data ? JSON.parse(alert.data) : {};
        await this.sendWebhook(alert.id, alert.alert_for as NotificationType, data);
      } catch (e) {
        // Already handled in sendWebhook
      }
    }
  }

  private static formatPayload(type: NotificationType, data: any) {
    // Format based on type as requested
    switch (type) {
      case 'new_process':
        return {
          type: 'new_process',
          data: {
             ...data,
             url: `${APP_URL}/dashboard/${data.moduleSlug}/${data.id}`
          }
        };
      case 'new_responsible':
        return {
          type: 'new_responsible',
          data: {
            responsibleName: data.responsibleName,
            clientName: data.clientName,
            workflowName: data.workflowName,
            dueDate: data.dueDate,
            url: `${APP_URL}/dashboard/${data.moduleSlug}/${data.recordId}`
          }
        };
      case 'deadline_warning':
        return {
          type: 'deadline_warning',
          data: {
            processName: data.processName,
            daysRemaining: data.daysRemaining,
            dueDate: data.dueDate,
            url: `${APP_URL}/dashboard/${data.moduleSlug}/${data.recordId}`
          }
        };
      default:
        return { type, data };
    }
  }
}
