import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Helper function to convert snake_case to camelCase
function mapDbFieldsToFrontend(record: any) {
  if (!record) return record;
  
  return {
    id: record.id,
    clientName: record.client_name,
    type: record.type,
    currentStep: record.current_step,
    status: record.status,
    notes: record.notes,
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
    guiaPaga: record.guia_paga,
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
    const id = searchParams.get('id');

    // Single record by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const { data: record, error } = await supabase
        .from('acoes_civeis')
        .select('*')
        .eq('id', parseInt(id))
        .single();

      if (error) {
        console.error('Supabase error:', error);
        return NextResponse.json({ 
          error: 'Record not found',
          code: 'NOT_FOUND'
        }, { status: 404 });
      }

      // Map database fields to frontend format
      const mappedRecord = mapDbFieldsToFrontend(record);

      return NextResponse.json(mappedRecord, { status: 200 });
    }

    // List with pagination, search, and filters
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
      query = query.ilike('client_name', `%${search}%`);
    }

    if (type) {
      query = query.eq('type', type);
    }

    if (status) {
      query = query.eq('status', status);
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

    return NextResponse.json(mappedResults, { status: 200 });
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
      documentosProcessoFinalizadoFile
    } = body;

    // Validate required fields
    if (!clientName || clientName.trim() === '') {
      return NextResponse.json({ 
        error: "clientName is required and cannot be empty",
        code: "MISSING_CLIENT_NAME" 
      }, { status: 400 });
    }

    if (!type || type.trim() === '') {
      return NextResponse.json({ 
        error: "type is required and cannot be empty",
        code: "MISSING_TYPE" 
      }, { status: 400 });
    }

    // Prepare insert data with defaults
    const insertData: any = {
      client_name: clientName.trim(),
      type: type.trim(),
      current_step: currentStep !== undefined ? currentStep : 0,
      status: status || 'Em Andamento',
    };

    // Add optional fields if provided
    if (rnmMae !== undefined) insertData.rnm_mae = rnmMae;
    if (rnmPai !== undefined) insertData.rnm_pai = rnmPai;
    if (rnmSupostoPai !== undefined) insertData.rnm_suposto_pai = rnmSupostoPai;
    if (cpfMae !== undefined) insertData.cpf_mae = cpfMae;
    if (cpfPai !== undefined) insertData.cpf_pai = cpfPai;
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
    
    // Add document URL fields if provided
    if (rnmMaeFile !== undefined) insertData.rnm_mae_doc = rnmMaeFile;
    if (rnmPaiFile !== undefined) insertData.rnm_pai_doc = rnmPaiFile;
    if (rnmSupostoPaiFile !== undefined) insertData.rnm_suposto_pai_doc = rnmSupostoPaiFile;
    if (cpfMaeFile !== undefined) insertData.cpf_mae_doc = cpfMaeFile;
    if (cpfPaiFile !== undefined) insertData.cpf_pai_doc = cpfPaiFile;
    if (certidaoNascimentoFile !== undefined) insertData.certidao_nascimento_doc = certidaoNascimentoFile;
    if (comprovanteEnderecoFile !== undefined) insertData.comprovante_endereco_doc = comprovanteEnderecoFile;
    if (passaporteFile !== undefined) insertData.passaporte_doc = passaporteFile;
    if (guiaPagaFile !== undefined) insertData.guia_paga_doc = guiaPagaFile;
    if (resultadoExameDnaFile !== undefined) insertData.resultado_exame_dna_doc = resultadoExameDnaFile;
    if (procuracaoAnexadaFile !== undefined) insertData.procuracao_anexada_doc = procuracaoAnexadaFile;
    if (peticaoAnexadaFile !== undefined) insertData.peticao_anexada_doc = peticaoAnexadaFile;
    if (processoAnexadoFile !== undefined) insertData.processo_anexado_doc = processoAnexadoFile;
    if (documentosFinaisAnexadosFile !== undefined) insertData.documentos_finais_anexados_doc = documentosFinaisAnexadosFile;
    if (documentosProcessoFinalizadoFile !== undefined) insertData.documentos_processo_finalizado_doc = documentosProcessoFinalizadoFile;

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

    return NextResponse.json(newRecord, { status: 201 });
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

    // Check if record exists
    const { data: existing, error: existingError } = await supabase
      .from('acoes_civeis')
      .select('id')
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
      documentosProcessoFinalizadoFile
    } = body;

    // Prepare update data
    const updateData: any = {};

    // Add fields to update if provided
    if (clientName !== undefined) updateData.client_name = clientName.trim();
    if (type !== undefined) updateData.type = type.trim();
    if (currentStep !== undefined) updateData.current_step = currentStep;
    if (status !== undefined) updateData.status = status;
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

    return NextResponse.json(updated, { status: 200 });
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