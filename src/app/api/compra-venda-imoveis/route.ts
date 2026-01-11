import { NextRequest, NextResponse } from 'next/server';
// @ts-ignore - Supabase types will be resolved in production
import { createClient } from '@supabase/supabase-js';
import { NotificationService } from '@/lib/notification';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Normalize empty strings/undefined to null for database compatibility
const toNullIfEmpty = (v: any) => (v === '' || v === undefined ? null : v);

// Helper function to map database fields to frontend format
function mapDbFieldsToFrontend(record: any) {
  if (!record) return record;
  
  return {
    id: record.id,
    tipoTransacao: record.tipo_transacao,
    clientName: record.client_name,
    numeroMatricula: record.numero_matricula,
    numeroMatriculaDoc: record.numero_matricula_doc,
    cadastroContribuinte: record.cadastro_contribuinte,
    cadastroContribuinteDoc: record.cadastro_contribuinte_doc,
    enderecoImovel: record.endereco_imovel,
    comprovanteEnderecoImovelDoc: record.comprovante_endereco_imovel_doc,
    rgVendedores: record.rg_vendedores,
    rgVendedoresDoc: record.rg_vendedores_doc,
    cpfVendedores: record.cpf_vendedores,
    cpfVendedoresDoc: record.cpf_vendedores_doc,
    dataNascimentoVendedores: record.data_nascimento_vendedores,
    rnmComprador: record.rnm_comprador,
    rnmCompradorDoc: record.rnm_comprador_doc,
    cpfComprador: record.cpf_comprador,
    cpfCompradorDoc: record.cpf_comprador_doc,
    enderecoComprador: record.endereco_comprador,
    currentStep: record.current_step,
    status: record.status,
    prazoSinal: record.prazo_sinal,
    prazoEscritura: record.prazo_escritura,
    contractNotes: record.contract_notes,
    stepNotes: record.step_notes,
    completedSteps: record.completed_steps,
    certidoesDoc: record.certidoes_doc,
    contratoDoc: record.contrato_doc,
    assinaturaContratoDoc: record.assinatura_contrato_doc,
    escrituraDoc: record.escritura_doc,
    matriculaCartorioDoc: record.matricula_cartorio_doc,
    createdAt: record.created_at,
    updatedAt: record.updated_at
  };
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Single record fetch by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const { data: record, error } = await supabase
        .from('compra_venda_imoveis')
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
    const status = searchParams.get('status');

    let query = supabase
      .from('compra_venda_imoveis')
      .select('*');

    // Apply filters
    if (search) {
      const s = search.replace(/,/g, ' ');
      query = query.or(
        [
          `client_name.ilike.%${s}%`,
          `numero_matricula.ilike.%${s}%`,
          `cadastro_contribuinte.ilike.%${s}%`,
          `endereco_imovel.ilike.%${s}%`,
          `rg_vendedores.ilike.%${s}%`,
          `cpf_vendedores.ilike.%${s}%`,
          `rnm_comprador.ilike.%${s}%`,
          `cpf_comprador.ilike.%${s}%`,
          `endereco_comprador.ilike.%${s}%`,
          `contract_notes.ilike.%${s}%`,
        ].join(',')
      );
    }

    if (status) {
      const normalized = status === 'Em andamento' ? ['Em andamento', 'Em Andamento'] : [status];
      query = query.in('status', normalized);
    }

    const { data: results, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    return NextResponse.json(results?.map(mapDbFieldsToFrontend) || [], { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const body = await request.json();

    const normalizeJson = (v: any) => {
      if (v === undefined || v === null || v === '') return null;
      if (typeof v === 'string') {
        try { return JSON.parse(v); } catch { return v; }
      }
      return v;
    };

    // Prepare data for Supabase (map camelCase to snake_case)
    const insertData = {
      tipo_transacao: toNullIfEmpty(body.tipoTransacao),
      client_name: toNullIfEmpty(body.clientName),
      numero_matricula: toNullIfEmpty(body.numeroMatricula),
      cadastro_contribuinte: toNullIfEmpty(body.cadastroContribuinte),
      endereco_imovel: toNullIfEmpty(body.enderecoImovel),
      rg_vendedores: toNullIfEmpty(body.rgVendedores),
      cpf_vendedores: toNullIfEmpty(body.cpfVendedores),
      data_nascimento_vendedores: toNullIfEmpty(body.dataNascimentoVendedores),
      rnm_comprador: toNullIfEmpty(body.rnmComprador),
      cpf_comprador: toNullIfEmpty(body.cpfComprador),
      endereco_comprador: toNullIfEmpty(body.enderecoComprador),
      current_step: body.currentStep ?? 0,
      status: body.status ?? 'Em Andamento',
      prazo_sinal: toNullIfEmpty(body.prazoSinal),
      prazo_escritura: toNullIfEmpty(body.prazoEscritura),
      contract_notes: toNullIfEmpty(body.contractNotes),
      step_notes: normalizeJson(body.stepNotes),
      completed_steps: normalizeJson(body.completedSteps),
    };

    const { data: newRecord, error } = await supabase
      .from('compra_venda_imoveis')
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
          moduleSlug: 'compra-venda',
          id: newRecord.id,
          ...mapDbFieldsToFrontend(newRecord)
        },
        'compra_venda_imoveis',
        newRecord.id,
        `Nova compra e venda criada: ${body.clientName?.trim() || '—'}`
      );
    } catch (e) {
      console.error('Failed to create notification:', e);
    }

    return NextResponse.json(newRecord, { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if record exists
    const { data: existing, error: existError } = await supabase
      .from('compra_venda_imoveis')
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

    if (body.tipoTransacao !== undefined) updateData.tipo_transacao = toNullIfEmpty(body.tipoTransacao);
    if (body.clientName !== undefined) updateData.client_name = toNullIfEmpty(body.clientName);
    if (body.numeroMatricula !== undefined) updateData.numero_matricula = toNullIfEmpty(body.numeroMatricula);
    if (body.cadastroContribuinte !== undefined) updateData.cadastro_contribuinte = toNullIfEmpty(body.cadastroContribuinte);
    if (body.enderecoImovel !== undefined) updateData.endereco_imovel = toNullIfEmpty(body.enderecoImovel);
    if (body.rgVendedores !== undefined) updateData.rg_vendedores = toNullIfEmpty(body.rgVendedores);
    if (body.cpfVendedores !== undefined) updateData.cpf_vendedores = toNullIfEmpty(body.cpfVendedores);
    if (body.dataNascimentoVendedores !== undefined) updateData.data_nascimento_vendedores = toNullIfEmpty(body.dataNascimentoVendedores);
    if (body.rnmComprador !== undefined) updateData.rnm_comprador = toNullIfEmpty(body.rnmComprador);
    if (body.cpfComprador !== undefined) updateData.cpf_comprador = toNullIfEmpty(body.cpfComprador);
    if (body.enderecoComprador !== undefined) updateData.endereco_comprador = toNullIfEmpty(body.enderecoComprador);
    if (body.currentStep !== undefined) updateData.current_step = body.currentStep;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.prazoSinal !== undefined) updateData.prazo_sinal = toNullIfEmpty(body.prazoSinal);
    if (body.prazoEscritura !== undefined) updateData.prazo_escritura = toNullIfEmpty(body.prazoEscritura);
    if (body.contractNotes !== undefined) updateData.contract_notes = toNullIfEmpty(body.contractNotes);
    if (body.stepNotes !== undefined) updateData.step_notes = toNullIfEmpty(body.stepNotes);
    if (body.completedSteps !== undefined) updateData.completed_steps = toNullIfEmpty(body.completedSteps);

    const { data: updated, error } = await supabase
      .from('compra_venda_imoveis')
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
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if record exists and get it before deletion
    const { data: existing, error: existError } = await supabase
      .from('compra_venda_imoveis')
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
      .from('compra_venda_imoveis')
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
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}
