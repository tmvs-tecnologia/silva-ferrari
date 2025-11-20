import { NextRequest, NextResponse } from 'next/server';
// @ts-ignore - Supabase types will be resolved in production
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
    currentStep: record.current_step ?? 0,
  };
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Single record fetch
    if (id) {
      if (isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const { data: record, error } = await supabase
        .from('perda_nacionalidade')
        .select('*')
        .eq('id', parseInt(id))
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return NextResponse.json(
            { error: 'Record not found', code: 'NOT_FOUND' },
            { status: 404 }
          );
        }
        throw error;
      }

      return NextResponse.json(mapDbFieldsToFrontend(record), { status: 200 });
    }

    // List with pagination, search, and filtering
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');
    const statusFilter = searchParams.get('status');

    let query = supabase
      .from('perda_nacionalidade')
      .select('*');

    // Apply filters
    if (search) {
      query = query.ilike('client_name', `%${search}%`);
    }

    if (statusFilter) {
      const normalized = statusFilter === 'Em andamento' ? ['Em andamento', 'Em Andamento'] : [statusFilter];
      query = query.in('status', normalized);
    }

    const { data: results, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    // Map database fields to frontend format
    const mappedResults = (results || []).map(mapDbFieldsToFrontend);

    return NextResponse.json(mappedResults, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const body = await request.json();

    // Validate required fields
    if (!body.clientName || body.clientName.trim() === '') {
      return NextResponse.json(
        { error: 'Client name is required', code: 'MISSING_CLIENT_NAME' },
        { status: 400 }
      );
    }

    // Prepare data for Supabase (map camelCase to snake_case)
    const insertData = {
      client_name: body.clientName.trim(),
      rnm_mae: body.rnmMae?.trim() || null,
      rnm_mae_doc: body.rnmMaeDoc?.trim() || null,
      rnm_pai: body.rnmPai?.trim() || null,
      rnm_pai_doc: body.rnmPaiDoc?.trim() || null,
      cpf_mae: body.cpfMae?.trim() || null,
      cpf_pai: body.cpfPai?.trim() || null,
      certidao_nascimento: body.certidaoNascimento?.trim() || null,
      certidao_nascimento_doc: body.certidaoNascimentoDoc?.trim() || null,
      comprovante_endereco: body.comprovanteEndereco?.trim() || null,
      comprovante_endereco_doc: body.comprovanteEnderecoDoc?.trim() || null,
      passaportes: body.passaportes?.trim() || null,
      passaportes_doc: body.passaportesDoc?.trim() || null,
      documento_chines: body.documentoChines?.trim() || null,
      documento_chines_doc: body.documentoChinesDoc?.trim() || null,
      traducao_juramentada: body.traducaoJuramentada?.trim() || null,
      traducao_juramentada_doc: body.traducaoJuramentadaDoc?.trim() || null,
      procuracao_doc: body.procuracaoDoc?.trim() || null,
      pedido_perda_doc: body.pedidoPerdaDoc?.trim() || null,
      protocolo_doc: body.protocoloDoc?.trim() || null,
      dou_doc: body.douDoc?.trim() || null,
      passaporte_chines_doc: body.passaporteChinesDoc?.trim() || null,
      manifesto_doc: body.manifestoDoc?.trim() || null,
      portaria_doc: body.portariaDoc?.trim() || null,
      current_step: body.currentStep ?? 0,
      status: body.status?.trim() || 'Em Andamento',
      notes: body.notes?.trim() || null,
    };

    const { data: newRecord, error } = await supabase
      .from('perda_nacionalidade')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(newRecord, { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if record exists
    const { data: existing, error: existError } = await supabase
      .from('perda_nacionalidade')
      .select('id')
      .eq('id', parseInt(id))
      .single();

    if (existError) {
      if (existError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Record not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }
      throw existError;
    }

    const body = await request.json();

    // Prepare update data (only include provided fields, map camelCase to snake_case)
    const updateData: Record<string, any> = {};

    if (body.clientName !== undefined) {
      if (body.clientName.trim() === '') {
        return NextResponse.json(
          { error: 'Client name cannot be empty', code: 'INVALID_CLIENT_NAME' },
          { status: 400 }
        );
      }
      updateData.client_name = body.clientName.trim();
    }

    if (body.rnmMae !== undefined) updateData.rnm_mae = body.rnmMae?.trim() || null;
    if (body.rnmMaeDoc !== undefined) updateData.rnm_mae_doc = body.rnmMaeDoc?.trim() || null;
    if (body.rnmPai !== undefined) updateData.rnm_pai = body.rnmPai?.trim() || null;
    if (body.rnmPaiDoc !== undefined) updateData.rnm_pai_doc = body.rnmPaiDoc?.trim() || null;
    if (body.cpfMae !== undefined) updateData.cpf_mae = body.cpfMae?.trim() || null;
    if (body.cpfPai !== undefined) updateData.cpf_pai = body.cpfPai?.trim() || null;
    if (body.certidaoNascimento !== undefined) updateData.certidao_nascimento = body.certidaoNascimento?.trim() || null;
    if (body.certidaoNascimentoDoc !== undefined) updateData.certidao_nascimento_doc = body.certidaoNascimentoDoc?.trim() || null;
    if (body.comprovanteEndereco !== undefined) updateData.comprovante_endereco = body.comprovanteEndereco?.trim() || null;
    if (body.comprovanteEnderecoDoc !== undefined) updateData.comprovante_endereco_doc = body.comprovanteEnderecoDoc?.trim() || null;
    if (body.passaportes !== undefined) updateData.passaportes = body.passaportes?.trim() || null;
    if (body.passaportesDoc !== undefined) updateData.passaportes_doc = body.passaportesDoc?.trim() || null;
    if (body.documentoChines !== undefined) updateData.documento_chines = body.documentoChines?.trim() || null;
    if (body.documentoChinesDoc !== undefined) updateData.documento_chines_doc = body.documentoChinesDoc?.trim() || null;
    if (body.traducaoJuramentada !== undefined) updateData.traducao_juramentada = body.traducaoJuramentada?.trim() || null;
    if (body.traducaoJuramentadaDoc !== undefined) updateData.traducao_juramentada_doc = body.traducaoJuramentadaDoc?.trim() || null;
    if (body.procuracaoDoc !== undefined) updateData.procuracao_doc = body.procuracaoDoc?.trim() || null;
    if (body.pedidoPerdaDoc !== undefined) updateData.pedido_perda_doc = body.pedidoPerdaDoc?.trim() || null;
    if (body.protocoloDoc !== undefined) updateData.protocolo_doc = body.protocoloDoc?.trim() || null;
    if (body.douDoc !== undefined) updateData.dou_doc = body.douDoc?.trim() || null;
    if (body.passaporteChinesDoc !== undefined) updateData.passaporte_chines_doc = body.passaporteChinesDoc?.trim() || null;
    if (body.manifestoDoc !== undefined) updateData.manifesto_doc = body.manifestoDoc?.trim() || null;
    if (body.portariaDoc !== undefined) updateData.portaria_doc = body.portariaDoc?.trim() || null;
    if (body.currentStep !== undefined) updateData.current_step = body.currentStep;
    if (body.status !== undefined) updateData.status = body.status.trim();
    if (body.notes !== undefined) updateData.notes = body.notes?.trim() || null;

    const { data: updated, error } = await supabase
      .from('perda_nacionalidade')
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
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if record exists and get it before deletion
    const { data: existing, error: existError } = await supabase
      .from('perda_nacionalidade')
      .select('*')
      .eq('id', parseInt(id))
      .single();

    if (existError) {
      if (existError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Record not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }
      throw existError;
    }

    const { error } = await supabase
      .from('perda_nacionalidade')
      .delete()
      .eq('id', parseInt(id));

    if (error) {
      throw error;
    }

    return NextResponse.json(
      {
        message: 'Record deleted successfully',
        record: existing,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}