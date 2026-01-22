import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdminClient();
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
      'documentosProcessoFinalizado': 'documentos_processo_finalizado_doc',
      'ownerRnm': 'owner_rnm_doc',
      'ownerCpf': 'owner_cpf_doc',
      'declaracaoVizinhos': 'declaracao_vizinhos_doc',
      'matriculaImovel': 'matricula_imovel_doc',
      'contaAgua': 'conta_agua_doc',
      'contaLuz': 'conta_luz_doc',
      'iptu': 'iptu_doc',
      'peticaoInicial': 'peticao_inicial_doc',
      'camposExigencias': 'campos_exigencias_doc',
      'passaporteMae': 'passaporte_mae_doc',
      'passaportePaiRegistral': 'passaporte_pai_registral_doc',
      'passaporteSupostoPai': 'passaporte_suposto_pai_doc',
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
      'justificativaMudancaEmpregadorDoc': 'justificativa_mudanca_empregador_doc',
    };

    // Preparar dados para atualizar a tabela do caso
    const caseUpdateData: any = {};
    
    // Processar cada documento
    for (const doc of documents) {
      const { fieldName, fileUrl } = doc;
      
      // Extrair informações do arquivo da URL
      const fileName = fileUrl.split('/').pop() || 'document';
      const documentDisplayName = fileName;
      
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
    // Para 'acoes_trabalhistas', evitamos atualizar colunas específicas
    if (Object.keys(caseUpdateData).length > 0 && moduleType !== 'acoes_trabalhistas' && moduleType !== 'acoes_criminais') {
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
