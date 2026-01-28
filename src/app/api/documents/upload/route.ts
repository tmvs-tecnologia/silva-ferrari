import { NextRequest, NextResponse } from 'next/server';
import { getFilePath, BUCKET_NAME, FIELD_TO_DOCUMENT_NAME } from '@/lib/supabase';
import { getSupabaseAdminClient } from '@/lib/supabase-server';

// Map field names to organized folder structure
const FIELD_TO_STEP_MAP: Record<string, string> = {
  // Documentos Iniciais
  rnmMaeFile: 'documentos-iniciais',
  rnmPaiFile: 'documentos-iniciais',
  rnmSupostoPaiFile: 'documentos-iniciais',
  certidaoNascimentoFile: 'documentos-iniciais',
  comprovanteEnderecoFile: 'documentos-iniciais',
  passaporteFile: 'documentos-iniciais',
  guiaPagaFile: 'guia-judicial',

  // Exame DNA
  resultadoExameDnaFile: 'exame-dna',

  // Procuração
  procuracaoAnexadaFile: 'procuracao',
  procuracaoClienteFile: 'procuracao',

  // Petição
  peticaoAnexadaFile: 'peticao',
  peticaoClienteFile: 'peticao',

  // Processo
  processoAnexadoFile: 'processo',

  // Exigências
  documentosFinaisAnexadosFile: 'exigencias',

  // Finalização
  documentosProcessoFinalizadoFile: 'finalizacao',

  // Usucapião & Ações Cíveis
  ownerRnmFile: 'usucapiao-dono',
  ownerCpfFile: 'usucapiao-dono',
  declaracaoVizinhosFile: 'usucapiao-vizinhos',
  matriculaImovelFile: 'usucapiao-matricula',
  contaAguaFile: 'usucapiao-agua',
  contaLuzFile: 'usucapiao-luz',
  iptuFile: 'usucapiao-iptu',
  contratoEngenheiroFile: 'usucapiao-engenheiro',
  peticaoInicialFile: 'peticao-inicial',
  custasFile: 'custas',
  termoPartilhasFile: 'divorcio',
  guardaFile: 'divorcio',
  peticaoConjuntaFile: 'divorcio',
  passaporteMaeFile: 'passaportes',
  passaportePaiRegistralFile: 'passaportes',
  passaporteSupostoPaiFile: 'passaportes',
  passaportePaiFile: 'passaportes',
  passaporteCriancaFile: 'passaportes',
  aguaLuzIptuFile: 'imovel',
  camposExigenciasFile: 'exigencias',

  // Perda de Nacionalidade
  protocoloDoc: 'protocolo',
  extratoSeiDoc: 'protocolo',
  douDoc: 'deferimento',
  douRatificacaoDoc: 'ratificacao',
  protocoloManifestoDoc: 'protocolo',
  documentoFinalizacaoDoc: 'finalizacao',
  rnmMaeDoc: 'documentos-pais',
  cpfMaeDoc: 'documentos-pais',
  rnmPaiDoc: 'documentos-pais',
  cpfPaiDoc: 'documentos-pais',
  passaporteMaeDoc: 'passaportes',
  passaportePaiDoc: 'passaportes',
  passaporteCriancaDoc: 'passaportes',
  rgCriancaDoc: 'documentos-crianca',
  certidaoNascimentoDoc: 'documentos-crianca',
  documentoChinesDoc: 'documentos-adicionais',
  traducaoJuramentadaDoc: 'documentos-adicionais',

  // Vistos (Generic & Specific)
  passaporteDoc: 'documentos-pessoais',
  diplomaDoc: 'documentos-educacionais',
  certidaoCasamentoDoc: 'documentos-pessoais',
  certidaoNascimentoFilhosDoc: 'documentos-pessoais',
  extratosBancariosDoc: 'financeiro',
  impostoRendaDoc: 'financeiro',
  holeritesDoc: 'financeiro',
  cartaEmpregadorDoc: 'profissional',
  contratoSocialDoc: 'profissional',
  prolaboreDoc: 'profissional',
  formularioVistoDoc: 'formularios',
  ds160Doc: 'formularios',
  fotoVistoDoc: 'documentos-pessoais',

  // Turismo
  cpfDoc: 'documentos-pessoais',
  rnmDoc: 'documentos-pessoais',
  comprovanteEnderecoDoc: 'documentos-pessoais',
  declaracaoResidenciaDoc: 'documentos-pessoais',
  foto3x4Doc: 'documentos-pessoais',
  antecedentesCriminaisDoc: 'documentos-pessoais',
  cartaoCnpjDoc: 'documentos-especificos',
  contratoEmpresaDoc: 'documentos-especificos',
  escrituraImoveisDoc: 'documentos-especificos',
  procuradorDoc: 'documentos-especificos',
  reservasPassagensDoc: 'viagem',
  reservasHotelDoc: 'viagem',
  seguroViagemDoc: 'viagem',
  roteiroViagemDoc: 'viagem',
  taxaDoc: 'viagem',
  formularioConsuladoDoc: 'viagem',
  documentosAdicionaisDoc: 'outros',

  // Compra e Venda
  comprovanteEnderecoImovelDoc: 'imovel',
  numeroMatriculaDoc: 'imovel',
  cadastroContribuinteDoc: 'imovel',

  // Ações Trabalhistas e Criminais
  fotoNotificacaoDoc: 'documentos-acao',
};

