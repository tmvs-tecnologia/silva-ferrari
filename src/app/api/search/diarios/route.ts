import { NextResponse } from 'next/server';
import { QueridoDiarioService } from '@/lib/querido-diario';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');
    const page = parseInt(searchParams.get('page') || '0');
    const territoryId = searchParams.get('territory_id') || undefined;
    const citySearch = searchParams.get('city');

    // Se houver parâmetro 'city', busca os territórios disponíveis
    if (citySearch) {
      const territoryResult = await QueridoDiarioService.searchTerritories(citySearch);
      return NextResponse.json(territoryResult);
    }

    if (!query && !territoryId) {
      return NextResponse.json({ error: "Termo de busca não fornecido." }, { status: 400 });
    }

    const result = await QueridoDiarioService.search(query || "", page, 10, territoryId);

    if (!result.success) {
      return NextResponse.json({ 
        success: false, 
        error: result.error || "Erro ao consultar Querido Diário" 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: result.data?.gazettes || [],
      total: result.data?.total_gazettes || 0
    });

  } catch (error: any) {
    console.error("Erro na API de Diários:", error);
    return NextResponse.json({ error: "Erro interno ao buscar diários oficiais." }, { status: 500 });
  }
}
