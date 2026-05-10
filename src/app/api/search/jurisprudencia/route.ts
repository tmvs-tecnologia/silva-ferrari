import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');
    const tribunal = searchParams.get('tribunal'); // STF, STJ, TST

    if (!query) {
      return NextResponse.json({ error: "Termo de busca não fornecido." }, { status: 400 });
    }

    // Usando LexML com filtro de tribunal se fornecido
    // Ex: q=termo+AND+fonte:"Superior Tribunal de Justiça"
    let q = query;
    if (tribunal === 'STF') q += ' AND fonte:"Supremo Tribunal Federal"';
    if (tribunal === 'STJ') q += ' AND fonte:"Superior Tribunal de Justiça"';
    if (tribunal === 'TST') q += ' AND fonte:"Tribunal Superior do Trabalho"';

    const url = `https://www.lexml.gov.br/busca/search?f=json&q=${encodeURIComponent(q)}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Erro ao consultar base de jurisprudência." }, { status: response.status });
    }

    const data = await response.json();
    const results = data.docs || data.results || [];

    return NextResponse.json({ 
      success: true, 
      results: results.map((doc: any) => ({
        id: doc.id,
        title: doc.titulo || doc.title,
        ementa: doc.descricao || doc.description || doc.summary,
        date: doc.data || doc.date,
        tribunal: doc.fonte || doc.source,
        url: doc.url || `https://www.lexml.gov.br/busca/exibir?id=${doc.id}`,
        classificacao: doc.tipo || doc.type
      }))
    });

  } catch (error: any) {
    console.error("Erro na API Jurisprudência:", error);
    return NextResponse.json({ error: "Erro interno ao buscar jurisprudência." }, { status: 500 });
  }
}
