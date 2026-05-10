import { NextRequest, NextResponse } from 'next/server';
import { AIService } from '@/lib/ai-service';

export async function POST(request: NextRequest) {
  try {
    const { text, searchTerm } = await request.json();

    if (!text) {
      return NextResponse.json({ error: 'Texto é obrigatório' }, { status: 400 });
    }

    const result = await AIService.analyzeGazetteExcerpt(text, searchTerm);

    if (!result) {
      return NextResponse.json({ 
        error: 'Falha na análise da IA', 
        details: 'O serviço de IA não retornou um resultado válido. Verifique a conexão com a VPS e se o modelo está carregado.' 
      }, { status: 500 });
    }

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Erro no endpoint de análise de IA:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor', 
      details: error.message 
    }, { status: 500 });
  }
}
