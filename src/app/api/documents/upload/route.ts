import { NextRequest, NextResponse } from 'next/server';
// @ts-ignore - Supabase types will be resolved in production
import { createClient } from '@supabase/supabase-js';
import { getFilePath, BUCKET_NAME, FIELD_TO_DOCUMENT_NAME } from '@/lib/supabase';

// Create Supabase client with service role key for storage operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
  // Usucapião
  ownerRnmFile: 'usucapiao-dono',
  ownerCpfFile: 'usucapiao-dono',
  declaracaoVizinhosFile: 'usucapiao-vizinhos',
  matriculaImovelFile: 'usucapiao-matricula',
  contaAguaFile: 'usucapiao-agua',
  contaLuzFile: 'usucapiao-luz',
  iptuFile: 'usucapiao-iptu',
  contratoEngenheiroFile: 'usucapiao-engenheiro',
  
  // Perda de Nacionalidade
  protocoloDoc: 'protocolo',
  extratoSeiDoc: 'protocolo',
  douDoc: 'deferimento',
  douRatificacaoDoc: 'ratificacao',
  protocoloManifestoDoc: 'protocolo',
  documentoFinalizacaoDoc: 'finalizacao',
};

// Helper function to sanitize client names for folder paths
const sanitizeClientName = (name: string): string => {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '_')
    .toLowerCase();
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const caseId = formData.get('caseId') as string;
    const entityId = formData.get('entityId') as string;
    const entityType = formData.get('entityType') as string;
    const fieldName = formData.get('fieldName') as string;
    const clientName = formData.get('clientName') as string;
    const moduleType = formData.get('moduleType') as string || entityType || 'acoes_civeis'; // Default to acoes_civeis for backward compatibility

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

    console.log('🔹 Upload iniciado:', { caseId, entityId, recordId, fieldName, clientName, moduleType, fileName: file?.name, fileSize: file?.size });

    // Validate required fields - allow temporary uploads without caseId/fieldName
    if (!file) {
      return NextResponse.json(
        { error: "Arquivo é obrigatório" },
        { status: 400 }
      );
    }

    // Integrity check for empty files
    if (file.size === 0) {
      console.error('❌ Arquivo vazio:', file.name);
      return NextResponse.json(
        { error: 'Arquivo vazio. Por favor, envie um arquivo válido.' },
        { status: 400 }
      );
    }

    // Check if this is a temporary upload (no caseId/entityId and no fieldName)
    const isTemporaryUpload = !caseId && !entityId && !fieldName;

    if (!isTemporaryUpload && (!recordId || !fieldName)) {
      console.error('❌ Dados incompletos:', { file: !!file, caseId, entityId, recordId, fieldName, moduleType });
      return NextResponse.json(
        { error: 'ID do caso e nome do campo são obrigatórios para uploads permanentes' },
        { status: 400 }
      );
    }

    // Validate file size (50MB limit)
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
    if (file.size > MAX_FILE_SIZE) {
      console.error('❌ Arquivo muito grande:', file.size);
      return NextResponse.json(
        { error: 'Arquivo muito grande. Limite máximo: 50MB' },
        { status: 400 }
      );
    }

    // Accept any file type; default to generic content type when missing
    const contentType = file.type || 'application/octet-stream';

    // Generate file path with descriptive name
    const timestamp = Date.now();
    const originalName = file.name;
    const extension = originalName.split('.').pop();
    
    // Build file name based on original file name - CLEAN AND PRESERVED
    // User requirement: "Ao anexar um documento o nome deve ficar o mesmo do original, nada deve ser incluído"
    // To ensure uniqueness while keeping the original name, we will put it in a timestamped folder
    
    const sanitizedOriginalBase = originalName.replace(/\.[^/.]+$/, '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .toLowerCase();

    // The stored filename in the bucket will still be sanitized to avoid S3/Supabase issues, 
    // but the 'document_name' in DB will be the exact original.
    // We will use a unique folder structure to avoid collisions.
    const uniqueFolderId = `${timestamp}_${Math.random().toString(36).substring(2, 9)}`;
    const safeFileName = `${sanitizedOriginalBase}.${extension}`;
    
    // Construct file path based on upload type
    let filePath: string;
    
    if (isTemporaryUpload) {
      // For temporary uploads, use a simple path with timestamp
      filePath = `temp/${uniqueFolderId}/${safeFileName}`;
    } else {
      // Get step folder from field name
      const stepFolder = FIELD_TO_STEP_MAP[fieldName] || 'outros';
      
      // Use clientName or fallback to 'cliente_desconhecido'
      const clientNameForPath = clientName || 'cliente_desconhecido';
      
      // Use unique folder structure to preserve filename "purity" as much as possible in the final segment
      // Pattern: module/client_id/step/timestamp_id/filename.ext
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
        // Default to acoesCiveis for backward compatibility
        filePath = `acoes-civeis/${sanitizeClientName(clientNameForPath)}_${recordId}/${stepFolder}/${uniqueFolderId}/${safeFileName}`;
      }
    }

    console.log('📂 Caminho do arquivo:', filePath);

    // Upload to Supabase Storage
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log('⬆️ Iniciando upload para Supabase Storage...');

    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .upload(filePath, buffer, {
        contentType,
        upsert: true,
      });

    if (uploadError) {
      console.error('❌ Erro no upload do Supabase:', {
        message: uploadError.message,
        name: uploadError.name,
        cause: uploadError.cause,
      });
      return NextResponse.json(
        { 
          error: 'Erro ao fazer upload do arquivo no bucket Supabase', 
          details: uploadError.message,
          hint: 'Verifique se as políticas RLS do bucket estão configuradas corretamente'
        },
        { status: 500 }
      );
    }

    console.log('✅ Upload no Supabase concluído:', uploadData);

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    const publicUrl = urlData.publicUrl;

    console.log('🔗 URL pública gerada:', publicUrl);

    // For temporary uploads, skip database operations
    if (isTemporaryUpload) {
      return NextResponse.json({
        success: true,
        fileName: originalName, // Return exact original name
        fileUrl: publicUrl,
        filePath: filePath,
        temporary: true
      });
    }

    // Save document metadata to database (only for permanent uploads)
    console.log('💾 Salvando metadados no banco de dados...');
    const { data: insertedDoc, error: insertError } = await supabaseAdmin
      .from('documents')
      .insert({
        module_type: moduleType,
        record_id: parseInt(recordId),
        client_name: finalClientName || 'Cliente Desconhecido',
        field_name: fieldName,
        document_name: originalName, // Exact original name
        file_name: originalName,     // Exact original name
        file_path: publicUrl,
        file_type: contentType,
        file_size: file.size,
        uploaded_at: new Date().toISOString(),
      })
      .select('*')
      .single();


    if (insertError) {
      console.error('❌ Erro ao salvar metadados:', insertError);
      throw insertError;
    }

    // Update the case with the file URL (skip for generic uploads or modules without doc columns)
    const skipModuleUpdate = moduleType === 'acoes_trabalhistas' || moduleType === 'acoes_criminais';
    if (fieldName !== 'documentoAnexado' && !skipModuleUpdate) {
      const updateData: any = {};
      updateData[fieldName] = publicUrl;

      console.log(`🔄 Atualizando registro do módulo ${moduleType}...`);
      
      // Update the appropriate table based on moduleType
      // Map field names to correct database column names
      const fieldNameMapping: Record<string, string> = {
        // Ações Cíveis - usando colunas _doc para arquivos
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
        'documentosProcessoFinalizadoFile': 'documentos_processo_finalizado_doc'
        ,
        // Usucapião
        'ownerRnmFile': 'owner_rnm_doc',
        'ownerCpfFile': 'owner_cpf_doc',
        'declaracaoVizinhosFile': 'declaracao_vizinhos_doc',
        'matriculaImovelFile': 'matricula_imovel_doc',
        'contaAguaFile': 'conta_agua_doc',
        'contaLuzFile': 'conta_luz_doc',
        'iptuFile': 'iptu_doc',
        'contratoEngenheiroFile': 'contrato_engenheiro_doc',
        // Vistos
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

      let tableName: string;
      switch (moduleType) {
        case 'acoes_civeis':
          tableName = 'acoes_civeis';
          break;
        case 'perda_nacionalidade':
          tableName = 'perda_nacionalidade';
          break;
        case 'compra_venda_imoveis':
        case 'compra-venda':
          tableName = 'compra_venda_imoveis';
          break;
        case 'vistos':
          tableName = 'vistos';
          break;
        case 'acoes_trabalhistas':
          tableName = 'acoes_trabalhistas';
          break;
        case 'acoes_criminais':
          tableName = 'acoes_criminais';
          break;
        default:
          console.warn(`⚠️ Tipo de módulo não reconhecido: ${moduleType}. Usando acoes_civeis como padrão.`);
          tableName = 'acoes_civeis';
          break;
      }

      const { error: updateError } = await supabaseAdmin
        .from(tableName)
        .update(supabaseUpdateData)
        .eq('id', parseInt(recordId));

      if (updateError) {
        console.error('❌ Erro ao atualizar registro:', updateError);
        // Log and continue: some modules may not have dedicated doc columns
      }
    } else {
      console.log('📄 Upload sem atualização de tabela principal (genérico ou módulo sem colunas de documento)');
    }

    console.log('✅ Upload completo!');

    return NextResponse.json({
      success: true,
      fileName: originalName,
      fileUrl: publicUrl,
      filePath: filePath,
      document: insertedDoc,
    });
  } catch (error) {
    console.error('❌ Erro inesperado no upload:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

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
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

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
