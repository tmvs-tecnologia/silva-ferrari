import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { NotificationService } from '@/lib/notification';

// Helper function to convert snake_case to camelCase
function mapDbFieldsToFrontend(record: any) {
  if (!record) return record;
  
  return {
    id: record.id,
    clientName: record.client_name,
    type: record.type,
    currentStep: record.current_step,
    status: record.status,
    statusFinal: (record as any).status_final,
    statusFinalOutro: (record as any).status_final_outro,
    notes: record.notes,
    ownerName: (record as any).owner_name,
    ownerCpf: (record as any).owner_cpf,
    ownerRnm: (record as any).owner_rnm,
    ownerRnmDoc: (record as any).owner_rnm_doc,
    endereco: (record as any).endereco,
    declaracaoVizinhosDoc: (record as any).declaracao_vizinhos_doc,
    contaAguaDoc: (record as any).conta_agua_doc,
    contaLuzDoc: (record as any).conta_luz_doc,
    iptuDoc: (record as any).iptu_doc,
    nomeMae: record.nome_mae,
    nomePaiRegistral: record.nome_pai_registral,
    nomeSupostoPai: record.nome_suposto_pai,
    rnmMae: record.rnm_mae,
    rnmMaeDoc: record.rnm_mae_doc,
    rnmPai: record.rnm_pai,
    rnmPaiDoc: record.rnm_pai_doc,
    rnmSupostoPai: record.rnm_suposto_pai,
    rnmSupostoPaiDoc: record.rnm_suposto_pai_doc,
    cpfMae: record.cpf_mae,
    cpfPai: record.cpf_pai,
    certidaoNascimento: record.certidao_nascimento,
    certidaoNascimentoDoc: record.certidao_nascimento_doc,
    comprovanteEndereco: record.comprovante_endereco,
    comprovanteEnderecoDoc: record.comprovante_endereco_doc,
    passaporte: record.passaporte,
    passaporteDoc: record.passaporte_doc,
    passaporteMaeDoc: record.passaporte_mae_doc,
    passaportePaiRegistralDoc: record.passaporte_pai_registral_doc,
    passaporteSupostoPaiDoc: record.passaporte_suposto_pai_doc,
    guiaPaga: record.guia_paga,
    guiaPagaDoc: record.guia_paga_doc,
    dataExameDna: record.data_exame_dna,
    resultadoExameDna: record.resultado_exame_dna,
    resultadoExameDnaDoc: record.resultado_exame_dna_doc,
    procuracaoAnexada: record.procuracao_anexada,
    procuracaoAnexadaDoc: record.procuracao_anexada_doc,
    peticaoAnexada: record.peticao_anexada,
    peticaoAnexadaDoc: record.peticao_anexada_doc,
    processoAnexado: record.processo_anexado,
    numeroProtocolo: record.numero_protocolo,
    processoAnexadoDoc: record.processo_anexado_doc,
    documentosFinaisAnexados: record.documentos_finais_anexados,
    documentosFinaisAnexadosDoc: record.documentos_finais_anexados_doc,
    documentosProcessoFinalizado: record.documentos_processo_finalizado,
    documentosProcessoFinalizadoDoc: record.documentos_processo_finalizado_doc,
    nomeCrianca: record.nome_crianca,
    cpfSupostoPai: record.cpf_suposto_pai,
    peticaoConjunta: record.peticao_conjunta,
    peticaoConjuntaDoc: record.peticao_conjunta_doc,
    termoPartilhas: record.termo_partilhas,
    termoPartilhasDoc: record.termo_partilhas_doc,
    guarda: record.guarda,
    guardaDoc: record.guarda_doc,
    procuracao: record.procuracao,
    procuracaoDoc: record.procuracao_doc,
    peticaoCliente: record.peticao_cliente,
    peticaoClienteDoc: record.peticao_cliente_doc,
    procuracaoCliente: record.procuracao_cliente,
    procuracaoClienteDoc: record.procuracao_cliente_doc,
    custas: record.custas,
    custasDoc: record.custas_doc,
    peticaoInicial: record.peticao_inicial,
    peticaoInicialDoc: record.peticao_inicial_doc,
    matriculaImovel: record.matricula_imovel,
    matriculaImovelDoc: record.matricula_imovel_doc,
    aguaLuzIptu: record.agua_luz_iptu,
    aguaLuzIptuDoc: record.agua_luz_iptu_doc,
    camposExigencias: record.campos_exigencias,
    camposExigenciasDoc: record.campos_exigencias_doc,
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

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');
    const type = searchParams.get('type');
    const status = searchParams.get('status');

    let query = supabase
      .from('acoes_civeis')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply filters
    if (search) {
      const s = search.replace(/,/g, ' ');
      query = query.or(
        [
          `client_name.ilike.%${s}%`,
          `type.ilike.%${s}%`,
          `owner_name.ilike.%${s}%`,
          `owner_cpf.ilike.%${s}%`,
          `owner_rnm.ilike.%${s}%`,
          `endereco.ilike.%${s}%`,
          `nome_mae.ilike.%${s}%`,
          `nome_pai_registral.ilike.%${s}%`,
          `nome_suposto_pai.ilike.%${s}%`,
          `nome_crianca.ilike.%${s}%`,
          `rnm_mae.ilike.%${s}%`,
          `rnm_pai.ilike.%${s}%`,
          `rnm_suposto_pai.ilike.%${s}%`,
          `cpf_mae.ilike.%${s}%`,
          `cpf_pai.ilike.%${s}%`,
          `cpf_suposto_pai.ilike.%${s}%`,
          `certidao_nascimento.ilike.%${s}%`,
          `comprovante_endereco.ilike.%${s}%`,
          `passaporte.ilike.%${s}%`,
          `numero_protocolo.ilike.%${s}%`,
          `notes.ilike.%${s}%`,
          `campos_exigencias.ilike.%${s}%`,
          `matricula_imovel.ilike.%${s}%`,
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

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: results, error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ 
        error: 'Internal server error: ' + error.message 
      }, { status: 500 });
    }

    // Map database fields to frontend format
    const mappedResults = (results || []).map(mapDbFieldsToFrontend);

    return NextResponse.json(mappedResults, { 
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      }
    });
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
  const { 
    clientName, 
    type, 
    currentStep,
    status,
    ownerName,
    ownerCpf,
    ownerRnm,
    endereco,
    nomeMae,
    nomePaiRegistral,
    nomeSupostoPai,
    nomeCrianca,
    rnmMae,
    rnmPai,
    rnmSupostoPai,
    cpfMae,
    cpfPai,
    cpfSupostoPai,
    certidaoNascimento,
    comprovanteEndereco,
    passaporte,
    guiaPaga,
    notes,
    dataExameDna,
    procuracaoAnexada,
    peticaoAnexada,
    processoAnexado,
    numeroProtocolo,
    documentosFinaisAnexados,
    peticaoConjunta,
    termoPartilhas,
    guarda,
    procuracao,
    peticaoCliente,
    procuracaoCliente,
    custas,
    peticaoInicial,
    matriculaImovel,
    aguaLuzIptu,
    camposExigencias,
    // Document URL fields
    ownerRnmFile,
    ownerCpfFile,
    rnmMaeFile,
    rnmPaiFile,
    rnmSupostoPaiFile,
    cpfMaeFile,
    cpfPaiFile,
    certidaoNascimentoFile,
    comprovanteEnderecoFile,
    passaporteFile,
    guiaPagaFile,
    passaporteMaeFile,
    passaportePaiRegistralFile,
    passaporteSupostoPaiFile,
    resultadoExameDnaFile,
    procuracaoAnexadaFile,
    peticaoAnexadaFile,
    processoAnexadoFile,
    documentosFinaisAnexadosFile,
    documentosProcessoFinalizadoFile,
    peticaoConjuntaFile,
    termoPartilhasFile,
    guardaFile,
    procuracaoFile,
    peticaoClienteFile,
    procuracaoClienteFile,
    custasFile,
    peticaoInicialFile,
    matriculaImovelFile,
    contaAguaFile,
    contaLuzFile,
    iptuFile,
    aguaLuzIptuFile,
    camposExigenciasFile
  } = body;

    // Prepare insert data with defaults
    const insertData: any = {
      current_step: currentStep !== undefined ? currentStep : 1,
      status: status || 'Em Andamento',
      client_name: (clientName ?? '').trim(),
      type: (type ?? '').trim(),
    };

    // Add optional fields if provided
    if (ownerName !== undefined) insertData.owner_name = ownerName;
    if (ownerCpf !== undefined) insertData.owner_cpf = ownerCpf;
    if (ownerRnm !== undefined) insertData.owner_rnm = ownerRnm;
    if (endereco !== undefined) insertData.endereco = endereco;
    if (nomeMae !== undefined) insertData.nome_mae = nomeMae;
    if (nomePaiRegistral !== undefined) insertData.nome_pai_registral = nomePaiRegistral;
    if (nomeCrianca !== undefined) insertData.nome_crianca = nomeCrianca;
    if (rnmMae !== undefined) insertData.rnm_mae = rnmMae;
    if (rnmPai !== undefined) insertData.rnm_pai = rnmPai;
    if (rnmSupostoPai !== undefined) insertData.rnm_suposto_pai = rnmSupostoPai;
    if (cpfMae !== undefined) insertData.cpf_mae = cpfMae;
    if (cpfPai !== undefined) insertData.cpf_pai = cpfPai;
    if (cpfSupostoPai !== undefined) insertData.cpf_suposto_pai = cpfSupostoPai;
    if (certidaoNascimento !== undefined) insertData.certidao_nascimento = certidaoNascimento;
    if (comprovanteEndereco !== undefined) insertData.comprovante_endereco = comprovanteEndereco;
    if (passaporte !== undefined) insertData.passaporte = passaporte;
    if (guiaPaga !== undefined) insertData.guia_paga = guiaPaga;
    if (notes !== undefined) insertData.notes = notes;
    if (dataExameDna !== undefined) insertData.data_exame_dna = dataExameDna;
    if (procuracaoAnexada !== undefined) insertData.procuracao_anexada = procuracaoAnexada;
    if (peticaoAnexada !== undefined) insertData.peticao_anexada = peticaoAnexada;
    if (processoAnexado !== undefined) insertData.processo_anexado = processoAnexado;
    if (numeroProtocolo !== undefined) insertData.numero_protocolo = numeroProtocolo;
    if (documentosFinaisAnexados !== undefined) insertData.documentos_finais_anexados = documentosFinaisAnexados;
    if (peticaoConjunta !== undefined) insertData.peticao_conjunta = peticaoConjunta;
    if (termoPartilhas !== undefined) insertData.termo_partilhas = termoPartilhas;
    if (guarda !== undefined) insertData.guarda = guarda;
    if (procuracao !== undefined) insertData.procuracao = procuracao;
    if (peticaoCliente !== undefined) insertData.peticao_cliente = peticaoCliente;
    if (procuracaoCliente !== undefined) insertData.procuracao_cliente = procuracaoCliente;
    if (custas !== undefined) insertData.custas = custas;
    if (peticaoInicial !== undefined) insertData.peticao_inicial = peticaoInicial;
    if (matriculaImovel !== undefined) insertData.matricula_imovel = matriculaImovel;
    if (aguaLuzIptu !== undefined) insertData.agua_luz_iptu = aguaLuzIptu;
    if (camposExigencias !== undefined) insertData.campos_exigencias = camposExigencias;
    
    // Add document URL fields if provided
    if (ownerRnmFile !== undefined) insertData.owner_rnm_doc = ownerRnmFile;
    if (ownerCpfFile !== undefined) insertData.owner_cpf_doc = ownerCpfFile;
    if (rnmMaeFile !== undefined) insertData.rnm_mae_doc = rnmMaeFile;
    if (rnmPaiFile !== undefined) insertData.rnm_pai_doc = rnmPaiFile;
    if (rnmSupostoPaiFile !== undefined) insertData.rnm_suposto_pai_doc = rnmSupostoPaiFile;
    if (cpfMaeFile !== undefined) insertData.cpf_mae_doc = cpfMaeFile;
    if (cpfPaiFile !== undefined) insertData.cpf_pai_doc = cpfPaiFile;
    if (certidaoNascimentoFile !== undefined) insertData.certidao_nascimento_doc = certidaoNascimentoFile;
    if (comprovanteEnderecoFile !== undefined) insertData.comprovante_endereco_doc = comprovanteEnderecoFile;
    if (passaporteFile !== undefined) insertData.passaporte_doc = passaporteFile;
    if (passaporteMaeFile !== undefined) insertData.passaporte_mae_doc = passaporteMaeFile;
    if (passaportePaiRegistralFile !== undefined) insertData.passaporte_pai_registral_doc = passaportePaiRegistralFile;
    if (passaporteSupostoPaiFile !== undefined) insertData.passaporte_suposto_pai_doc = passaporteSupostoPaiFile;
    if (guiaPagaFile !== undefined) insertData.guia_paga_doc = guiaPagaFile;
    if (resultadoExameDnaFile !== undefined) insertData.resultado_exame_dna_doc = resultadoExameDnaFile;
    if (procuracaoAnexadaFile !== undefined) insertData.procuracao_anexada_doc = procuracaoAnexadaFile;
    if (peticaoAnexadaFile !== undefined) insertData.peticao_anexada_doc = peticaoAnexadaFile;
    if (processoAnexadoFile !== undefined) insertData.processo_anexado_doc = processoAnexadoFile;
    if (documentosFinaisAnexadosFile !== undefined) insertData.documentos_finais_anexados_doc = documentosFinaisAnexadosFile;
    if (documentosProcessoFinalizadoFile !== undefined) insertData.documentos_processo_finalizado_doc = documentosProcessoFinalizadoFile;
    if (peticaoConjuntaFile !== undefined) insertData.peticao_conjunta_doc = peticaoConjuntaFile;
    if (termoPartilhasFile !== undefined) insertData.termo_partilhas_doc = termoPartilhasFile;
    if (guardaFile !== undefined) insertData.guarda_doc = guardaFile;
    if (procuracaoFile !== undefined) insertData.procuracao_doc = procuracaoFile;
    if (peticaoClienteFile !== undefined) insertData.peticao_cliente_doc = peticaoClienteFile;
    if (procuracaoClienteFile !== undefined) insertData.procuracao_cliente_doc = procuracaoClienteFile;
    if (custasFile !== undefined) insertData.custas_doc = custasFile;
    if (peticaoInicialFile !== undefined) insertData.peticao_inicial_doc = peticaoInicialFile;
    if (matriculaImovelFile !== undefined) insertData.matricula_imovel_doc = matriculaImovelFile;
    if (contaAguaFile !== undefined) insertData.conta_agua_doc = contaAguaFile;
    if (contaLuzFile !== undefined) insertData.conta_luz_doc = contaLuzFile;
    if (iptuFile !== undefined) insertData.iptu_doc = iptuFile;
    if (aguaLuzIptuFile !== undefined) insertData.agua_luz_iptu_doc = aguaLuzIptuFile;
    if (camposExigenciasFile !== undefined) insertData.campos_exigencias_doc = camposExigenciasFile;

    const { data: newRecord, error } = await supabase
      .from('acoes_civeis')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ 
        error: 'Internal server error: ' + error.message 
      }, { status: 500 });
    }

    // Create notification for new action
    try {
      await NotificationService.createNotification(
        'new_process',
        {
          moduleSlug: 'acoes-civeis',
          id: newRecord.id,
          ...mapDbFieldsToFrontend(newRecord)
        },
        'acoes_civeis',
        newRecord.id,
        `Nova ação cível criada: ${clientName?.trim() || '—'} - ${type?.trim() || '—'}`
      );
    } catch (notificationError) {
      console.error('Error creating notification:', notificationError);
    }

    return NextResponse.json(newRecord, { 
      status: 201,
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      }
    });
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

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    // Check if record exists and get current data
    const { data: existing, error: existingError } = await supabase
      .from('acoes_civeis')
      .select('id, current_step, client_name, type')
      .eq('id', parseInt(id))
      .single();

    if (existingError || !existing) {
      return NextResponse.json({ 
        error: 'Record not found',
        code: 'NOT_FOUND'
      }, { status: 404 });
    }

    const body = await request.json();
    const { 
      clientName,
      type,
      currentStep,
      status,
      nomeMae,
      nomePaiRegistral,
      nomeSupostoPai,
      rnmMae,
      rnmPai,
      rnmSupostoPai,
      cpfMae,
      cpfPai,
      certidaoNascimento,
      comprovanteEndereco,
      passaporte,
      guiaPaga,
      notes,
      dataExameDna,
      procuracaoAnexada,
      peticaoAnexada,
      processoAnexado,
    numeroProtocolo,
    documentosFinaisAnexados,
    peticaoConjunta,
    termoPartilhas,
    guarda,
    procuracao,
    peticaoCliente,
    procuracaoCliente,
    custas,
    peticaoInicial,
    matriculaImovel,
    aguaLuzIptu,
    camposExigencias,
    // Document URL fields
      rnmMaeFile,
      rnmPaiFile,
      rnmSupostoPaiFile,
      cpfMaeFile,
      cpfPaiFile,
      certidaoNascimentoFile,
      comprovanteEnderecoFile,
      passaporteFile,
    guiaPagaFile,
      resultadoExameDnaFile,
      procuracaoAnexadaFile,
      peticaoAnexadaFile,
      processoAnexadoFile,
      documentosFinaisAnexadosFile,
    documentosProcessoFinalizadoFile,
    peticaoConjuntaFile,
    termoPartilhasFile,
    guardaFile,
    procuracaoFile,
    peticaoClienteFile,
    procuracaoClienteFile,
    custasFile,
    peticaoInicialFile,
    matriculaImovelFile,
    aguaLuzIptuFile,
    camposExigenciasFile
  } = body;

    // Prepare update data
    const updateData: any = {};

    // Add fields to update if provided
    if (clientName !== undefined) updateData.client_name = clientName.trim();
    if (type !== undefined) updateData.type = type.trim();
    if (currentStep !== undefined) updateData.current_step = currentStep;
    if (status !== undefined) updateData.status = status;
    if (nomeMae !== undefined) updateData.nome_mae = nomeMae;
    if (nomePaiRegistral !== undefined) updateData.nome_pai_registral = nomePaiRegistral;
    if (nomeSupostoPai !== undefined) updateData.nome_suposto_pai = nomeSupostoPai;
    if (rnmMae !== undefined) updateData.rnm_mae = rnmMae;
    if (rnmPai !== undefined) updateData.rnm_pai = rnmPai;
    if (rnmSupostoPai !== undefined) updateData.rnm_suposto_pai = rnmSupostoPai;
    if (cpfMae !== undefined) updateData.cpf_mae = cpfMae;
    if (cpfPai !== undefined) updateData.cpf_pai = cpfPai;
    if (certidaoNascimento !== undefined) updateData.certidao_nascimento = certidaoNascimento;
    if (comprovanteEndereco !== undefined) updateData.comprovante_endereco = comprovanteEndereco;
    if (passaporte !== undefined) updateData.passaporte = passaporte;
    if (guiaPaga !== undefined) updateData.guia_paga = guiaPaga;
    if (notes !== undefined) updateData.notes = notes;
    if (dataExameDna !== undefined) updateData.data_exame_dna = dataExameDna;
    if (procuracaoAnexada !== undefined) updateData.procuracao_anexada = procuracaoAnexada;
    if (peticaoAnexada !== undefined) updateData.peticao_anexada = peticaoAnexada;
    if (processoAnexado !== undefined) updateData.processo_anexado = processoAnexado;
    if (numeroProtocolo !== undefined) updateData.numero_protocolo = numeroProtocolo;
    if (documentosFinaisAnexados !== undefined) updateData.documentos_finais_anexados = documentosFinaisAnexados;
    if (peticaoConjunta !== undefined) updateData.peticao_conjunta = peticaoConjunta;
    if (termoPartilhas !== undefined) updateData.termo_partilhas = termoPartilhas;
    if (guarda !== undefined) updateData.guarda = guarda;
    if (procuracao !== undefined) updateData.procuracao = procuracao;
    if (peticaoCliente !== undefined) updateData.peticao_cliente = peticaoCliente;
    if (procuracaoCliente !== undefined) updateData.procuracao_cliente = procuracaoCliente;
    if (custas !== undefined) updateData.custas = custas;
    if (peticaoInicial !== undefined) updateData.peticao_inicial = peticaoInicial;
    if (matriculaImovel !== undefined) updateData.matricula_imovel = matriculaImovel;
    if (aguaLuzIptu !== undefined) updateData.agua_luz_iptu = aguaLuzIptu;
    if (camposExigencias !== undefined) updateData.campos_exigencias = camposExigencias;
    
    // Add document URL fields to update if provided
    if (rnmMaeFile !== undefined) updateData.rnm_mae_doc = rnmMaeFile;
    if (rnmPaiFile !== undefined) updateData.rnm_pai_doc = rnmPaiFile;
    if (rnmSupostoPaiFile !== undefined) updateData.rnm_suposto_pai_doc = rnmSupostoPaiFile;
    if (cpfMaeFile !== undefined) updateData.cpf_mae_doc = cpfMaeFile;
    if (cpfPaiFile !== undefined) updateData.cpf_pai_doc = cpfPaiFile;
    if (certidaoNascimentoFile !== undefined) updateData.certidao_nascimento_doc = certidaoNascimentoFile;
    if (comprovanteEnderecoFile !== undefined) updateData.comprovante_endereco_doc = comprovanteEnderecoFile;
    if (passaporteFile !== undefined) updateData.passaporte_doc = passaporteFile;
    if (guiaPagaFile !== undefined) updateData.guia_paga_doc = guiaPagaFile;
    if (resultadoExameDnaFile !== undefined) updateData.resultado_exame_dna_doc = resultadoExameDnaFile;
    if (procuracaoAnexadaFile !== undefined) updateData.procuracao_anexada_doc = procuracaoAnexadaFile;
    if (peticaoAnexadaFile !== undefined) updateData.peticao_anexada_doc = peticaoAnexadaFile;
    if (processoAnexadoFile !== undefined) updateData.processo_anexado_doc = processoAnexadoFile;
    if (documentosFinaisAnexadosFile !== undefined) updateData.documentos_finais_anexados_doc = documentosFinaisAnexadosFile;
    if (documentosProcessoFinalizadoFile !== undefined) updateData.documentos_processo_finalizado_doc = documentosProcessoFinalizadoFile;
    if (peticaoConjuntaFile !== undefined) updateData.peticao_conjunta_doc = peticaoConjuntaFile;
    if (termoPartilhasFile !== undefined) updateData.termo_partilhas_doc = termoPartilhasFile;
    if (guardaFile !== undefined) updateData.guarda_doc = guardaFile;
    if (procuracaoFile !== undefined) updateData.procuracao_doc = procuracaoFile;
    if (peticaoClienteFile !== undefined) updateData.peticao_cliente_doc = peticaoClienteFile;
    if (procuracaoClienteFile !== undefined) updateData.procuracao_cliente_doc = procuracaoClienteFile;
    if (custasFile !== undefined) updateData.custas_doc = custasFile;
    if (peticaoInicialFile !== undefined) updateData.peticao_inicial_doc = peticaoInicialFile;
    if (matriculaImovelFile !== undefined) updateData.matricula_imovel_doc = matriculaImovelFile;
    if (aguaLuzIptuFile !== undefined) updateData.agua_luz_iptu_doc = aguaLuzIptuFile;
    if (camposExigenciasFile !== undefined) updateData.campos_exigencias_doc = camposExigenciasFile;

    const { data: updated, error } = await supabase
      .from('acoes_civeis')
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

    // Create notification if step was completed (currentStep increased)
    if (currentStep !== undefined && currentStep > existing.current_step) {
      try {
        await supabase
          .from('alerts')
          .insert({
            module_type: 'acoes_civeis',
            record_id: parseInt(id),
            alert_for: 'admin',
            message: `Passo ${currentStep} concluído para: ${existing.client_name} - ${existing.type}`,
            is_read: false,
            created_at: new Date().toISOString()
          });
      } catch (notificationError) {
        console.error('Error creating step completion notification:', notificationError);
        // Don't fail the main operation if notification fails
      }
    }

    return NextResponse.json(updated, { 
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      }
    });
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

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    // Check if record exists and delete it
    const { data: deleted, error } = await supabase
      .from('acoes_civeis')
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
