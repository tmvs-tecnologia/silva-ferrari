import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getFilePath, BUCKET_NAME } from '@/lib/supabase';

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
  guiaPagaFile: 'documentos-iniciais',
  
  // Exame DNA
  resultadoExameDnaFile: 'exame-dna',
  
  // Procuração
  procuracaoAnexadaFile: 'procuracao',
  
  // Petição
  peticaoAnexadaFile: 'peticao',
  
  // Processo
  processoAnexadoFile: 'processo',
  
  // Exigências
  documentosFinaisAnexadosFile: 'exigencias',
  
  // Finalização
  documentosProcessoFinalizadoFile: 'finalizacao',
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const caseId = formData.get('caseId') as string;
    const entityId = formData.get('entityId') as string;
    const entityType = formData.get('entityType') as string;
    const fieldName = formData.get('fieldName') as string;
    const moduleType = formData.get('moduleType') as string || entityType || 'acoes_civeis'; // Default to acoes_civeis for backward compatibility

    // Use either caseId or entityId as the identifier
    const recordId = caseId || entityId;

    console.log('🔹 Upload iniciado:', { caseId, entityId, recordId, fieldName, moduleType, fileName: file?.name, fileSize: file?.size });

    // Validate required fields - allow temporary uploads without caseId/fieldName
    if (!file) {
      return NextResponse.json(
        { error: "Arquivo é obrigatório" },
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

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
    ];

    if (!allowedTypes.includes(file.type)) {
      console.error('❌ Tipo de arquivo não permitido:', file.type);
      return NextResponse.json(
        { error: 'Tipo de arquivo não permitido. Use: PDF, DOC, DOCX, JPG, PNG' },
        { status: 400 }
      );
    }

    // Generate file path
    const timestamp = Date.now();
    const originalName = file.name;
    const extension = originalName.split('.').pop();
    const sanitizedFileName = `${fieldName}_${timestamp}.${extension}`;
    
    // Construct file path based on upload type
    let filePath: string;
    
    if (isTemporaryUpload) {
      // For temporary uploads, use a simple path with timestamp
      filePath = `temp/${timestamp}_${sanitizedFileName}`;
    } else {
      // Get step folder from field name
      const stepFolder = FIELD_TO_STEP_MAP[fieldName] || 'outros';
      
      if (moduleType === 'compra_venda_imoveis') {
        filePath = getFilePath.compraVenda(parseInt(recordId), stepFolder, sanitizedFileName);
      } else {
        // Default to acoesCiveis for backward compatibility
        filePath = getFilePath.acoesCiveis(parseInt(recordId), stepFolder, sanitizedFileName);
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
        contentType: file.type,
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
        fileName: originalName,
        url: publicUrl,
        filePath: filePath,
        temporary: true
      });
    }

    // Save document metadata to database (only for permanent uploads)
    console.log('💾 Salvando metadados no banco de dados...');
    const { error: insertError } = await supabaseAdmin
      .from('documents')
      .insert({
        module_type: moduleType,
        record_id: parseInt(recordId),
        file_name: originalName,
        file_path: publicUrl,
        file_type: file.type,
        file_size: file.size,
        uploaded_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error('❌ Erro ao salvar metadados:', insertError);
      throw insertError;
    }

    // Update the case with the file URL
    const updateData: any = {};
    updateData[fieldName] = publicUrl;

    console.log(`🔄 Atualizando registro do módulo ${moduleType}...`);
    
    // Update the appropriate table based on moduleType
    // Convert camelCase field name to snake_case for Supabase
    const snakeCaseFieldName = fieldName.replace(/([A-Z])/g, '_$1').toLowerCase();
    const supabaseUpdateData: any = {};
    supabaseUpdateData[snakeCaseFieldName] = publicUrl;

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
      throw updateError;
    }

    console.log('✅ Upload completo!');

    return NextResponse.json({
      success: true,
      fileName: originalName,
      fileUrl: publicUrl,
      filePath: filePath,
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
        .eq('module_type', moduleType)
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