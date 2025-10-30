import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('📱 Enviando dados para webhook n8n:', body);

    // Fazer a requisição para o webhook do n8n
    const response = await fetch('https://n8n.intelektus.tech/webhook/acoes-civeis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      console.error('❌ Erro na resposta do webhook n8n:', response.status, response.statusText);
      return NextResponse.json(
        { error: 'Erro ao enviar para webhook n8n', status: response.status },
        { status: response.status }
      );
    }

    const result = await response.json();
    console.log('✅ Resposta do webhook n8n:', result);

    return NextResponse.json({ 
      success: true, 
      message: 'Notificação enviada com sucesso',
      n8nResponse: result 
    });

  } catch (error) {
    console.error('❌ Erro ao processar webhook:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
}