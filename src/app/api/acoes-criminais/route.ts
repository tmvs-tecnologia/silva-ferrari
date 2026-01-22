import { NextRequest, NextResponse } from 'next/server';
import { NotificationService } from '@/lib/notification';
import { getSupabaseAdminClient } from '@/lib/supabase-server';

// Helper function to convert snake_case to camelCase
function mapDbFieldsToFrontend(record: any) {
  if (!record) return record;
  
  return {
    id: record.id,
    clientName: record.client_name,
    type: record.type || 'Ação Criminal',
    currentStep: record.current_step ?? 0,
    status: record.status,
    notes: record.notes,
    autorName: record.autor_name || null,
    reuName: record.reu_name || null,
    numeroProcesso: record.numero_processo || null,
    responsavelName: record.responsavel_name || null,
    responsavelDate: record.responsavel_date || null,
    resumo: record.resumo || null,
    acompanhamento: record.acompanhamento || null,
    contratado: record.contratado || null,
    fotoNotificacaoDoc: record.foto_notificacao_doc || null,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

export async function GET(request: NextRequest) {
  try {
    // Initialize Supabase client
    const supabase = getSupabaseAdminClient();

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
        .from('acoes_criminais')
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
      .from('acoes_criminais')
      .select('*');

    // Apply filters
    if (search) {
      const s = search.replace(/,/g, ' ');
      query = query.or(
        [
          `client_name.ilike.%${s}%`,
          `notes.ilike.%${s}%`,
          `status.ilike.%${s}%`,
        ].join(',')
      );
    }

    if (status) {
      const normalized = status === 'Em andamento' ? ['Em andamento', 'Em Andamento'] : [status];
      query = query.in('status', normalized);
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
    const supabase = getSupabaseAdminClient();

    const body = await request.json();
    const { 
      clientName, 
      status, 
      notes, 
      currentStep,
      reuName,
      autorName,
      numeroProcesso,
      responsavelName,
      responsavelDate,
      resumo,
      acompanhamento,
      contratado
    } = body;

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
      status: status || 'Em andamento',
    };

    if (notes !== undefined) insertData.notes = notes;
    if (reuName !== undefined) insertData.reu_name = reuName;
    if (autorName !== undefined) insertData.autor_name = autorName;
    if (numeroProcesso !== undefined) insertData.numero_processo = numeroProcesso;
    if (responsavelName !== undefined) insertData.responsavel_name = responsavelName;
    if (responsavelDate !== undefined) insertData.responsavel_date = responsavelDate;
    if (resumo !== undefined) insertData.resumo = resumo;
    if (acompanhamento !== undefined) insertData.acompanhamento = acompanhamento;
    if (contratado !== undefined) insertData.contratado = contratado;

    const { data: newRecord, error } = await supabase
      .from('acoes_criminais')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ 
        error: 'Internal server error: ' + error.message 
      }, { status: 500 });
    }

    // 2. Trigger notification with error handling
    try {
      await NotificationService.createNotification(
        'new_process',
        {
          moduleSlug: 'acoes-criminais',
          id: newRecord.id,
          ...mapDbFieldsToFrontend(newRecord)
        },
        'acoes_criminais',
        newRecord.id,
        `Nova ação criminal criada: ${clientName.trim()}`
      );
    } catch (e) {
      // Log notification error but don't fail the request
      console.error('Failed to create notification for new criminal action:', e);
    }

    return NextResponse.json(mapDbFieldsToFrontend(newRecord), { status: 201 });

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
    const supabase = getSupabaseAdminClient();

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
    const { 
      clientName, 
      status, 
      notes, 
      currentStep,
      reuName,
      autorName,
      numeroProcesso,
      responsavelName,
      responsavelDate,
      resumo,
      acompanhamento,
      contratado
    } = body;

    // Check if record exists
    const { data: existing, error: existingError } = await supabase
      .from('acoes_criminais')
      .select('id, current_step, client_name, responsavel_name')
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

    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (reuName !== undefined) updateData.reu_name = reuName;
    if (autorName !== undefined) updateData.autor_name = autorName;
    if (numeroProcesso !== undefined) updateData.numero_processo = numeroProcesso;
    if (responsavelName !== undefined) updateData.responsavel_name = responsavelName;
    if (responsavelDate !== undefined) updateData.responsavel_date = responsavelDate;
    if (resumo !== undefined) updateData.resumo = resumo;
    if (acompanhamento !== undefined) updateData.acompanhamento = acompanhamento;
    if (contratado !== undefined) updateData.contratado = contratado;
    if (currentStep !== undefined) updateData.current_step = currentStep;

    // Perform update
    const { data: updated, error } = await supabase
      .from('acoes_criminais')
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

    // Notification for responsible change
    if (responsavelName && responsavelName !== existing.responsavel_name) {
      try {
        await NotificationService.createNotification(
          'new_responsible',
          {
            responsibleName,
            clientName: existing.client_name,
            workflowName: 'Ação Criminal',
            dueDate: responsavelDate || null,
            moduleSlug: 'acoes-criminais',
            recordId: parseInt(id)
          },
          'acoes_criminais',
          parseInt(id),
          `Novo responsável atribuído: ${responsavelName} para o caso de ${existing.client_name}`
        );
      } catch (e) {
        console.error('Failed to notify responsible change:', e);
      }
    }

    if (currentStep !== undefined && typeof existing?.current_step === 'number' && currentStep > existing.current_step) {
      try {
        await supabase
          .from('alerts')
          .insert({
            module_type: 'acoes_criminais',
            record_id: parseInt(id),
            alert_for: 'admin',
            message: `Passo ${currentStep} concluído para: ${existing.client_name}`,
            is_read: false,
            created_at: new Date().toISOString()
          });
      } catch {}
    }

    return NextResponse.json(mapDbFieldsToFrontend(updated), { status: 200 });

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
    const supabase = getSupabaseAdminClient();

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
      .from('acoes_criminais')
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
