import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const cpf = searchParams.get('cpf')?.replace(/\D/g, '');

    if (!cpf || cpf.length !== 11) {
      return NextResponse.json({ error: "CPF inválido ou não fornecido. Certifique-se de digitar 11 dígitos." }, { status: 400 });
    }

    // Token vindo das variáveis de ambiente
    const token = process.env.CPFHUB_TOKEN;
    const url = `https://cpfhub.io/api/v1/cpf/${cpf}?token=${token}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (response.status === 401 || response.status === 403) {
      return NextResponse.json({ error: "Chave da API CPFhub inválida ou expirada." }, { status: response.status });
    }

    if (response.status === 404) {
      return NextResponse.json({ error: "CPF não localizado na base de dados." }, { status: 404 });
    }

    if (!response.ok) {
      return NextResponse.json({ error: "Erro ao consultar provedor CPFhub." }, { status: response.status });
    }

    const data = await response.json();

    // Verificação baseada no padrão comum dessas APIs
    if (data.erro || data.status === false) {
      return NextResponse.json({ error: data.mensagem || "CPF não encontrado." }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      data: {
        nome: data.nome,
        cpf: data.cpf,
        nascimento: data.nascimento,
        mae: data.mae,
        situacao: data.situacao,
        genero: data.genero,
        // Campos adicionais comuns que podem vir no CPFhub
        titulo_eleitor: data.titulo_eleitor,
        protocolo: data.protocolo,
        origem: "CPFhub.io"
      }
    });

  } catch (error: any) {
    console.error("Erro na API CPFhub:", error);
    return NextResponse.json({ error: "Erro interno ao buscar dados da pessoa." }, { status: 500 });
  }
}
