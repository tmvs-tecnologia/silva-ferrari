import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const alertFor = searchParams.get('alertFor');
    const moduleType = searchParams.get('moduleType');
    const isReadParam = searchParams.get('isRead');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    // Single alert by ID
    if (id) {
      if (isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const { data: alert, error } = await supabase
        .from('alerts')
        .select('*')
        .eq('id', parseInt(id))
        .single();

      if (error || !alert) {
        return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
      }

      return NextResponse.json(alert, { status: 200 });
    }

    // List alerts with filtering
    let query = supabase.from('alerts').select('*');

    if (alertFor) {
      query = query.eq('alert_for', alertFor);
    }

    if (moduleType) {
      query = query.eq('module_type', moduleType);
    }

    if (isReadParam !== null) {
      const isReadValue = isReadParam === 'true';
      query = query.eq('is_read', isReadValue);
    }

    const { data: results, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    return NextResponse.json(results || [], { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error.message 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const body = await request.json();
    const { moduleType, recordId, alertFor, message, isRead } = body;

    // Validate required fields
    if (!moduleType || moduleType.trim() === '') {
      return NextResponse.json({ 
        error: "moduleType is required",
        code: "MISSING_MODULE_TYPE" 
      }, { status: 400 });
    }

    if (!recordId) {
      return NextResponse.json({ 
        error: "recordId is required",
        code: "MISSING_RECORD_ID" 
      }, { status: 400 });
    }

    if (isNaN(parseInt(recordId.toString()))) {
      return NextResponse.json({ 
        error: "recordId must be a valid integer",
        code: "INVALID_RECORD_ID" 
      }, { status: 400 });
    }

    if (!alertFor || alertFor.trim() === '') {
      return NextResponse.json({ 
        error: "alertFor is required",
        code: "MISSING_ALERT_FOR" 
      }, { status: 400 });
    }

    if (!message || message.trim() === '') {
      return NextResponse.json({ 
        error: "message is required",
        code: "MISSING_MESSAGE" 
      }, { status: 400 });
    }

    // Create new alert
    const { data: newAlert, error } = await supabase
      .from('alerts')
      .insert({
        module_type: moduleType.trim(),
        record_id: parseInt(recordId.toString()),
        alert_for: alertFor.trim(),
        message: message.trim(),
        is_read: isRead ?? false,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(newAlert, { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error.message 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const body = await request.json();
    const { isRead, message } = body;

    // Check if alert exists
    const { data: existingAlert, error: checkError } = await supabase
      .from('alerts')
      .select('*')
      .eq('id', parseInt(id))
      .single();

    if (checkError || !existingAlert) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
    }

    // Build update object with only provided fields
    const updateData: any = {};

    if (isRead !== undefined) {
      updateData.is_read = isRead;
    }

    if (message !== undefined && message.trim() !== '') {
      updateData.message = message.trim();
    }

    // Update alert
    const { data: updated, error } = await supabase
      .from('alerts')
      .update(updateData)
      .eq('id', parseInt(id))
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error.message 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    // Check if alert exists
    const { data: existingAlert, error: checkError } = await supabase
      .from('alerts')
      .select('*')
      .eq('id', parseInt(id))
      .single();

    if (checkError || !existingAlert) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
    }

    // Delete alert
    const { data: deleted, error } = await supabase
      .from('alerts')
      .delete()
      .eq('id', parseInt(id))
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ 
      message: 'Alert deleted successfully',
      alert: deleted
    }, { status: 200 });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error.message 
    }, { status: 500 });
  }
}