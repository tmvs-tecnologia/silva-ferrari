import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase-server';

export async function DELETE(
  request: Request,
  context: any
) {
  try {
    const supabaseAdmin = getSupabaseAdminClient();
    const { documentId } = await context.params;

    if (!documentId) {
      return NextResponse.json(
        { error: 'ID do documento é obrigatório' },
        { status: 400 }
      );
    }

    const docIdNum = parseInt(documentId);
    if (isNaN(docIdNum)) {
      return NextResponse.json(
        { error: 'ID do documento inválido' },
        { status: 400 }
      );
    }

    // Primeiro, buscar o documento para obter o file_path
    const { data: document, error: fetchError } = await supabaseAdmin
      .from('documents')
      .select('file_path')
      .eq('id', docIdNum)
      .single();

    if (fetchError || !document) {
      return NextResponse.json(
        { error: 'Documento não encontrado' },
        { status: 404 }
      );
    }

    // Extrair o caminho do arquivo do storage
    const filePath = document.file_path;
    let storagePath = '';
    
    if (filePath && filePath.includes('/storage/v1/object/public/')) {
      // Extrair o caminho após o bucket name
      const pathParts = filePath.split('/storage/v1/object/public/');
      if (pathParts.length > 1) {
        const fullPath = pathParts[1];
        const bucketAndPath = fullPath.split('/');
        if (bucketAndPath.length > 1) {
          storagePath = bucketAndPath.slice(1).join('/');
        }
      }
    }

    // Excluir o arquivo do storage se existir
    if (storagePath) {
      const { error: storageError } = await supabaseAdmin.storage
        .from('juridico-documentos')
        .remove([storagePath]);

      if (storageError) {
        console.warn('Erro ao excluir arquivo do storage:', storageError);
        // Continua mesmo se não conseguir excluir do storage
      }
    }

    // Excluir o registro do banco de dados
    const { error: deleteError } = await supabaseAdmin
      .from('documents')
      .delete()
      .eq('id', docIdNum);

    if (deleteError) {
      console.error('Erro ao excluir documento:', deleteError);
      return NextResponse.json(
        { error: 'Erro ao excluir documento' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Documento excluído com sucesso' 
    });

  } catch (error) {
    console.error('Erro inesperado:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
