import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json({ error: "Termo de busca não fornecido." }, { status: 400 });
    }

    // LexML API - f=json for JSON response
    const url = `https://www.lexml.gov.br/busca/search?f=json&q=${encodeURIComponent(query)}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'SilvaFerrari-LegalSystem/1.0',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Erro ao consultar LexML." }, { status: response.status });
    }

    const data = await response.json();
    
    // LexML JSON structure usually has a 'docs' array in the root or under a key
    // We normalize the response for our frontend
    const results = data.docs || data.results || [];

    return NextResponse.json({ 
      success: true, 
      results: results.map((doc: any) => ({
        id: doc.id,
        title: doc.titulo || doc.title,
        description: doc.descricao || doc.description || doc.summary,
        date: doc.data || doc.date,
        source: doc.fonte || doc.source,
        url: doc.url || `https://www.lexml.gov.br/busca/exibir?id=${doc.id}`,
        type: doc.tipo || doc.type
      }))
    });

  } catch (error: any) {
    console.error("Erro na API LexML:", error);
    return NextResponse.json({ error: "Erro interno ao buscar no LexML." }, { status: 500 });
  }
}
