import { NextResponse } from 'next/server';

const API_KEY = process.env.DATAJUD_API_KEY || "APIKey cDZHYzlZa0JadVREZDJCendQbXY6SkJlTzNjLV9TRENyQk1RdnFKZGRQdw==";
const BASE_URL = "https://api-publica.datajud.cnj.jus.br";

const getTribunalIndex = (npu: string) => {
  const cleanNpu = npu.replace(/\D/g, '');
  if (cleanNpu.length !== 20) return 'api_publica_*';

  const j = cleanNpu.substring(13, 14);
  const tr = cleanNpu.substring(14, 16);

  if (j === '8') {
    const tjs: Record<string, string> = {
      '01': 'tjac', '02': 'tjal', '03': 'tjap', '04': 'tjam', '05': 'tjba',
      '06': 'tjce', '07': 'tjdft', '08': 'tjes', '09': 'tjgo', '10': 'tjma',
      '11': 'tjmt', '12': 'tjms', '13': 'tjmg', '14': 'tjpa', '15': 'tjpb',
      '16': 'tjpr', '17': 'tjpe', '18': 'tjpi', '19': 'tjrj', '20': 'tjrn',
      '21': 'tjrs', '22': 'tjro', '23': 'tjrr', '24': 'tjsc', '25': 'tjse',
      '26': 'tjsp', '27': 'tjto'
    };
    return tjs[tr] ? `api_publica_${tjs[tr]}` : 'api_publica_*';
  }
  if (j === '4') {
    return `api_publica_trf${parseInt(tr, 10)}`;
  }
  if (j === '5') {
    return `api_publica_trt${parseInt(tr, 10)}`;
  }

  return 'api_publica_*';
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { numeroProcesso } = body;

    if (!numeroProcesso) {
      return NextResponse.json({ error: "Número do processo não fornecido." }, { status: 400 });
    }

    const cleanNpu = numeroProcesso.replace(/\D/g, '');
    if (cleanNpu.length !== 20) {
      return NextResponse.json({ error: "Número do processo deve conter 20 dígitos." }, { status: 400 });
    }

    const index = getTribunalIndex(cleanNpu);
    const url = `${BASE_URL}/${index}/_search`;

    const payload = {
      query: {
        match: {
          numeroProcesso: cleanNpu
        }
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      // Adicionando um timeout pequeno (Datajud às vezes demora muito e na Vercel podemos dar timeout de função)
      signal: AbortSignal.timeout(15000), 
    });

    if (!response.ok) {
      console.error("Erro na API do DataJud:", response.status, await response.text());
      return NextResponse.json({ error: "Erro ao consultar API do Datajud." }, { status: response.status });
    }

    const data = await response.json();

    if (data.hits && data.hits.hits && data.hits.hits.length > 0) {
      return NextResponse.json({ success: true, processo: data.hits.hits[0]._source });
    } else {
      return NextResponse.json({ success: false, message: "Processo não encontrado ou em segredo de justiça." }, { status: 404 });
    }

  } catch (error: any) {
    console.error("Erro interno ao buscar processo:", error);
    if (error.name === 'TimeoutError') {
      return NextResponse.json({ error: "Tempo limite de conexão excedido. Tente novamente mais tarde." }, { status: 504 });
    }
    return NextResponse.json({ error: "Erro interno no servidor." }, { status: 500 });
  }
}
