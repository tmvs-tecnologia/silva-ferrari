import { NextResponse } from 'next/server';
import { JurisprudenciaService } from '@/lib/jurisprudencia';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');
    const court = searchParams.get('court') || 'stj';
    const page = parseInt(searchParams.get('page') || '0');

    if (searchParams.get('listCourts') === 'true') {
      const courts = await JurisprudenciaService.listCourts();
      return NextResponse.json({ success: true, courts });
    }

    if (!query) {
      return NextResponse.json({ error: "Termo de busca não fornecido." }, { status: 400 });
    }

    const result = await JurisprudenciaService.search(court, query, page);

    if (!result.success) {
      return NextResponse.json({ 
        success: false, 
        error: result.error || "Erro ao consultar Jurisprudencias.ai" 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      meta: result.meta
    });

  } catch (error: any) {
    console.error("Erro na API de Jurisprudência:", error);
    return NextResponse.json({ error: "Erro interno ao buscar jurisprudência." }, { status: 500 });
  }
}

