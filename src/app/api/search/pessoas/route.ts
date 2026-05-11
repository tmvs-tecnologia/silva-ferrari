import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const cpf = searchParams.get('cpf')?.replace(/\D/g, '');

    if (!cpf || cpf.length !== 11) {
      return NextResponse.json({ error: "CPF inválido ou não fornecido. Certifique-se de digitar 11 dígitos." }, { status: 400 });
    }

    // --- PROVEDOR 1: CPFhub.io ---
    const tokenCpfHub = process.env.CPFHUB_TOKEN;
    let personData = null;
    let source = "";

    if (tokenCpfHub) {
      try {
        const urlCpfHub = `https://cpfhub.io/api/v1/cpf/${cpf}?token=${tokenCpfHub}`;
        const responseCpfHub = await fetch(urlCpfHub, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          signal: AbortSignal.timeout(8000),
        });

        if (responseCpfHub.ok) {
          const data = await responseCpfHub.json();
          if (!data.erro && data.status !== false) {
            personData = {
              nome: data.nome,
              cpf: data.cpf,
              nascimento: data.nascimento,
              mae: data.mae,
              situacao: data.situacao,
              genero: data.genero,
              titulo_eleitor: data.titulo_eleitor,
              protocolo: data.protocolo,
            };
            source = "CPFhub.io";
          }
        }
      } catch (e) {
        console.error("Erro primário (CPFhub):", e);
      }
    }

    // --- PROVEDOR 2: API-CPF (apicpf.com) [FALLBACK] ---
    if (!personData) {
      const apiKeyApiCpf = process.env.APICPF_KEY;
      if (apiKeyApiCpf) {
        try {
          const urlApiCpf = `https://apicpf.com/api/consulta?cpf=${cpf}&api_key=${apiKeyApiCpf}`;
          const responseApiCpf = await fetch(urlApiCpf, {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
            signal: AbortSignal.timeout(8000),
          });

          if (responseApiCpf.ok) {
            const data = await responseApiCpf.json();
            // Mapeamento baseado no padrão do apicpf.com
            if (data && !data.error) {
              personData = {
                nome: data.nome,
                cpf: data.cpf || cpf,
                nascimento: data.nascimento || data.data_nascimento,
                mae: data.mae || data.nome_mae,
                situacao: data.situacao || data.situacao_cadastral,
                genero: data.genero || data.sexo,
                titulo_eleitor: data.titulo_eleitor,
                protocolo: data.protocolo || data.id,
              };
              source = "API-CPF (apicpf.com)";
            }
          }
        } catch (e) {
          console.error("Erro secundário (API-CPF):", e);
        }
      }
    }

    if (!personData) {
      return NextResponse.json({ error: "CPF não localizado em nenhum dos provedores disponíveis." }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      data: {
        ...personData,
        origem: source
      }
    });

  } catch (error: any) {
    console.error("Erro geral na API de Pessoas:", error);
    return NextResponse.json({ error: "Erro interno ao buscar dados da pessoa." }, { status: 500 });
  }
}
