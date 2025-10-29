import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Helper function to convert snake_case to camelCase
function mapDbFieldsToFrontend(record: any) {
  if (!record) return record;
  
  return {
    id: record.id,
    clientName: record.client_name,
    status: record.status,
    notes: record.notes,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

export async function GET(request: NextRequest) {
  try {
    // Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Single record by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const { data: record, error } = await supabase
        .from('acoes_trabalhistas')
        .select('*')
        .eq('id', parseInt(id))
        .single();

      if (error || !record) {
        return NextResponse.json({ 
          error: 'Record not found',
          code: 'NOT_FOUND' 
        }, { status: 404 });
      }

      return NextResponse.json(record, { status: 200 });
    }

    // List with pagination, search, and filters
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');
    const status = searchParams.get('status');

    let query = supabase
      .from('acoes_trabalhistas')
      .select('*');

    // Apply filters
    if (search) {
      query = query.ilike('client_name', `%${search}%`);
    }

    if (status) {
      query = query.eq('status', status);
    }

    // Apply ordering, limit and offset
    const { data: results, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ 
        error: 'Internal server error: ' + error.message 
      }, { status: 500 });
    }

    // Map database fields to frontend format
    const mappedResults = (results || []).map(mapDbFieldsToFrontend);

    return NextResponse.json(mappedResults, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const body = await request.json();
    const { clientName, status, notes } = body;

    // Validate required fields
    if (!clientName || clientName.trim() === '') {
      return NextResponse.json({ 
        error: "Client name is required and cannot be empty",
        code: "MISSING_REQUIRED_FIELD" 
      }, { status: 400 });
    }

    // Prepare insert data
    const insertData: any = {
      client_name: clientName.trim(),
      status: status || 'Em Andamento',
    };

    if (notes !== undefined) {
      insertData.notes = notes;
    }

    const { data: newRecord, error } = await supabase
      .from('acoes_trabalhistas')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ 
        error: 'Internal server error: ' + error.message 
      }, { status: 500 });
    }

    return NextResponse.json(newRecord, { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const body = await request.json();
    const { clientName, status, notes } = body;

    // Check if record exists
    const { data: existing, error: existingError } = await supabase
      .from('acoes_trabalhistas')
      .select('id')
      .eq('id', parseInt(id))
      .single();

    if (existingError || !existing) {
      return NextResponse.json({ 
        error: 'Record not found',
        code: 'NOT_FOUND' 
      }, { status: 404 });
    }

    // Prepare update data
    const updateData: any = {};

    if (clientName !== undefined) {
      if (clientName.trim() === '') {
        return NextResponse.json({ 
          error: "Client name cannot be empty",
          code: "INVALID_CLIENT_NAME" 
        }, { status: 400 });
      }
      updateData.client_name = clientName.trim();
    }

    if (status !== undefined) {
      updateData.status = status;
    }

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    // Perform update
    const { data: updated, error } = await supabase
      .from('acoes_trabalhistas')
      .update(updateData)
      .eq('id', parseInt(id))
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ 
        error: 'Internal server error: ' + error.message 
      }, { status: 500 });
    }

    return NextResponse.json(updated, { status: 200 });

  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    // Check if record exists and delete it
    const { data: deleted, error } = await supabase
      .from('acoes_trabalhistas')
      .delete()
      .eq('id', parseInt(id))
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ 
          error: 'Record not found',
          code: 'NOT_FOUND'
        }, { status: 404 });
      }
      console.error('Supabase error:', error);
      return NextResponse.json({ 
        error: 'Internal server error: ' + error.message 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Record deleted successfully',
      record: deleted
    }, { status: 200 });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}