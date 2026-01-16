import { NextRequest, NextResponse } from 'next/server';
// @ts-ignore
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      filePath, // Public URL or Storage Path? Current implementation expects Public URL for 'file_path' column
      fileName, 
      fileType, 
      fileSize, 
      caseId, 
      entityId,
      moduleType, 
      fieldName, 
      clientName 
    } = body;

    const recordId = caseId || entityId;

    if (!recordId || !fieldName || !filePath) {
      return NextResponse.json(
        { error: 'Dados incompletos para registro' },
        { status: 400 }
      );
    }

    console.log('💾 Registrando metadados:', { fileName, recordId, fieldName });

    // Insert into documents table
    const { data: insertedDoc, error: insertError } = await supabaseAdmin
      .from('documents')
      .insert({
        module_type: moduleType || 'acoes_civeis',
        record_id: parseInt(recordId),
        client_name: clientName || 'Cliente Desconhecido',
        field_name: fieldName,
        document_name: fileName,
        file_name: fileName,
        file_path: filePath, // Should be the Public URL
        file_type: fileType,
        file_size: fileSize,
        uploaded_at: new Date().toISOString(),
      })
      .select('*')
      .single();

    if (insertError) {
      console.error('❌ Erro ao inserir documento:', insertError);
      throw insertError;
    }

    // Update parent table
    // Map field names to correct database column names (copied mapping)
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

    const skipModuleUpdate = moduleType === 'acoes_trabalhistas' || moduleType === 'acoes_criminais';

    if (fieldName !== 'documentoAnexado' && !skipModuleUpdate) {
      const dbFieldName = fieldNameMapping[fieldName] || fieldName.replace(/([A-Z])/g, '_$1').toLowerCase();
      const updateData: any = {};
      updateData[dbFieldName] = filePath;

      let tableName = 'acoes_civeis';
      if (moduleType === 'compra_venda_imoveis') tableName = 'compra_venda_imoveis';
      else if (moduleType === 'perda_nacionalidade') tableName = 'perda_nacionalidade';
      else if (moduleType === 'vistos') tableName = 'vistos';

      const { error: updateError } = await supabaseAdmin
        .from(tableName)
        .update(updateData)
        .eq('id', parseInt(recordId));
      
      if (updateError) {
        console.error('❌ Erro ao atualizar tabela pai:', updateError);
        // We don't fail the request here because the doc is already registered
      }
    }

    return NextResponse.json({ success: true, document: insertedDoc });

  } catch (error) {
    console.error('❌ Erro no registro:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
