import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    const { documentId } = await params;
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