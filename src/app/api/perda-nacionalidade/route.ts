import { NextRequest, NextResponse } from 'next/server';
// @ts-ignore - Supabase types will be resolved in production
import { createClient } from '@supabase/supabase-js';
import { NotificationService } from '@/lib/notification';

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
    stepData: (record as any).step_data || {},
    stepNotes: (record as any).step_notes || {},
    nomeMae: record.nome_mae,
    nomePai: record.nome_pai,
    nomeCrianca: record.nome_crianca,
    rnmMae: record.rnm_mae,
    rnmMaeDoc: record.rnm_mae_doc,
    rnmPai: record.rnm_pai,
    rnmPaiDoc: record.rnm_pai_doc,
    cpfMae: record.cpf_mae,
    cpfMaeDoc: record.cpf_mae_doc,
    cpfPai: record.cpf_pai,
    cpfPaiDoc: record.cpf_pai_doc,
    certidaoNascimento: record.certidao_nascimento,
    certidaoNascimentoDoc: record.certidao_nascimento_doc,
    comprovanteEndereco: record.comprovante_endereco,
    comprovanteEnderecoDoc: record.comprovante_endereco_doc,
    passaporteMae: record.passaporte_mae,
    passaporteMaeDoc: record.passaporte_mae_doc,
    passaportePai: record.passaporte_pai,
    passaportePaiDoc: record.passaporte_pai_doc,
    passaporteCrianca: record.passaporte_crianca,
    passaporteCriancaDoc: record.passaporte_crianca_doc,
    rgCrianca: record.rg_crianca,
    rgCriancaDoc: record.rg_crianca_doc,
    documentoChines: record.documento_chines,
    documentoChinesDoc: record.documento_chines_doc,
    traducaoJuramentada: record.traducao_juramentada,
    traducaoJuramentadaDoc: record.traducao_juramentada_doc,
  };
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function truncateString(value: string | undefined | null, max: number): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (trimmed.length <= max) return trimmed;
  return trimmed.slice(0, max);
}

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
      const s = search.replace(/,/g, ' ');
      query = query.or(
        [
          `client_name.ilike.%${s}%`,
          `nome_mae.ilike.%${s}%`,
          `nome_pai.ilike.%${s}%`,
          `nome_crianca.ilike.%${s}%`,
          `rnm_mae.ilike.%${s}%`,
          `rnm_pai.ilike.%${s}%`,
          `cpf_mae.ilike.%${s}%`,
          `cpf_pai.ilike.%${s}%`,
          `certidao_nascimento.ilike.%${s}%`,
          `comprovante_endereco.ilike.%${s}%`,
          `documento_chines.ilike.%${s}%`,
          `traducao_juramentada.ilike.%${s}%`,
          `notes.ilike.%${s}%`,
        ].join(',')
      );
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
      client_name: truncateString(body.clientName, 500)!,
      nome_mae: truncateString(body.nomeMae, 255),
      nome_pai: body.nomePai?.trim() || null,
      nome_crianca: body.nomeCrianca?.trim() || null,
      rnm_mae: truncateString(body.rnmMae, 255),
      rnm_mae_doc: truncateString(body.rnmMaeDoc, 500),
      rnm_pai: truncateString(body.rnmPai, 255),
      rnm_pai_doc: truncateString(body.rnmPaiDoc, 500),
      cpf_mae: truncateString(body.cpfMae, 20),
      cpf_pai: truncateString(body.cpfPai, 20),
      cpf_mae_doc: truncateString(body.cpfMaeDoc, 500),
      cpf_pai_doc: truncateString(body.cpfPaiDoc, 500),
      certidao_nascimento: body.certidaoNascimento?.trim() || null,
      certidao_nascimento_doc: truncateString(body.certidaoNascimentoDoc, 500),
      comprovante_endereco: body.comprovanteEndereco?.trim() || null,
      comprovante_endereco_doc: truncateString(body.comprovanteEnderecoDoc, 500),
      passaporte_mae: truncateString(body.passaporteMae, 255),
      passaporte_mae_doc: truncateString(body.passaporteMaeDoc, 500),
      passaporte_pai: truncateString(body.passaportePai, 255),
      passaporte_pai_doc: truncateString(body.passaportePaiDoc, 500),
      passaporte_crianca: truncateString(body.passaporteCrianca, 255),
      passaporte_crianca_doc: truncateString(body.passaporteCriancaDoc, 500),
      rg_crianca: truncateString(body.rgCrianca, 50),
      rg_crianca_doc: truncateString(body.rgCriancaDoc, 500),
      documento_chines: body.documentoChines?.trim() || null,
      documento_chines_doc: truncateString(body.documentoChinesDoc, 500),
      traducao_juramentada: body.traducaoJuramentada?.trim() || null,
      traducao_juramentada_doc: truncateString(body.traducaoJuramentadaDoc, 500),
      procuracao_doc: truncateString(body.procuracaoDoc, 500),
      pedido_perda_doc: truncateString(body.pedidoPerdaDoc, 500),
      protocolo_doc: truncateString(body.protocoloDoc, 500),
      dou_doc: truncateString(body.douDoc, 500),
      passaporte_chines_doc: truncateString(body.passaporteChinesDoc, 500),
      manifesto_doc: truncateString(body.manifestoDoc, 500),
      portaria_doc: truncateString(body.portariaDoc, 500),
      current_step: body.currentStep ?? 0,
      status: truncateString(body.status, 50) || 'Em Andamento',
      notes: body.notes?.trim() || null,
      step_data: body.stepData ?? null,
      step_notes: body.stepNotes ?? null,
    };

    const { data: newRecord, error } = await supabase
      .from('perda_nacionalidade')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      throw error;
    }

    try {
      await NotificationService.createNotification(
        'new_process',
        {
          moduleSlug: 'perda-nacionalidade',
          id: newRecord.id,
          ...mapDbFieldsToFrontend(newRecord)
        },
        'perda_nacionalidade',
        newRecord.id,
        `Novo processo de perda de nacionalidade criado: ${body.clientName.trim()}`
      );
    } catch (e) {
      console.error('Failed to create notification:', e);
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
      updateData.client_name = truncateString(body.clientName, 500);
    }

    if (body.rnmMae !== undefined) updateData.rnm_mae = truncateString(body.rnmMae, 255);
    if (body.rnmMaeDoc !== undefined) updateData.rnm_mae_doc = truncateString(body.rnmMaeDoc, 500);
    if (body.rnmPai !== undefined) updateData.rnm_pai = truncateString(body.rnmPai, 255);
    if (body.rnmPaiDoc !== undefined) updateData.rnm_pai_doc = truncateString(body.rnmPaiDoc, 500);
    if (body.cpfMae !== undefined) updateData.cpf_mae = truncateString(body.cpfMae, 20);
    if (body.cpfPai !== undefined) updateData.cpf_pai = truncateString(body.cpfPai, 20);
    if (body.cpfMaeDoc !== undefined) updateData.cpf_mae_doc = truncateString(body.cpfMaeDoc, 500);
    if (body.cpfPaiDoc !== undefined) updateData.cpf_pai_doc = truncateString(body.cpfPaiDoc, 500);
    if (body.nomeMae !== undefined) updateData.nome_mae = truncateString(body.nomeMae, 255);
    if (body.nomePai !== undefined) updateData.nome_pai = body.nomePai?.trim() || null;
    if (body.nomeCrianca !== undefined) updateData.nome_crianca = body.nomeCrianca?.trim() || null;
    if (body.certidaoNascimento !== undefined) updateData.certidao_nascimento = body.certidaoNascimento?.trim() || null;
    if (body.certidaoNascimentoDoc !== undefined) updateData.certidao_nascimento_doc = truncateString(body.certidaoNascimentoDoc, 500);
    if (body.comprovanteEndereco !== undefined) updateData.comprovante_endereco = body.comprovanteEndereco?.trim() || null;
    if (body.comprovanteEnderecoDoc !== undefined) updateData.comprovante_endereco_doc = truncateString(body.comprovanteEnderecoDoc, 500);
    if (body.passaporteMae !== undefined) updateData.passaporte_mae = truncateString(body.passaporteMae, 255);
    if (body.passaporteMaeDoc !== undefined) updateData.passaporte_mae_doc = truncateString(body.passaporteMaeDoc, 500);
    if (body.passaportePai !== undefined) updateData.passaporte_pai = truncateString(body.passaportePai, 255);
    if (body.passaportePaiDoc !== undefined) updateData.passaporte_pai_doc = truncateString(body.passaportePaiDoc, 500);
    if (body.passaporteCrianca !== undefined) updateData.passaporte_crianca = truncateString(body.passaporteCrianca, 255);
    if (body.passaporteCriancaDoc !== undefined) updateData.passaporte_crianca_doc = truncateString(body.passaporteCriancaDoc, 500);
    if (body.rgCrianca !== undefined) updateData.rg_crianca = truncateString(body.rgCrianca, 50);
    if (body.rgCriancaDoc !== undefined) updateData.rg_crianca_doc = truncateString(body.rgCriancaDoc, 500);
    if (body.documentoChines !== undefined) updateData.documento_chines = body.documentoChines?.trim() || null;
    if (body.documentoChinesDoc !== undefined) updateData.documento_chines_doc = truncateString(body.documentoChinesDoc, 500);
    if (body.traducaoJuramentada !== undefined) updateData.traducao_juramentada = body.traducaoJuramentada?.trim() || null;
    if (body.traducaoJuramentadaDoc !== undefined) updateData.traducao_juramentada_doc = truncateString(body.traducaoJuramentadaDoc, 500);
    if (body.procuracaoDoc !== undefined) updateData.procuracao_doc = truncateString(body.procuracaoDoc, 500);
    if (body.pedidoPerdaDoc !== undefined) updateData.pedido_perda_doc = truncateString(body.pedidoPerdaDoc, 500);
    if (body.protocoloDoc !== undefined) updateData.protocolo_doc = truncateString(body.protocoloDoc, 500);
    if (body.douDoc !== undefined) updateData.dou_doc = truncateString(body.douDoc, 500);
    if (body.passaporteChinesDoc !== undefined) updateData.passaporte_chines_doc = truncateString(body.passaporteChinesDoc, 500);
    if (body.manifestoDoc !== undefined) updateData.manifesto_doc = truncateString(body.manifestoDoc, 500);
    if (body.portariaDoc !== undefined) updateData.portaria_doc = truncateString(body.portariaDoc, 500);
    if (body.currentStep !== undefined) updateData.current_step = body.currentStep;
    if (body.status !== undefined) updateData.status = truncateString(body.status, 50) || null;
    if (body.notes !== undefined) updateData.notes = body.notes?.trim() || null;
    if (body.stepData !== undefined) updateData.step_data = body.stepData;
    if (body.stepNotes !== undefined) updateData.step_notes = body.stepNotes;

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