// Helper function to sanitize client names for folder paths
const sanitizeClientName = (name: string): string => {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '_')
    .toLowerCase();
};

const getFileExtension = (fileName?: string): string => {
  const name = String(fileName || '').trim();
  const idx = name.lastIndexOf('.');
  if (idx === -1) return '';
  return name.slice(idx + 1).toLowerCase();
};

const normalizeFileTypeFallback = (fileType: any, fileName?: string): string => {
  const t = String(fileType || '').trim();
  const ext = getFileExtension(fileName);
  const map: Record<string, string> = {
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
  };
  const normalizedFromExt = map[ext] || ext || 'application/octet-stream';
  if (!t) return normalizedFromExt;
  return t;
};

const isTooLongForColumn = (err: any): boolean => {
  const msg = String(err?.message || err?.details || '').toLowerCase();
  return err?.code === '22001' || msg.includes('too long') || msg.includes('value too long');
};

const toShortTypeForDb = (fileType: string, fileName?: string): string => {
  const t = String(fileType || '').trim();
  const ext = getFileExtension(fileName);
  if (t === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return 'docx';
  if (t === 'application/msword') return 'doc';
  if (t === 'application/pdf') return 'pdf';
  if (t === 'image/jpeg') return 'jpg';
  if (t === 'image/png') return 'png';
  if (ext) return ext;
  return (t || 'application/octet-stream').slice(0, 50);
};

export const runtime = 'nodejs'; // Use Node.js runtime for larger file handling capabilities

export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdminClient();

    // Check if content-type is JSON (for registration only mode)
    const reqContentType = request.headers.get('content-type') || '';
    let isRegisterOnly = false;
    let formData: FormData | null = null;
    let jsonBody: any = null;

    if (reqContentType.includes('application/json')) {
      isRegisterOnly = true;
      jsonBody = await request.json();
    } else {
      formData = await request.formData();
    }

    // Extract common fields
    const caseId = isRegisterOnly ? jsonBody.caseId : formData?.get('caseId') as string;
    const entityId = isRegisterOnly ? jsonBody.entityId : formData?.get('entityId') as string;
    const entityType = isRegisterOnly ? jsonBody.entityType : formData?.get('entityType') as string;
    const fieldName = isRegisterOnly ? jsonBody.fieldName : formData?.get('fieldName') as string;
    const clientName = isRegisterOnly ? jsonBody.clientName : formData?.get('clientName') as string;
    const moduleType = (isRegisterOnly ? jsonBody.moduleType : formData?.get('moduleType') as string) || entityType || 'acoes_civeis';

    // Additional fields for Register Only
    const fileUrl = isRegisterOnly ? jsonBody.fileUrl : null;
    const providedFilePath = isRegisterOnly ? jsonBody.filePath : null;
    const providedFileName = isRegisterOnly ? jsonBody.fileName : null;
    const providedFileType = isRegisterOnly ? jsonBody.fileType : null;
    const providedFileSize = isRegisterOnly ? jsonBody.fileSize : 0;

    const file = !isRegisterOnly ? (formData?.get('file') as File) : null;

    // Use either caseId or entityId as the identifier
    const recordId = caseId || entityId;

    // Get case data to extract client information if not provided
    let finalClientName = clientName;
    if (!finalClientName && recordId && moduleType === 'acoes_civeis') {
      const { data: caseData, error: caseError } = await supabaseAdmin
        .from("acoes_civeis")
        .select("client_name")
        .eq("id", recordId)
        .single();

      if (caseData && !caseError) {
        finalClientName = caseData.client_name;
      }
    }

    console.log('🔹 Upload/Registro iniciado:', {
      mode: isRegisterOnly ? 'Register Only' : 'Upload + Register',
      caseId, entityId, recordId, fieldName, clientName, moduleType
    });

    // Validation
    if (!isRegisterOnly) {
      if (!file) return NextResponse.json({ error: "Arquivo é obrigatório" }, { status: 400 });
      if (file.size === 0) return NextResponse.json({ error: 'Arquivo vazio.' }, { status: 400 });

      const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json({ error: 'Arquivo muito grande. Limite máximo: 50MB' }, { status: 400 });
      }
    } else {
      if (!fileUrl || !providedFileName) {
        return NextResponse.json({ error: "URL e nome do arquivo são obrigatórios." }, { status: 400 });
      }
    }

    const isTemporaryUpload = !caseId && !entityId && !fieldName;

    if (!isTemporaryUpload && (!recordId || !fieldName)) {
      return NextResponse.json(
        { error: 'ID do caso e nome do campo são obrigatórios para uploads permanentes' },
        { status: 400 }
      );
    }

    // Determine file properties
    const contentType = (isRegisterOnly ? providedFileType : file?.type) || 'application/octet-stream';
    const originalName = isRegisterOnly ? providedFileName : file!.name;
    const extension = originalName.split('.').pop();

    const sanitizedOriginalBase = originalName.replace(/\.[^/.]+$/, '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .toLowerCase();

    const timestamp = Date.now();
    const uniqueFolderId = `${timestamp}_${Math.random().toString(36).substring(2, 9)}`;
    const safeFileName = `${sanitizedOriginalBase}.${extension}`;

    let filePath: string;
    if (isRegisterOnly && providedFilePath) {
      filePath = providedFilePath;
    } else if (isTemporaryUpload) {
      filePath = `temp/${uniqueFolderId}/${safeFileName}`;
    } else {
      const stepFolder = FIELD_TO_STEP_MAP[fieldName] || 'outros';
      const clientNameForPath = finalClientName || 'cliente_desconhecido';

      if (moduleType === 'compra_venda_imoveis') {
        filePath = `compra-venda/${sanitizeClientName(clientNameForPath)}_${recordId}/${uniqueFolderId}/${safeFileName}`;
      } else if (moduleType === 'perda_nacionalidade') {
        filePath = `perda-nacionalidade/${sanitizeClientName(clientNameForPath)}_${recordId}/${stepFolder}/${uniqueFolderId}/${safeFileName}`;
      } else if (moduleType === 'vistos') {
        filePath = `vistos/${sanitizeClientName(clientNameForPath)}_${recordId}/${stepFolder}/${uniqueFolderId}/${safeFileName}`;
      } else if (moduleType === 'acoes_trabalhistas') {
        filePath = `acoes-trabalhistas/${sanitizeClientName(clientNameForPath)}_${recordId}/${uniqueFolderId}/${safeFileName}`;
      } else if (moduleType === 'acoes_criminais') {
        filePath = `acoes-criminais/${sanitizeClientName(clientNameForPath)}_${recordId}/${uniqueFolderId}/${safeFileName}`;
      } else {
        filePath = `acoes-civeis/${sanitizeClientName(clientNameForPath)}_${recordId}/${stepFolder}/${uniqueFolderId}/${safeFileName}`;
      }
    }

    let publicUrl = fileUrl;

    // Perform Upload if not register-only
    if (!isRegisterOnly && file) {
      console.log('📂 Caminho do arquivo:', filePath);
      console.log('⬆️ Iniciando upload para Supabase Storage...');

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from(BUCKET_NAME)
        .upload(filePath, buffer, {
          contentType,
          upsert: true,
        });

      if (uploadError) {
        console.error('❌ Erro no upload:', uploadError);
        return NextResponse.json({ error: 'Erro ao fazer upload no Supabase', details: uploadError.message }, { status: 500 });
      }

      console.log('✅ Upload concluído:', uploadData);

      const { data: urlData } = supabaseAdmin.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);

      publicUrl = urlData.publicUrl;
      console.log('🔗 URL pública gerada:', publicUrl);
    }

    if (isTemporaryUpload) {
      return NextResponse.json({
        success: true,
        fileName: originalName,
        fileUrl: publicUrl,
        filePath: filePath,
        temporary: true
      });
    }

    // Save Metadata
    console.log('💾 Salvando metadados...');
    const fileTypeResolved = normalizeFileTypeFallback(contentType, originalName);
    const resolvedFileSize = isRegisterOnly ? providedFileSize : file!.size;

    const insertPayloadBase = {
      module_type: moduleType,
      record_id: parseInt(recordId),
      client_name: finalClientName || 'Cliente Desconhecido',
      field_name: fieldName,
      document_name: originalName,
      file_name: originalName,
      file_path: publicUrl,
      file_size: resolvedFileSize,
      uploaded_at: new Date().toISOString(),
    } as const;

    const attemptInsert = async (resolvedType: string) => {
      return await supabaseAdmin
        .from('documents')
        .insert({ ...insertPayloadBase, file_type: resolvedType })
        .select('*')
        .single();
    };

    let { data: insertedDoc, error: insertError } = await attemptInsert(fileTypeResolved);

    if (insertError) {
      if (isTooLongForColumn(insertError)) {
        const shortType = toShortTypeForDb(fileTypeResolved, originalName);
        const retry = await attemptInsert(shortType);
        insertedDoc = retry.data as any;
        insertError = retry.error as any;
      }
      if (insertError) {
        console.error('❌ Erro ao salvar metadados:', insertError);
        return NextResponse.json(
          { error: 'Erro ao registrar metadados', details: insertError.message },
          { status: 500 }
        );
      }
    }

    // Update Case Record
    const skipModuleUpdate = moduleType === 'acoes_trabalhistas' || moduleType === 'acoes_criminais';
    if (fieldName !== 'documentoAnexado' && !skipModuleUpdate) {
      console.log(`🔄 Atualizando registro do módulo ${moduleType}...`);

      const fieldNameMapping: Record<string, string> = {
        'rnmMaeFile': 'rnm_mae_doc',
        'rnmPaiFile': 'rnm_pai_doc',
        'rnmSupostoPaiFile': 'rnm_suposto_pai_doc',
        'certidaoNascimentoFile': 'certidao_nascimento_doc',
        'comprovanteEnderecoFile': 'comprovante_endereco_doc',
        'passaporteFile': 'passaporte_doc',
        'guiaPagaFile': 'guia_paga_doc',
        'resultadoExameDnaFile': 'resultado_exame_dna_doc',
        'procuracaoAnexadaFile': 'procuracao_anexada_doc',
        'peticaoAnexadaFile': 'peticao_anexada_doc',
        'processoAnexadoFile': 'processo_anexado_doc',
        'documentosFinaisAnexadosFile': 'documentos_finais_anexados_doc',
        'documentosProcessoFinalizadoFile': 'documentos_processo_finalizado_doc',
        'ownerRnmFile': 'owner_rnm_doc',
        'ownerCpfFile': 'owner_cpf_doc',
        'declaracaoVizinhosFile': 'declaracao_vizinhos_doc',
        'matriculaImovelFile': 'matricula_imovel_doc',
        'contaAguaFile': 'conta_agua_doc',
        'contaLuzFile': 'conta_luz_doc',
        'iptuFile': 'iptu_doc',
        'contratoEngenheiroFile': 'contrato_engenheiro_doc',
        'cpfDoc': 'cpf_doc',
        'rnmDoc': 'rnm_doc',
        'passaporteDoc': 'passaporte_doc',
        'comprovanteEnderecoDoc': 'comprovante_endereco_doc',
        'declaracaoResidenciaDoc': 'declaracao_residencia_doc',
        'foto3x4Doc': 'foto_3x4_doc',
        'documentoChinesDoc': 'documento_chines_doc',
        'antecedentesCriminaisDoc': 'antecedentes_criminais_doc',
        'certidaoNascimentoFilhosDoc': 'certidao_nascimento_filhos_doc',
        'cartaoCnpjDoc': 'cartao_cnpj_doc',
        'contratoEmpresaDoc': 'contrato_empresa_doc',
        'escrituraImoveisDoc': 'escritura_imoveis_doc',
        'extratosBancariosDoc': 'extratos_bancarios_doc',
        'impostoRendaDoc': 'imposto_renda_doc',
        'reservasPassagensDoc': 'reservas_passagens_doc',
        'reservasHotelDoc': 'reservas_hotel_doc',
        'seguroViagemDoc': 'seguro_viagem_doc',
        'roteiroViagemDoc': 'roteiro_viagem_doc',
        'taxaDoc': 'taxa_doc',
        'formularioConsuladoDoc': 'formulario_consulado_doc',
        'comprovanteResidenciaPreviaDoc': 'comprovante_residencia_previa_doc',
        'formularioRn02Doc': 'formulario_rn02_doc',
        'comprovanteAtividadeDoc': 'comprovante_atividade_doc',
        'certidaoNascimentoDoc': 'certidao_nascimento_doc',
        'declaracaoCompreensaoDoc': 'declaracao_compreensao_doc',
        'declaracoesEmpresaDoc': 'declaracoes_empresa_doc',
        'procuracaoEmpresaDoc': 'procuracao_empresa_doc',
        'formularioRn01Doc': 'formulario_rn01_doc',
        'guiaPagaDoc': 'guia_paga_doc',
        'publicacaoDouDoc': 'dou_doc',
        'comprovanteInvestimentoDoc': 'comprovante_investimento_doc',
        'planoInvestimentosDoc': 'plano_investimentos_doc',
        'formularioRequerimentoDoc': 'formulario_requerimento_doc',
        'protocoladoDoc': 'protocolado_doc',
        'contratoTrabalhoDoc': 'contrato_trabalho_doc',
        'folhaPagamentoDoc': 'folha_pagamento_doc',
        'comprovanteVinculoAnteriorDoc': 'comprovante_vinculo_anterior_doc',
        'declaracaoAntecedentesCriminaisDoc': 'declaracao_antecedentes_criminais_doc',
        'diplomaDoc': 'diploma_doc',
        'ctpsDoc': 'ctps_doc',
        'contratoTrabalhoAnteriorDoc': 'contrato_trabalho_anterior_doc',
        'contratoTrabalhoAtualDoc': 'contrato_trabalho_atual_doc',
        'formularioProrrogacaoDoc': 'formulario_prorrogacao_doc',
        'contratoTrabalhoIndeterminadoDoc': 'contrato_trabalho_indeterminado_doc',
        'justificativaMudancaEmpregadorDoc': 'justificativa_mudanca_empregador_doc'
      };

      const dbFieldName = fieldNameMapping[fieldName] || fieldName.replace(/([A-Z])/g, '_$1').toLowerCase();
      const supabaseUpdateData: any = {};
      supabaseUpdateData[dbFieldName] = publicUrl;

      let tableName = 'acoes_civeis';
      if (moduleType === 'perda_nacionalidade') tableName = 'perda_nacionalidade';
      else if (moduleType === 'compra_venda_imoveis' || moduleType === 'compra-venda') tableName = 'compra_venda_imoveis';
      else if (moduleType === 'vistos') tableName = 'vistos';
      else if (moduleType === 'acoes_trabalhistas') tableName = 'acoes_trabalhistas';
      else if (moduleType === 'acoes_criminais') tableName = 'acoes_criminais';

      const { error: updateError } = await supabaseAdmin
        .from(tableName as any)
        .update(supabaseUpdateData)
        .eq('id', parseInt(recordId));

      if (updateError) console.error('❌ Erro ao atualizar registro:', updateError);
    }

    console.log('✅ Completo!');

    return NextResponse.json({
      success: true,
      fileName: originalName,
      fileUrl: publicUrl,
      filePath: filePath,
      document: insertedDoc,
    });
  } catch (error) {
    console.error('❌ Erro inesperado:', error);
    return NextResponse.json({ error: 'Erro interno: ' + (error as Error).message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdminClient();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const moduleType = searchParams.get('moduleType');
    const recordId = searchParams.get('recordId');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 200);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    if (id) {
      const documentId = parseInt(id);
      if (isNaN(documentId)) {
        return NextResponse.json(
          { error: 'ID inválido', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const { data: document, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .single();

      if (error || !document) {
        return NextResponse.json(
          { error: 'Documento não encontrado' },
          { status: 404 }
        );
      }

      return NextResponse.json(document);
    }

    if (moduleType && recordId) {
      const recordIdNum = parseInt(recordId);
      if (isNaN(recordIdNum)) {
        return NextResponse.json(
          { error: 'recordId inválido', code: 'INVALID_RECORD_ID' },
          { status: 400 }
        );
      }

      const { data: filteredDocuments, error } = await supabase
        .from('documents')
        .select('*')
        .ilike('module_type', moduleType)
        .eq('record_id', recordIdNum)
        .range(offset, offset + limit - 1);

      if (error) {
        throw error;
      }

      return NextResponse.json(filteredDocuments || []);
    }

    const { data: allDocuments, error } = await supabase
      .from('documents')
      .select('*')
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    return NextResponse.json(allDocuments || []);
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Erro interno: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = getSupabaseAdminClient();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID é obrigatório', code: 'MISSING_ID' },
        { status: 400 }
      );
    }

    const documentId = parseInt(id);
    if (isNaN(documentId)) {
      return NextResponse.json(
        { error: 'ID inválido', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if document exists
    const { data: existingDocument, error: checkError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (checkError || !existingDocument) {
      return NextResponse.json(
        { error: 'Documento não encontrado' },
        { status: 404 }
      );
    }

    // Delete document
    const { data: deleted, error } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      message: 'Documento excluído com sucesso',
      document: deleted
    });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Erro interno: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
