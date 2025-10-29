import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ caseId: string }> }
) {
  try {
    const { caseId } = await params;
    const { searchParams } = new URL(request.url);
    const moduleType = searchParams.get('moduleType') || 'acoes_civeis';

    if (!caseId) {
      return NextResponse.json(
        { error: 'ID do caso é obrigatório' },
        { status: 400 }
      );
    }

    const caseIdNum = parseInt(caseId);
    if (isNaN(caseIdNum)) {
      return NextResponse.json(
        { error: 'ID do caso inválido' },
        { status: 400 }
      );
    }

    // Buscar documentos do caso
    const { data: documents, error } = await supabaseAdmin
      .from('documents')
      .select('*')
      .eq('module_type', moduleType)
      .eq('record_id', caseIdNum)
      .order('uploaded_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar documentos:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar documentos' },
        { status: 500 }
      );
    }

    return NextResponse.json(documents || []);
  } catch (error) {
    console.error('Erro inesperado:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}