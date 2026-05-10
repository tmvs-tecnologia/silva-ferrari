import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const cnpj = searchParams.get('cnpj')?.replace(/\D/g, '');

    if (!cnpj || cnpj.length !== 14) {
      return NextResponse.json({ error: "CNPJ inválido ou não fornecido." }, { status: 400 });
    }

    // ReceitaWS API (Gratuito tem limite de 3 req/min)
    const url = `https://receitaws.com.br/v1/cnpj/${cnpj}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (response.status === 429) {
      return NextResponse.json({ error: "Limite de consultas excedido (ReceitaWS). Tente novamente em um minuto." }, { status: 429 });
    }

    if (!response.ok) {
      return NextResponse.json({ error: "Erro ao consultar ReceitaWS." }, { status: response.status });
    }

    const data = await response.json();

    if (data.status === "ERROR") {
      return NextResponse.json({ error: data.message || "CNPJ não encontrado." }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      data: {
        nome: data.nome,
        fantasia: data.fantasia,
        cnpj: data.cnpj,
        abertura: data.abertura,
        situacao: data.situacao,
        atividade_principal: data.atividade_principal?.[0]?.text,
        natureza_juridica: data.natureza_juridica,
        logradouro: data.logradouro,
        numero: data.numero,
        complemento: data.complemento,
        bairro: data.bairro,
        municipio: data.municipio,
        uf: data.uf,
        cep: data.cep,
        email: data.email,
        telefone: data.telefone,
        capital_social: data.capital_social,
        qsa: data.qsa // Sócios
      }
    });

  } catch (error: any) {
    console.error("Erro na API ReceitaWS:", error);
    return NextResponse.json({ error: "Erro interno ao buscar dados da empresa." }, { status: 500 });
  }
}
