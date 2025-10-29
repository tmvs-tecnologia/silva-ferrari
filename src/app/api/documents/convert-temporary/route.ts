import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { caseId, moduleType, clientName, documents } = await request.json();

    console.log('🔄 Convertendo uploads temporários para permanentes:', {
      caseId,
      moduleType,
      clientName,
      documentsCount: documents.length
    });

    // Mapeamento de nomes de campos para colunas do banco
    const fieldNameMapping: Record<string, string> = {
      'rnmMae': 'rnm_mae_doc',
      'rnmPai': 'rnm_pai_doc', 
      'rnmSupostoPai': 'rnm_suposto_pai_doc',
      'certidaoNascimento': 'certidao_nascimento_doc',
      'comprovanteEndereco': 'comprovante_endereco_doc',
      'passaporte': 'passaporte_doc',
      'guiaPaga': 'guia_paga_doc',
      'resultadoExameDna': 'resultado_exame_dna_doc',
      'procuracaoAnexada': 'procuracao_anexada_doc',
      'peticaoAnexada': 'peticao_anexada_doc',
      'processoAnexado': 'processo_anexado_doc',
      'documentosFinaisAnexados': 'documentos_finais_anexados_doc',
      'documentosProcessoFinalizado': 'documentos_processo_finalizado_doc'
    };

    // Preparar dados para atualizar a tabela do caso
    const caseUpdateData: any = {};
    
    // Processar cada documento
    for (const doc of documents) {
      const { fieldName, fileUrl } = doc;
      
      // Extrair informações do arquivo da URL
      const fileName = fileUrl.split('/').pop() || 'document';
      const documentDisplayName = fieldName.replace(/([A-Z])/g, ' $1').trim();
      
      // Salvar metadados na tabela documents
      const { error: insertError } = await supabaseAdmin
        .from('documents')
        .insert({
          module_type: moduleType,
          record_id: parseInt(caseId),
          client_name: clientName || 'Cliente Desconhecido',
          field_name: fieldName,
          document_name: documentDisplayName,
          file_name: fileName,
          file_path: fileUrl,
          file_type: 'application/octet-stream', // Tipo genérico já que não temos o arquivo original
          file_size: 0, // Tamanho desconhecido para uploads temporários convertidos
          uploaded_at: new Date().toISOString(),
        });

      if (insertError) {
        console.error('❌ Erro ao salvar metadados do documento:', insertError);
        continue; // Continua com os outros documentos
      }

      // Preparar atualização da tabela do caso
      const dbFieldName = fieldNameMapping[fieldName] || fieldName.replace(/([A-Z])/g, '_$1').toLowerCase();
      caseUpdateData[dbFieldName] = fileUrl;
    }

    // Atualizar a tabela do caso com os URLs dos documentos
    if (Object.keys(caseUpdateData).length > 0) {
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
        .update(caseUpdateData)
        .eq('id', parseInt(caseId));

      if (updateError) {
        console.error('❌ Erro ao atualizar caso com URLs dos documentos:', updateError);
        return NextResponse.json(
          { error: 'Erro ao atualizar caso com documentos' },
          { status: 500 }
        );
      }
    }

    console.log('✅ Uploads temporários convertidos com sucesso');
    
    return NextResponse.json({
      success: true,
      message: 'Uploads temporários convertidos com sucesso',
      documentsProcessed: documents.length
    });

  } catch (error) {
    console.error('❌ Erro ao converter uploads temporários:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}