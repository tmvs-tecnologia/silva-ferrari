import { NextResponse } from 'next/server';
import { LexmlService } from '@/lib/lexml';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');
    const start = parseInt(searchParams.get('start') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!query) {
      return NextResponse.json({ error: "Termo de busca não fornecido." }, { status: 400 });
    }

    const result = await LexmlService.search(query, start, limit);

    if (!result.success) {
      return NextResponse.json({ 
        success: false, 
        error: result.error || "Erro ao consultar LexML via SRU." 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      total: result.totalResults,
      results: result.results
    });

  } catch (error: any) {
    console.error("Erro na API LexML:", error);
    return NextResponse.json({ error: "Erro interno ao buscar no LexML." }, { status: 500 });
  }
}

