import { NextRequest, NextResponse } from 'next/server';
// @ts-ignore - Supabase types will be resolved in production
import { createClient } from '@supabase/supabase-js';
import { NotificationService } from '@/lib/notification';

// Helper function to convert snake_case to camelCase for vistos
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
    comprovanteResidenciaPrevia: record.comprovante_residencia_previa,
    comprovanteResidenciaPreviaDoc: record.comprovante_residencia_previa_doc,
    formularioRn02: record.formulario_rn02,
    formularioRn02Doc: record.formulario_rn02_doc,
    comprovanteAtividade: record.comprovante_atividade,
    comprovanteAtividadeDoc: record.comprovante_atividade_doc,
    // Novos campos para Visto de Trabalho - Brasil
    certidaoNascimento: record.certidao_nascimento,
    certidaoNascimentoDoc: record.certidao_nascimento_doc,
    declaracaoCompreensao: record.declaracao_compreensao,
    declaracaoCompreensaoDoc: record.declaracao_compreensao_doc,
    declaracoesEmpresa: record.declaracoes_empresa,
    declaracoesEmpresaDoc: record.declaracoes_empresa_doc,
    procuracaoEmpresa: record.procuracao_empresa,
    procuracaoEmpresaDoc: record.procuracao_empresa_doc,
    formularioRn01: record.formulario_rn01,
    formularioRn01Doc: record.formulario_rn01_doc,
    guiaPaga: record.guia_paga,
    guiaPagaDoc: record.guia_paga_doc,
    publicacaoDou: record.dou,
    publicacaoDouDoc: record.dou_doc,
    comprovanteInvestimento: record.comprovante_investimento,
    comprovanteInvestimentoDoc: record.comprovante_investimento_doc,
    planoInvestimentos: record.plano_investimentos,
    planoInvestimentosDoc: record.plano_investimentos_doc,
    formularioRequerimento: record.formulario_requerimento,
    formularioRequerimentoDoc: record.formulario_requerimento_doc,
    protocolado: record.protocolado,
    protocoladoDoc: record.protocolado_doc,
    contratoTrabalho: record.contrato_trabalho,
    contratoTrabalhoDoc: record.contrato_trabalho_doc,
    folhaPagamento: record.folha_pagamento,
    folhaPagamentoDoc: record.folha_pagamento_doc,
    comprovanteVinculoAnterior: record.comprovante_vinculo_anterior,
    comprovanteVinculoAnteriorDoc: record.comprovante_vinculo_anterior_doc,
    declaracaoAntecedentesCriminais: record.declaracao_antecedentes_criminais,
    declaracaoAntecedentesCriminaisDoc: record.declaracao_antecedentes_criminais_doc,
    diploma: record.diploma,
    diplomaDoc: record.diploma_doc,
    contratoTrabalhoIndeterminado: record.contrato_trabalho_indeterminado,
    contratoTrabalhoIndeterminadoDoc: record.contrato_trabalho_indeterminado_doc,
    procurador: record.procurador,
    numeroProcesso: record.numero_processo,
    // Renovação 1 ano
    ctps: record.ctps,
    ctpsDoc: record.ctps_doc,
    contratoTrabalhoAnterior: record.contrato_trabalho_anterior,
    contratoTrabalhoAnteriorDoc: record.contrato_trabalho_anterior_doc,
    contratoTrabalhoAtual: record.contrato_trabalho_atual,
    contratoTrabalhoAtualDoc: record.contrato_trabalho_atual_doc,
    formularioProrrogacao: record.formulario_prorrogacao,
    formularioProrrogacaoDoc: record.formulario_prorrogacao_doc,
    justificativaMudancaEmpregador: record.justificativa_mudanca_empregador,
    justificativaMudancaEmpregadorDoc: record.justificativa_mudanca_empregador_doc,
    statusFinal: record.status_final,
    statusFinalOutro: record.status_final_outro,
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
    const type = searchParams.get('type');
    const status = searchParams.get('status');

    let query = supabase
      .from('vistos')
      .select('*');

    // Apply filters
  if (search) {
    const s = search.replace(/,/g, ' ');
    query = query.or(
      [
        `client_name.ilike.%${s}%`,
        `type.ilike.%${s}%`,
        `country.ilike.%${s}%`,
        `cpf.ilike.%${s}%`,
        `rnm.ilike.%${s}%`,
        `passaporte.ilike.%${s}%`,
        `comprovante_endereco.ilike.%${s}%`,
        `cartao_cnpj.ilike.%${s}%`,
          `contrato_empresa.ilike.%${s}%`,
          `escritura_imoveis.ilike.%${s}%`,
          `reservas_passagens.ilike.%${s}%`,
          `reservas_hotel.ilike.%${s}%`,
          `roteiro_viagem.ilike.%${s}%`,
          `taxa.ilike.%${s}%`,
          `notes.ilike.%${s}%`,
        ].join(',')
      );
    }

    if (type) {
      query = query.eq('type', type);
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

    if (!body.type || body.type.trim() === '') {
      return NextResponse.json({ 
        error: "type is required and cannot be empty",
        code: "MISSING_TYPE" 
      }, { status: 400 });
    }

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
      type: body.type.trim(),
      country: body.country?.trim() || null,
      travel_start_date: body.travelStartDate?.trim() || null,
      travel_end_date: body.travelEndDate?.trim() || null,
      current_step: typeof body.currentStep === 'number' ? body.currentStep : 1,
      completed_steps: normalizeJson(body.completedSteps),
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
      comprovante_residencia_previa: body.comprovanteResidenciaPrevia?.trim() || null,
      comprovante_residencia_previa_doc: body.comprovanteResidenciaPreviaDoc?.trim() || null,
      formulario_rn02: body.formularioRn02?.trim() || null,
      formulario_rn02_doc: body.formularioRn02Doc?.trim() || null,
      comprovante_atividade: body.comprovanteAtividade?.trim() || null,
      comprovante_atividade_doc: body.comprovanteAtividadeDoc?.trim() || null,
      // Novos campos para Visto de Trabalho - Brasil
      certidao_nascimento: body.certidaoNascimento?.trim() || null,
      certidao_nascimento_doc: body.certidaoNascimentoDoc?.trim() || null,
      declaracao_compreensao: body.declaracaoCompreensao?.trim() || null,
      declaracao_compreensao_doc: body.declaracaoCompreensaoDoc?.trim() || null,
      declaracoes_empresa: body.declaracoesEmpresa?.trim() || null,
      declaracoes_empresa_doc: body.declaracoesEmpresaDoc?.trim() || null,
      procuracao_empresa: body.procuracaoEmpresa?.trim() || null,
      procuracao_empresa_doc: body.procuracaoEmpresaDoc?.trim() || null,
      formulario_rn01: body.formularioRn01?.trim() || null,
      formulario_rn01_doc: body.formularioRn01Doc?.trim() || null,
      guia_paga: body.guiaPaga?.trim() || null,
      guia_paga_doc: body.guiaPagaDoc?.trim() || null,
      dou: body.publicacaoDou?.trim() || null,
      dou_doc: body.publicacaoDouDoc?.trim() || null,
      comprovante_investimento: body.comprovanteInvestimento?.trim() || null,
      comprovante_investimento_doc: body.comprovanteInvestimentoDoc?.trim() || null,
      plano_investimentos: body.planoInvestimentos?.trim() || null,
      plano_investimentos_doc: body.planoInvestimentosDoc?.trim() || null,
      formulario_requerimento: body.formularioRequerimento?.trim() || null,
      formulario_requerimento_doc: body.formularioRequerimentoDoc?.trim() || null,
      protocolado: body.protocolado?.trim() || null,
      protocolado_doc: body.protocoladoDoc?.trim() || null,
      contrato_trabalho: body.contratoTrabalho?.trim() || null,
      contrato_trabalho_doc: body.contratoTrabalhoDoc?.trim() || null,
      folha_pagamento: body.folhaPagamento?.trim() || null,
      folha_pagamento_doc: body.folhaPagamentoDoc?.trim() || null,
      comprovante_vinculo_anterior: body.comprovanteVinculoAnterior?.trim() || null,
      comprovante_vinculo_anterior_doc: body.comprovanteVinculoAnteriorDoc?.trim() || null,
      declaracao_antecedentes_criminais: body.declaracaoAntecedentesCriminais?.trim() || null,
      declaracao_antecedentes_criminais_doc: body.declaracaoAntecedentesCriminaisDoc?.trim() || null,
      diploma: body.diploma?.trim() || null,
      diploma_doc: body.diplomaDoc?.trim() || null,
      contrato_trabalho_indeterminado: body.contratoTrabalhoIndeterminado?.trim() || null,
      contrato_trabalho_indeterminado_doc: body.contratoTrabalhoIndeterminadoDoc?.trim() || null,
      procurador: body.procurador?.trim() || null,
      numero_processo: body.numeroProcesso?.trim() || null,
      // Renovação 1 ano
      ctps: body.ctps?.trim() || null,
      ctps_doc: body.ctpsDoc?.trim() || null,
      contrato_trabalho_anterior: body.contratoTrabalhoAnterior?.trim() || null,
      contrato_trabalho_anterior_doc: body.contratoTrabalhoAnteriorDoc?.trim() || null,
      contrato_trabalho_atual: body.contratoTrabalhoAtual?.trim() || null,
      contrato_trabalho_atual_doc: body.contratoTrabalhoAtualDoc?.trim() || null,
      formulario_prorrogacao: body.formularioProrrogacao?.trim() || null,
      formulario_prorrogacao_doc: body.formularioProrrogacaoDoc?.trim() || null,
      justificativa_mudanca_empregador: body.justificativaMudancaEmpregador?.trim() || null,
      justificativa_mudanca_empregador_doc: body.justificativaMudancaEmpregadorDoc?.trim() || null,
      status_final: (() => {
        const provided = body.statusFinal?.trim();
        if (provided) return provided;
        const t = (body.type || '').toLowerCase();
        return t.includes('turismo') ? 'Aguardando' : null;
      })(),
      status_final_outro: body.statusFinalOutro?.trim() || null,
      status: body.status?.trim() || 'Em Andamento',
      notes: body.notes?.trim() || null,
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
          moduleSlug: 'vistos',
          id: newRecord.id,
          ...mapVistosDbFieldsToFrontend(newRecord)
        },
        'vistos',
        newRecord.id,
        `Novo processo de visto criado: ${body.clientName.trim()}`
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

    // Prepare update data (only include provided fields, map camelCase to snake_case)
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

    if (body.cpf !== undefined) {
      updateData.cpf = body.cpf?.trim() || null;
    }

    if (body.cpfDoc !== undefined) {
      updateData.cpf_doc = body.cpfDoc?.trim() || null;
    }

    if (body.rnm !== undefined) {
      updateData.rnm = body.rnm?.trim() || null;
    }

    if (body.rnmDoc !== undefined) {
      updateData.rnm_doc = body.rnmDoc?.trim() || null;
    }

    if (body.passaporte !== undefined) {
      updateData.passaporte = body.passaporte?.trim() || null;
    }

    if (body.passaporteDoc !== undefined) {
      updateData.passaporte_doc = body.passaporteDoc?.trim() || null;
    }

    if (body.comprovanteEndereco !== undefined) {
      updateData.comprovante_endereco = body.comprovanteEndereco?.trim() || null;
    }

    if (body.comprovanteEnderecoDoc !== undefined) {
      updateData.comprovante_endereco_doc = body.comprovanteEnderecoDoc?.trim() || null;
    }

    if (body.declaracaoResidenciaDoc !== undefined) {
      updateData.declaracao_residencia_doc = body.declaracaoResidenciaDoc?.trim() || null;
    }

    if (body.foto3x4Doc !== undefined) {
      updateData.foto_3x4_doc = body.foto3x4Doc?.trim() || null;
    }

    if (body.documentoChines !== undefined) {
      updateData.documento_chines = body.documentoChines?.trim() || null;
    }

    if (body.documentoChinesDoc !== undefined) {
      updateData.documento_chines_doc = body.documentoChinesDoc?.trim() || null;
    }

    if (body.antecedentesCriminais !== undefined) {
      updateData.antecedentes_criminais = body.antecedentesCriminais?.trim() || null;
    }

    if (body.antecedentesCriminaisDoc !== undefined) {
      updateData.antecedentes_criminais_doc = body.antecedentesCriminaisDoc?.trim() || null;
    }

    if (body.certidaoNascimentoFilhos !== undefined) {
      updateData.certidao_nascimento_filhos = body.certidaoNascimentoFilhos?.trim() || null;
    }

    if (body.certidaoNascimentoFilhosDoc !== undefined) {
      updateData.certidao_nascimento_filhos_doc = body.certidaoNascimentoFilhosDoc?.trim() || null;
    }

    if (body.cartaoCnpj !== undefined) {
      updateData.cartao_cnpj = body.cartaoCnpj?.trim() || null;
    }

    if (body.cartaoCnpjDoc !== undefined) {
      updateData.cartao_cnpj_doc = body.cartaoCnpjDoc?.trim() || null;
    }

    if (body.contratoEmpresa !== undefined) {
      updateData.contrato_empresa = body.contratoEmpresa?.trim() || null;
    }

    if (body.contratoEmpresaDoc !== undefined) {
      updateData.contrato_empresa_doc = body.contratoEmpresaDoc?.trim() || null;
    }

    if (body.escrituraImoveis !== undefined) {
      updateData.escritura_imoveis = body.escrituraImoveis?.trim() || null;
    }

    if (body.escrituraImoveisDoc !== undefined) {
      updateData.escritura_imoveis_doc = body.escrituraImoveisDoc?.trim() || null;
    }

    if (body.extratosBancarios !== undefined) {
      updateData.extratos_bancarios = body.extratosBancarios?.trim() || null;
    }

    if (body.extratosBancariosDoc !== undefined) {
      updateData.extratos_bancarios_doc = body.extratosBancariosDoc?.trim() || null;
    }

    if (body.impostoRenda !== undefined) {
      updateData.imposto_renda = body.impostoRenda?.trim() || null;
    }

    if (body.impostoRendaDoc !== undefined) {
      updateData.imposto_renda_doc = body.impostoRendaDoc?.trim() || null;
    }

    if (body.reservasPassagens !== undefined) {
      updateData.reservas_passagens = body.reservasPassagens?.trim() || null;
    }

    if (body.reservasPassagensDoc !== undefined) {
      updateData.reservas_passagens_doc = body.reservasPassagensDoc?.trim() || null;
    }

    if (body.reservasHotel !== undefined) {
      updateData.reservas_hotel = body.reservasHotel?.trim() || null;
    }

    if (body.reservasHotelDoc !== undefined) {
      updateData.reservas_hotel_doc = body.reservasHotelDoc?.trim() || null;
    }

    if (body.seguroViagem !== undefined) {
      updateData.seguro_viagem = body.seguroViagem?.trim() || null;
    }

    if (body.seguroViagemDoc !== undefined) {
      updateData.seguro_viagem_doc = body.seguroViagemDoc?.trim() || null;
    }

    if (body.roteiroViagem !== undefined) {
      updateData.roteiro_viagem = body.roteiroViagem?.trim() || null;
    }

    if (body.roteiroViagemDoc !== undefined) {
      updateData.roteiro_viagem_doc = body.roteiroViagemDoc?.trim() || null;
    }

    if (body.taxa !== undefined) {
      updateData.taxa = body.taxa?.trim() || null;
    }

    if (body.taxaDoc !== undefined) {
      updateData.taxa_doc = body.taxaDoc?.trim() || null;
    }

    if (body.formularioConsulado !== undefined) {
      updateData.formulario_consulado = body.formularioConsulado?.trim() || null;
    }

    if (body.formularioConsuladoDoc !== undefined) {
      updateData.formulario_consulado_doc = body.formularioConsuladoDoc?.trim() || null;
    }
    if (body.comprovanteResidenciaPrevia !== undefined) {
      updateData.comprovante_residencia_previa = body.comprovanteResidenciaPrevia?.trim() || null;
    }
    if (body.comprovanteResidenciaPreviaDoc !== undefined) {
      updateData.comprovante_residencia_previa_doc = body.comprovanteResidenciaPreviaDoc?.trim() || null;
    }
    if (body.formularioRn02 !== undefined) {
      updateData.formulario_rn02 = body.formularioRn02?.trim() || null;
    }
    if (body.formularioRn02Doc !== undefined) {
      updateData.formulario_rn02_doc = body.formularioRn02Doc?.trim() || null;
    }
    if (body.comprovanteAtividade !== undefined) {
      updateData.comprovante_atividade = body.comprovanteAtividade?.trim() || null;
    }
    if (body.comprovanteAtividadeDoc !== undefined) {
      updateData.comprovante_atividade_doc = body.comprovanteAtividadeDoc?.trim() || null;
    }

    // Novos campos para Visto de Trabalho - Brasil
    if (body.certidaoNascimento !== undefined) {
      updateData.certidao_nascimento = body.certidaoNascimento?.trim() || null;
    }
    if (body.certidaoNascimentoDoc !== undefined) {
      updateData.certidao_nascimento_doc = body.certidaoNascimentoDoc?.trim() || null;
    }
    if (body.declaracaoCompreensao !== undefined) {
      updateData.declaracao_compreensao = body.declaracaoCompreensao?.trim() || null;
    }
    if (body.declaracaoCompreensaoDoc !== undefined) {
      updateData.declaracao_compreensao_doc = body.declaracaoCompreensaoDoc?.trim() || null;
    }
    if (body.declaracoesEmpresa !== undefined) {
      updateData.declaracoes_empresa = body.declaracoesEmpresa?.trim() || null;
    }
    if (body.declaracoesEmpresaDoc !== undefined) {
      updateData.declaracoes_empresa_doc = body.declaracoesEmpresaDoc?.trim() || null;
    }
    if (body.procuracaoEmpresa !== undefined) {
      updateData.procuracao_empresa = body.procuracaoEmpresa?.trim() || null;
    }
    if (body.procuracaoEmpresaDoc !== undefined) {
      updateData.procuracao_empresa_doc = body.procuracaoEmpresaDoc?.trim() || null;
    }
    if (body.formularioRn01 !== undefined) {
      updateData.formulario_rn01 = body.formularioRn01?.trim() || null;
    }
    if (body.formularioRn01Doc !== undefined) {
      updateData.formulario_rn01_doc = body.formularioRn01Doc?.trim() || null;
    }
    if (body.guiaPaga !== undefined) {
      updateData.guia_paga = body.guiaPaga?.trim() || null;
    }
    if (body.guiaPagaDoc !== undefined) {
      updateData.guia_paga_doc = body.guiaPagaDoc?.trim() || null;
    }
    if (body.publicacaoDou !== undefined) {
      updateData.dou = body.publicacaoDou?.trim() || null;
    }
    if (body.publicacaoDouDoc !== undefined) {
      updateData.dou_doc = body.publicacaoDouDoc?.trim() || null;
    }
    if (body.comprovanteInvestimento !== undefined) {
      updateData.comprovante_investimento = body.comprovanteInvestimento?.trim() || null;
    }
    if (body.comprovanteInvestimentoDoc !== undefined) {
      updateData.comprovante_investimento_doc = body.comprovanteInvestimentoDoc?.trim() || null;
    }
    if (body.planoInvestimentos !== undefined) {
      updateData.plano_investimentos = body.planoInvestimentos?.trim() || null;
    }
    if (body.planoInvestimentosDoc !== undefined) {
      updateData.plano_investimentos_doc = body.planoInvestimentosDoc?.trim() || null;
    }
    if (body.formularioRequerimento !== undefined) {
      updateData.formulario_requerimento = body.formularioRequerimento?.trim() || null;
    }
    if (body.formularioRequerimentoDoc !== undefined) {
      updateData.formulario_requerimento_doc = body.formularioRequerimentoDoc?.trim() || null;
    }
    if (body.protocolado !== undefined) {
      updateData.protocolado = body.protocolado?.trim() || null;
    }
    if (body.protocoladoDoc !== undefined) {
      updateData.protocolado_doc = body.protocoladoDoc?.trim() || null;
    }
    if (body.contratoTrabalho !== undefined) {
      updateData.contrato_trabalho = body.contratoTrabalho?.trim() || null;
    }
    if (body.contratoTrabalhoDoc !== undefined) {
      updateData.contrato_trabalho_doc = body.contratoTrabalhoDoc?.trim() || null;
    }
    if (body.folhaPagamento !== undefined) {
      updateData.folha_pagamento = body.folhaPagamento?.trim() || null;
    }
    if (body.folhaPagamentoDoc !== undefined) {
      updateData.folha_pagamento_doc = body.folhaPagamentoDoc?.trim() || null;
    }
    if (body.comprovanteVinculoAnterior !== undefined) {
      updateData.comprovante_vinculo_anterior = body.comprovanteVinculoAnterior?.trim() || null;
    }
    if (body.comprovanteVinculoAnteriorDoc !== undefined) {
      updateData.comprovante_vinculo_anterior_doc = body.comprovanteVinculoAnteriorDoc?.trim() || null;
    }
    if (body.declaracaoAntecedentesCriminais !== undefined) {
      updateData.declaracao_antecedentes_criminais = body.declaracaoAntecedentesCriminais?.trim() || null;
    }
    if (body.declaracaoAntecedentesCriminaisDoc !== undefined) {
      updateData.declaracao_antecedentes_criminais_doc = body.declaracaoAntecedentesCriminaisDoc?.trim() || null;
    }
    if (body.diploma !== undefined) {
      updateData.diploma = body.diploma?.trim() || null;
    }
    if (body.diplomaDoc !== undefined) {
      updateData.diploma_doc = body.diplomaDoc?.trim() || null;
    }
    if (body.contratoTrabalhoIndeterminado !== undefined) {
      updateData.contrato_trabalho_indeterminado = body.contratoTrabalhoIndeterminado?.trim() || null;
    }
    if (body.contratoTrabalhoIndeterminadoDoc !== undefined) {
      updateData.contrato_trabalho_indeterminado_doc = body.contratoTrabalhoIndeterminadoDoc?.trim() || null;
    }
    if (body.procurador !== undefined) {
      updateData.procurador = body.procurador?.trim() || null;
    }
    if (body.numeroProcesso !== undefined) {
      updateData.numero_processo = body.numeroProcesso?.trim() || null;
    }
    // Renovação 1 ano
    if (body.ctps !== undefined) {
      updateData.ctps = body.ctps?.trim() || null;
    }
    if (body.ctpsDoc !== undefined) {
      updateData.ctps_doc = body.ctpsDoc?.trim() || null;
    }
    if (body.contratoTrabalhoAnterior !== undefined) {
      updateData.contrato_trabalho_anterior = body.contratoTrabalhoAnterior?.trim() || null;
    }
    if (body.contratoTrabalhoAnteriorDoc !== undefined) {
      updateData.contrato_trabalho_anterior_doc = body.contratoTrabalhoAnteriorDoc?.trim() || null;
    }
    if (body.contratoTrabalhoAtual !== undefined) {
      updateData.contrato_trabalho_atual = body.contratoTrabalhoAtual?.trim() || null;
    }
    if (body.contratoTrabalhoAtualDoc !== undefined) {
      updateData.contrato_trabalho_atual_doc = body.contratoTrabalhoAtualDoc?.trim() || null;
    }
    if (body.formularioProrrogacao !== undefined) {
      updateData.formulario_prorrogacao = body.formularioProrrogacao?.trim() || null;
    }
    if (body.formularioProrrogacaoDoc !== undefined) {
      updateData.formulario_prorrogacao_doc = body.formularioProrrogacaoDoc?.trim() || null;
    }
    if (body.justificativaMudancaEmpregador !== undefined) {
      updateData.justificativa_mudanca_empregador = body.justificativaMudancaEmpregador?.trim() || null;
    }
    if (body.justificativaMudancaEmpregadorDoc !== undefined) {
      updateData.justificativa_mudanca_empregador_doc = body.justificativaMudancaEmpregadorDoc?.trim() || null;
    }

    if (body.status !== undefined) {
      updateData.status = body.status.trim();
    }

    if (body.statusFinal !== undefined) {
      updateData.status_final = body.statusFinal?.trim() || null;
    }

    if (body.statusFinalOutro !== undefined) {
      updateData.status_final_outro = body.statusFinalOutro?.trim() || null;
    }

    if (body.notes !== undefined) {
      updateData.notes = body.notes?.trim() || null;
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

    // Check if record exists and get it before deletion
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
