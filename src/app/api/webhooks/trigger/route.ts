import { NextRequest, NextResponse } from 'next/server';
import { NotificationService } from '@/lib/notification';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { notification } = body;

    if (!notification) {
      return NextResponse.json({ error: 'Notification data is required' }, { status: 400 });
    }

    // Reuse the existing NotificationService logic to send the webhook
    // We use a specific type or generic one depending on what's available
    // Here we'll treat it as a re-send or manual trigger
    await NotificationService.sendWebhook(
      notification.id,
      notification.alertFor || 'manual_trigger',
      notification
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error triggering webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
