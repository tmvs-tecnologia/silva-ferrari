import { NextRequest, NextResponse } from 'next/server';
// @ts-ignore - Supabase types will be resolved in production
import { createClient } from '@supabase/supabase-js';
import { NotificationService } from '@/lib/notification';

// Helper function to convert DB fields to frontend format
function mapVistosDbFieldsToFrontend(record: any) {
  if (!record) return record;

  return {
    id: record.id,
    clientName: record.client_name,
    type: record.type,
    country: record.country,
    travelStartDate: record.travel_start_date,
    travelEndDate: record.travel_end_date,
    currentStep: record.current_step,
    completedSteps: record.completed_steps,
    cpf: record.cpf,
    cpfDoc: record.cpf_doc,
    rnm: record.rnm,
    rnmDoc: record.rnm_doc,
    passaporte: record.passaporte,
    passaporteDoc: record.passaporte_doc,
    comprovanteEndereco: record.comprovante_endereco,
    comprovanteEnderecoDoc: record.comprovante_endereco_doc,
    declaracaoResidenciaDoc: record.declaracao_residencia_doc,
    foto3x4Doc: record.foto_3x4_doc,
    documentoChines: record.documento_chines,
    documentoChinesDoc: record.documento_chines_doc,
    antecedentesCriminais: record.antecedentes_criminais,
    antecedentesCriminaisDoc: record.antecedentes_criminais_doc,
    certidaoNascimentoFilhos: record.certidao_nascimento_filhos,
    certidaoNascimentoFilhosDoc: record.certidao_nascimento_filhos_doc,
    cartaoCnpj: record.cartao_cnpj,
    cartaoCnpjDoc: record.cartao_cnpj_doc,
    contratoEmpresa: record.contrato_empresa,
    contratoEmpresaDoc: record.contrato_empresa_doc,
    escrituraImoveis: record.escritura_imoveis,
    escrituraImoveisDoc: record.escritura_imoveis_doc,
    extratosBancarios: record.extratos_bancarios,
    extratosBancariosDoc: record.extratos_bancarios_doc,
    impostoRenda: record.imposto_renda,
    impostoRendaDoc: record.imposto_renda_doc,
    reservasPassagens: record.reservas_passagens,
    reservasPassagensDoc: record.reservas_passagens_doc,
    reservasHotel: record.reservas_hotel,
    reservasHotelDoc: record.reservas_hotel_doc,
    seguroViagem: record.seguro_viagem,
    seguroViagemDoc: record.seguro_viagem_doc,
    roteiroViagem: record.roteiro_viagem,
    roteiroViagemDoc: record.roteiro_viagem_doc,
    taxa: record.taxa,
    taxaDoc: record.taxa_doc,
    formularioConsulado: record.formulario_consulado,
    formularioConsuladoDoc: record.formulario_consulado_doc,

    // New fields
    documentosAnexos: record.documentos_anexos,
    numeroProcesso: record.numero_processo,
    statusFinal: record.status_final,
    statusFinalOutro: record.status_final_outro,
    procurador: record.procurador,
    procuradorDoc: record.procurador_doc,


    status: record.status,
    notes: record.notes,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Single record fetch by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json({
          error: "Valid ID is required",
          code: "INVALID_ID"
        }, { status: 400 });
      }

      const { data: record, error } = await supabase
        .from('vistos')
        .select('*')
        .eq('id', parseInt(id))
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return NextResponse.json({
            error: 'Record not found',
            code: 'NOT_FOUND'
          }, { status: 404 });
        }
        throw error;
      }

      // Map database fields to frontend format
      const mappedRecord = mapVistosDbFieldsToFrontend(record);
      return NextResponse.json(mappedRecord, { status: 200 });
    }

    // List with pagination, search, and filters
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');
    const status = searchParams.get('status');

    let query = supabase
      .from('vistos')
      .select('*')
      .eq('type', 'Turismo'); // Filter by type

    // Apply filters
    if (search) {
      const s = search.replace(/,/g, ' ');
      query = query.or(
        [
          `client_name.ilike.%${s}%`,
          `country.ilike.%${s}%`,
          `cpf.ilike.%${s}%`,
          `rnm.ilike.%${s}%`,
          `passaporte.ilike.%${s}%`,
          `comprovante_endereco.ilike.%${s}%`,
          `notes.ilike.%${s}%`,
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

    // Map database fields to frontend format
    const mappedResults = (results || []).map(mapVistosDbFieldsToFrontend);

    return NextResponse.json(mappedResults, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const body = await request.json();

    // Validate required fields
    if (!body.clientName || body.clientName.trim() === '') {
      return NextResponse.json({
        error: "clientName is required and cannot be empty",
        code: "MISSING_CLIENT_NAME"
      }, { status: 400 });
    }

    // Enforce type for this module
    const type = "Turismo";

    // Prepare data for Supabase (map camelCase to snake_case)
    const normalizeJson = (v: any) => {
      if (v === undefined || v === null || v === '') return [];
      if (typeof v === 'string') {
        try { return JSON.parse(v); } catch { return []; }
      }
      return Array.isArray(v) ? v : [];
    };

    const insertData = {
      client_name: body.clientName.trim(),
      type: type,
      country: body.country?.trim() || null,
      travel_start_date: body.travelStartDate?.trim() || null,
      travel_end_date: body.travelEndDate?.trim() || null,
      notes: body.notes?.trim() || null,
      status: body.status?.trim() || 'Em Andamento',
      current_step: typeof body.currentStep === 'number' ? body.currentStep : 1,
      completed_steps: normalizeJson(body.completedSteps),

      // Docs
      cpf: body.cpf?.trim() || null,
      cpf_doc: body.cpfDoc?.trim() || null,
      rnm: body.rnm?.trim() || null,
      rnm_doc: body.rnmDoc?.trim() || null,
      passaporte: body.passaporte?.trim() || null,
      passaporte_doc: body.passaporteDoc?.trim() || null,
      comprovante_endereco: body.comprovanteEndereco?.trim() || null,
      comprovante_endereco_doc: body.comprovanteEnderecoDoc?.trim() || null,
      declaracao_residencia_doc: body.declaracaoResidenciaDoc?.trim() || null,
      foto_3x4_doc: body.foto3x4Doc?.trim() || null,
      documento_chines: body.documentoChines?.trim() || null,
      documento_chines_doc: body.documentoChinesDoc?.trim() || null,
      antecedentes_criminais: body.antecedentesCriminais?.trim() || null,
      antecedentes_criminais_doc: body.antecedentesCriminaisDoc?.trim() || null,
      certidao_nascimento_filhos: body.certidaoNascimentoFilhos?.trim() || null,
      certidao_nascimento_filhos_doc: body.certidaoNascimentoFilhosDoc?.trim() || null,
      cartao_cnpj: body.cartaoCnpj?.trim() || null,
      cartao_cnpj_doc: body.cartaoCnpjDoc?.trim() || null,
      contrato_empresa: body.contratoEmpresa?.trim() || null,
      contrato_empresa_doc: body.contratoEmpresaDoc?.trim() || null,
      escritura_imoveis: body.escrituraImoveis?.trim() || null,
      escritura_imoveis_doc: body.escrituraImoveisDoc?.trim() || null,
      extratos_bancarios: body.extratosBancarios?.trim() || null,
      extratos_bancarios_doc: body.extratosBancariosDoc?.trim() || null,
      imposto_renda: body.impostoRenda?.trim() || null,
      imposto_renda_doc: body.impostoRendaDoc?.trim() || null,
      reservas_passagens: body.reservasPassagens?.trim() || null,
      reservas_passagens_doc: body.reservasPassagensDoc?.trim() || null,
      reservas_hotel: body.reservasHotel?.trim() || null,
      reservas_hotel_doc: body.reservasHotelDoc?.trim() || null,
      seguro_viagem: body.seguroViagem?.trim() || null,
      seguro_viagem_doc: body.seguroViagemDoc?.trim() || null,
      roteiro_viagem: body.roteiroViagem?.trim() || null,
      roteiro_viagem_doc: body.roteiroViagemDoc?.trim() || null,
      taxa: body.taxa?.trim() || null,
      taxa_doc: body.taxaDoc?.trim() || null,
      formulario_consulado: body.formularioConsulado?.trim() || null,
      formulario_consulado_doc: body.formularioConsuladoDoc?.trim() || null,
      procurador: body.procurador?.trim() || null,
      procurador_doc: body.procuradorDoc?.trim() || null,


      documentos_anexos: body.documentosAnexos,
      numero_processo: body.numeroProcesso,
    };

    const { data: newRecord, error } = await supabase
      .from('vistos')
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
          moduleSlug: 'turismo',
          id: newRecord.id,
          ...mapVistosDbFieldsToFrontend(newRecord)
        },
        'turismo',
        newRecord.id,
        `Novo processo de turismo criado: ${body.clientName.trim()}`
      );
    } catch (e) {
      console.error('Failed to create notification:', e);
    }

    return NextResponse.json(newRecord, { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({
        error: "Valid ID is required",
        code: "INVALID_ID"
      }, { status: 400 });
    }

    // Check if record exists
    const { data: existing, error: existError } = await supabase
      .from('vistos')
      .select('id')
      .eq('id', parseInt(id))
      .single();

    if (existError) {
      if (existError.code === 'PGRST116') {
        return NextResponse.json({
          error: 'Record not found',
          code: 'NOT_FOUND'
        }, { status: 404 });
      }
      throw existError;
    }

    const body = await request.json();

    // Prepare update data
    const updateData: Record<string, any> = {};

    if (body.clientName !== undefined) {
      updateData.client_name = body.clientName.trim();
    }

    if (body.type !== undefined) {
      updateData.type = body.type.trim();
    }

    if (body.country !== undefined) {
      updateData.country = body.country?.trim() || null;
    }
    if (body.travelStartDate !== undefined) {
      updateData.travel_start_date = body.travelStartDate?.trim() || null;
    }
    if (body.travelEndDate !== undefined) {
      updateData.travel_end_date = body.travelEndDate?.trim() || null;
    }

    if (body.currentStep !== undefined) {
      const n = Number(body.currentStep);
      updateData.current_step = Number.isFinite(n) ? n : null;
    }

    if (body.completedSteps !== undefined) {
      const normalizeJson = (v: any) => {
        if (v === undefined || v === null || v === '') return [];
        if (typeof v === 'string') {
          try { return JSON.parse(v); } catch { return []; }
        }
        return Array.isArray(v) ? v : [];
      };
      updateData.completed_steps = normalizeJson(body.completedSteps);
    }

    const docFields = [
      ['cpf', 'cpf'], ['cpfDoc', 'cpf_doc'], ['rnm', 'rnm'], ['rnmDoc', 'rnm_doc'],
      ['passaporte', 'passaporte'], ['passaporteDoc', 'passaporte_doc'],
      ['comprovanteEndereco', 'comprovante_endereco'], ['comprovanteEnderecoDoc', 'comprovante_endereco_doc'],
      ['declaracaoResidenciaDoc', 'declaracao_residencia_doc'], ['foto3x4Doc', 'foto_3x4_doc'],
      ['documentoChines', 'documento_chines'], ['documentoChinesDoc', 'documento_chines_doc'],
      ['antecedentesCriminais', 'antecedentes_criminais'], ['antecedentesCriminaisDoc', 'antecedentes_criminais_doc'],
      ['certidaoNascimentoFilhos', 'certidao_nascimento_filhos'], ['certidaoNascimentoFilhosDoc', 'certidao_nascimento_filhos_doc'],
      ['cartaoCnpj', 'cartao_cnpj'], ['cartaoCnpjDoc', 'cartao_cnpj_doc'],
      ['contratoEmpresa', 'contrato_empresa'], ['contratoEmpresaDoc', 'contrato_empresa_doc'],
      ['escrituraImoveis', 'escritura_imoveis'], ['escrituraImoveisDoc', 'escritura_imoveis_doc'],
      ['extratosBancarios', 'extratos_bancarios'], ['extratosBancariosDoc', 'extratos_bancarios_doc'],
      ['impostoRenda', 'imposto_renda'], ['impostoRendaDoc', 'imposto_renda_doc'],
      ['reservasPassagens', 'reservas_passagens'], ['reservasPassagensDoc', 'reservas_passagens_doc'],
      ['reservasHotel', 'reservas_hotel'], ['reservasHotelDoc', 'reservas_hotel_doc'],
      ['seguroViagem', 'seguro_viagem'], ['seguroViagemDoc', 'seguro_viagem_doc'],
      ['roteiroViagem', 'roteiro_viagem'], ['roteiroViagemDoc', 'roteiro_viagem_doc'],
      ['taxa', 'taxa'], ['taxaDoc', 'taxa_doc'],
      ['formularioConsulado', 'formulario_consulado'], ['formularioConsuladoDoc', 'formulario_consulado_doc'],
      ['procurador', 'procurador'], ['procuradorDoc', 'procurador_doc']
    ];

    docFields.forEach(([jsonKey, dbKey]) => {
      if (body[jsonKey] !== undefined) {
        updateData[dbKey] = body[jsonKey]?.trim() || null;
      }
    });

    if (body.status !== undefined) {
      updateData.status = body.status.trim();
    }

    if (body.notes !== undefined) {
      updateData.notes = body.notes?.trim() || null;
    }

    // New fields
    if (body.documentosAnexos !== undefined) {
      updateData.documentos_anexos = body.documentosAnexos;
    }
    if (body.numeroProcesso !== undefined) {
      updateData.numero_processo = body.numeroProcesso;
    }
    if (body.statusFinal !== undefined) {
      updateData.status_final = body.statusFinal;
    }
    if (body.statusFinalOutro !== undefined) {
      updateData.status_final_outro = body.statusFinalOutro;
    }

    const { data: updated, error } = await supabase
      .from('vistos')
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
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({
        error: "Valid ID is required",
        code: "INVALID_ID"
      }, { status: 400 });
    }

    // Check if record exists
    const { data: existing, error: existError } = await supabase
      .from('vistos')
      .select('*')
      .eq('id', parseInt(id))
      .single();

    if (existError) {
      if (existError.code === 'PGRST116') {
        return NextResponse.json({
          error: 'Record not found',
          code: 'NOT_FOUND'
        }, { status: 404 });
      }
      throw existError;
    }

    const { error } = await supabase
      .from('vistos')
      .delete()
      .eq('id', parseInt(id));

    if (error) {
      throw error;
    }

    return NextResponse.json({
      message: 'Record deleted successfully',
      record: existing
    }, { status: 200 });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}
