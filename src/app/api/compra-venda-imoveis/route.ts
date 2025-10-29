import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Helper function to map database fields to frontend format
function mapDbFieldsToFrontend(record: any) {
  if (!record) return record;
  
  return {
    id: record.id,
    numeroMatricula: record.numero_matricula,
    numeroMatriculaDoc: record.numero_matricula_doc,
    cadastroContribuinte: record.cadastro_contribuinte,
    cadastroContribuinteDoc: record.cadastro_contribuinte_doc,
    enderecoImovel: record.endereco_imovel,
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
      query = query.ilike('endereco_imovel', `%${search}%`);
    }

    if (status) {
      query = query.eq('status', status);
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

    // Prepare data for Supabase (map camelCase to snake_case)
    const insertData = {
      numero_matricula: body.numeroMatricula ?? null,
      cadastro_contribuinte: body.cadastroContribuinte ?? null,
      endereco_imovel: body.enderecoImovel ?? null,
      rg_vendedores: body.rgVendedores ?? null,
      cpf_vendedores: body.cpfVendedores ?? null,
      data_nascimento_vendedores: body.dataNascimentoVendedores ?? null,
      rnm_comprador: body.rnmComprador ?? null,
      cpf_comprador: body.cpfComprador ?? null,
      endereco_comprador: body.enderecoComprador ?? null,
      current_step: body.currentStep ?? 0,
      status: body.status ?? 'Em Andamento',
      prazo_sinal: body.prazoSinal ?? null,
      prazo_escritura: body.prazoEscritura ?? null,
      contract_notes: body.contractNotes ?? null,
      step_notes: body.stepNotes ?? null,
      completed_steps: body.completedSteps ?? null,
    };

    const { data: newRecord, error } = await supabase
      .from('compra_venda_imoveis')
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

    if (body.numeroMatricula !== undefined) updateData.numero_matricula = body.numeroMatricula;
    if (body.cadastroContribuinte !== undefined) updateData.cadastro_contribuinte = body.cadastroContribuinte;
    if (body.enderecoImovel !== undefined) updateData.endereco_imovel = body.enderecoImovel;
    if (body.rgVendedores !== undefined) updateData.rg_vendedores = body.rgVendedores;
    if (body.cpfVendedores !== undefined) updateData.cpf_vendedores = body.cpfVendedores;
    if (body.dataNascimentoVendedores !== undefined) updateData.data_nascimento_vendedores = body.dataNascimentoVendedores;
    if (body.rnmComprador !== undefined) updateData.rnm_comprador = body.rnmComprador;
    if (body.cpfComprador !== undefined) updateData.cpf_comprador = body.cpfComprador;
    if (body.enderecoComprador !== undefined) updateData.endereco_comprador = body.enderecoComprador;
    if (body.currentStep !== undefined) updateData.current_step = body.currentStep;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.prazoSinal !== undefined) updateData.prazo_sinal = body.prazoSinal;
    if (body.prazoEscritura !== undefined) updateData.prazo_escritura = body.prazoEscritura;
    if (body.contractNotes !== undefined) updateData.contract_notes = body.contractNotes;
    if (body.stepNotes !== undefined) updateData.step_notes = body.stepNotes;
    if (body.completedSteps !== undefined) updateData.completed_steps = body.completedSteps;

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