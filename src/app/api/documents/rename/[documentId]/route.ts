import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase-server';

export async function PUT(
  request: Request,
  context: any
) {
  try {
    const supabaseAdmin = getSupabaseAdminClient();
    const { documentId } = await context.params;
    const { document_name } = await request.json();

    if (!document_name || !document_name.trim()) {
      return NextResponse.json(
        { error: 'Nome do documento é obrigatório' },
        { status: 400 }
      );
    }

    // Update document name in database
    const { data, error } = await supabaseAdmin
      .from('documents')
      .update({ document_name: document_name.trim() })
      .eq('id', parseInt(documentId))
      .select()
      .single();

    if (error) {
      console.error('Erro ao renomear documento:', error);
      return NextResponse.json(
        { error: 'Erro ao renomear documento' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro ao renomear documento:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
