import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function PATCH(
  request: NextRequest,
  context: any
) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { id } = await context.params;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const body = await request.json();
    const { isRead, message } = body;

    // Build update object with only provided fields
    const updateData: any = {};

    if (isRead !== undefined) {
      updateData.is_read = isRead;
    }

    if (message !== undefined && message.trim() !== '') {
      updateData.message = message.trim();
    }

    // Update alert
    const { error } = await supabase
      .from('alerts')
      .update(updateData)
      .eq('id', parseInt(id));

    if (error) {
      throw error;
    }

    return NextResponse.json({ 
      message: 'Alert updated successfully',
      id: parseInt(id),
      ...updateData
    }, { status: 200 });
  } catch (error) {
    console.error('PATCH error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ 
      error: 'Internal server error: ' + errorMessage 
    }, { status: 500 });
  }
}
