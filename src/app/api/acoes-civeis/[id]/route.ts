import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { id } = params;

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Fetch the record
    const { data, error } = await supabase
      .from('acoes_civeis')
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

      const mapped = {
        id: data.id,
        clientName: data.client_name,
        type: data.type,
        currentStep: data.current_step,
        status: data.status,
        notes: data.notes,
        ownerName: (data as any).owner_name,
        ownerCpf: (data as any).owner_cpf,
        ownerRnm: (data as any).owner_rnm,
        ownerRnmDoc: (data as any).owner_rnm_doc,
        ownerCpfDoc: (data as any).owner_cpf_doc,
        endereco: (data as any).endereco,
        declaracaoVizinhosDoc: (data as any).declaracao_vizinhos_doc,
        matriculaImovelDoc: (data as any).matricula_imovel_doc,
        contaAguaDoc: (data as any).conta_agua_doc,
        contaLuzDoc: (data as any).conta_luz_doc,
        iptuDoc: (data as any).iptu_doc,
      nomeMae: data.nome_mae,
      nomePaiRegistral: data.nome_pai_registral,
      nomeSupostoPai: data.nome_suposto_pai,
      nomeCrianca: data.nome_crianca,
      rnmMae: data.rnm_mae,
      rnmMaeDoc: data.rnm_mae_doc,
      rnmPai: data.rnm_pai,
      rnmPaiDoc: data.rnm_pai_doc,
      rnmSupostoPai: data.rnm_suposto_pai,
      rnmSupostoPaiDoc: data.rnm_suposto_pai_doc,
      cpfMae: data.cpf_mae,
      cpfPai: data.cpf_pai,
      cpfSupostoPai: data.cpf_suposto_pai,
      certidaoNascimento: data.certidao_nascimento,
      certidaoNascimentoDoc: data.certidao_nascimento_doc,
      comprovanteEndereco: data.comprovante_endereco,
      comprovanteEnderecoDoc: data.comprovante_endereco_doc,
      passaporte: data.passaporte,
      passaporteDoc: data.passaporte_doc,
      passaporteMaeDoc: data.passaporte_mae_doc,
      passaportePaiRegistralDoc: data.passaporte_pai_registral_doc,
      passaporteSupostoPaiDoc: data.passaporte_suposto_pai_doc,
      guiaPaga: data.guia_paga,
      numeroProtocolo: data.numero_protocolo,
      dataExameDna: data.data_exame_dna,
      localExameDna: (data as any).local_exame_dna,
      observacoesExameDna: (data as any).observacoes_exame_dna,
      resultadoExameDna: data.resultado_exame_dna,
      resultadoExameDnaDoc: data.resultado_exame_dna_doc,
      procuracaoAnexada: data.procuracao_anexada,
      procuracaoAnexadaDoc: data.procuracao_anexada_doc,
      peticaoAnexada: data.peticao_anexada,
      peticaoAnexadaDoc: data.peticao_anexada_doc,
      processoAnexado: data.processo_anexado,
      processoAnexadoDoc: data.processo_anexado_doc,
      documentosFinaisAnexados: data.documentos_finais_anexados,
      documentosFinaisAnexadosDoc: data.documentos_finais_anexados_doc,
      documentosProcessoFinalizadoDoc: data.documentos_processo_finalizado_doc,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
    return NextResponse.json(mapped, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { id } = params;
    const body = await request.json();

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if record exists
    const { data: existing, error: existError } = await supabase
      .from('acoes_civeis')
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

    const updateData: any = {};
    if (body.clientName !== undefined) updateData.client_name = String(body.clientName).trim();
    if (body.type !== undefined) updateData.type = String(body.type).trim();
    if (body.currentStep !== undefined) updateData.current_step = body.currentStep;
    if (body.status !== undefined) updateData.status = String(body.status).trim();
    if (body.notes !== undefined) updateData.notes = body.notes ?? null;
    if (body.ownerName !== undefined) updateData.owner_name = body.ownerName ?? null;
    if (body.ownerCpf !== undefined) updateData.owner_cpf = body.ownerCpf ?? null;
    if (body.ownerRnm !== undefined) updateData.owner_rnm = body.ownerRnm ?? null;
    if (body.endereco !== undefined) updateData.endereco = body.endereco ?? null;
    if (body.nomeMae !== undefined) updateData.nome_mae = body.nomeMae ?? null;
    if (body.nomePaiRegistral !== undefined) updateData.nome_pai_registral = body.nomePaiRegistral ?? null;
    if (body.nomeSupostoPai !== undefined) updateData.nome_suposto_pai = body.nomeSupostoPai ?? null;
    if (body.nomeCrianca !== undefined) updateData.nome_crianca = body.nomeCrianca ?? null;
    if (body.rnmMae !== undefined) updateData.rnm_mae = body.rnmMae ?? null;
    if (body.rnmPai !== undefined) updateData.rnm_pai = body.rnmPai ?? null;
    if (body.rnmSupostoPai !== undefined) updateData.rnm_suposto_pai = body.rnmSupostoPai ?? null;
    if (body.cpfMae !== undefined) updateData.cpf_mae = body.cpfMae ?? null;
    if (body.cpfPai !== undefined) updateData.cpf_pai = body.cpfPai ?? null;
    if (body.cpfSupostoPai !== undefined) updateData.cpf_suposto_pai = body.cpfSupostoPai ?? null;
    if (body.certidaoNascimento !== undefined) updateData.certidao_nascimento = body.certidaoNascimento ?? null;
    if (body.comprovanteEndereco !== undefined) updateData.comprovante_endereco = body.comprovanteEndereco ?? null;
    if (body.passaporte !== undefined) updateData.passaporte = body.passaporte ?? null;
    if (body.guiaPaga !== undefined) updateData.guia_paga = body.guiaPaga ?? null;
    if (body.numeroProtocolo !== undefined) updateData.numero_protocolo = body.numeroProtocolo ?? null;
    if (body.dataExameDna !== undefined) updateData.data_exame_dna = body.dataExameDna ?? null;
    if (body.localExameDna !== undefined) updateData.local_exame_dna = body.localExameDna ?? null;
    if (body.observacoesExameDna !== undefined) updateData.observacoes_exame_dna = body.observacoesExameDna ?? null;
    if (body.resultadoExameDna !== undefined) updateData.resultado_exame_dna = body.resultadoExameDna ?? null;
    if (body.procuracaoAnexada !== undefined) updateData.procuracao_anexada = body.procuracaoAnexada ?? null;
    if (body.peticaoAnexada !== undefined) updateData.peticao_anexada = body.peticaoAnexada ?? null;
    if (body.processoAnexado !== undefined) updateData.processo_anexado = body.processoAnexado ?? null;
    if (body.documentosFinaisAnexados !== undefined) updateData.documentos_finais_anexados = body.documentosFinaisAnexados ?? null;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('acoes_civeis')
      .update(updateData)
      .eq('id', parseInt(id))
      .select()
      .single();

    if (error) {
      throw error;
    }

    const mapped = {
      id: data.id,
      clientName: data.client_name,
      type: data.type,
      currentStep: data.current_step,
      status: data.status,
      notes: data.notes,
      nomeMae: data.nome_mae,
      nomePaiRegistral: data.nome_pai_registral,
      nomeSupostoPai: data.nome_suposto_pai,
      rnmMae: data.rnm_mae,
      rnmMaeDoc: data.rnm_mae_doc,
      rnmPai: data.rnm_pai,
      rnmPaiDoc: data.rnm_pai_doc,
      rnmSupostoPai: data.rnm_suposto_pai,
      rnmSupostoPaiDoc: data.rnm_suposto_pai_doc,
      cpfMae: data.cpf_mae,
      cpfPai: data.cpf_pai,
      certidaoNascimento: data.certidao_nascimento,
      certidaoNascimentoDoc: data.certidao_nascimento_doc,
      comprovanteEndereco: data.comprovante_endereco,
      comprovanteEnderecoDoc: data.comprovante_endereco_doc,
      passaporte: data.passaporte,
      passaporteDoc: data.passaporte_doc,
      guiaPaga: data.guia_paga,
      numeroProtocolo: data.numero_protocolo,
      dataExameDna: data.data_exame_dna,
      localExameDna: (data as any).local_exame_dna,
      observacoesExameDna: (data as any).observacoes_exame_dna,
      resultadoExameDna: data.resultado_exame_dna,
      resultadoExameDnaDoc: data.resultado_exame_dna_doc,
      procuracaoAnexada: data.procuracao_anexada,
      procuracaoAnexadaDoc: data.procuracao_anexada_doc,
      peticaoAnexada: data.peticao_anexada,
      peticaoAnexadaDoc: data.peticao_anexada_doc,
      processoAnexado: data.processo_anexado,
      processoAnexadoDoc: data.processo_anexado_doc,
      documentosFinaisAnexados: data.documentos_finais_anexados,
      documentosFinaisAnexadosDoc: data.documentos_finais_anexados_doc,
      documentosProcessoFinalizadoDoc: data.documentos_processo_finalizado_doc,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
    return NextResponse.json(mapped, { status: 200 });
  } catch (error) {
    console.error('PATCH error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { id } = params;

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if record exists and get it before deletion
    const { data: existing, error: existError } = await supabase
      .from('acoes_civeis')
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

    // Delete the record
    const { error } = await supabase
      .from('acoes_civeis')
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
