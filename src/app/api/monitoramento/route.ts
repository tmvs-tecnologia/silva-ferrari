import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase-server';

const DATAJUD_API_KEY = process.env.DATAJUD_API_KEY || "APIKey cDZHYzlZa0JadVREZDJCendQbXY6SkJlTzNjLV9TRENyQk1RdnFKZGRQdw==";
const DATAJUD_BASE_URL = "https://api-publica.datajud.cnj.jus.br";

function getTribunalIndex(npu: string): string {
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
  if (j === '4') return `api_publica_trf${parseInt(tr, 10)}`;
  if (j === '5') return `api_publica_trt${parseInt(tr, 10)}`;
  return 'api_publica_*';
}

async function consultarDatajud(numeroProcesso: string) {
  const cleanNpu = numeroProcesso.replace(/\D/g, '');
  const index = getTribunalIndex(cleanNpu);
  const url = `${DATAJUD_BASE_URL}/${index}/_search`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': DATAJUD_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: { match: { numeroProcesso: cleanNpu } } }),
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) return null;

  const data = await response.json();
  if (data.hits?.hits?.length > 0) {
    return data.hits.hits[0]._source;
  }
  return null;
}

// GET — Lista todos os processos monitorados
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdminClient();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'Ativo';

    let query = supabase
      .from('monitored_processes')
      .select('*')
      .order('last_movement_date', { ascending: false, nullsFirst: false });

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json(data || [], { status: 200 });
  } catch (error) {
    console.error('GET monitoramento error:', error);
    return NextResponse.json({ error: 'Erro ao buscar processos monitorados.' }, { status: 500 });
  }
}

// POST — Cadastrar novo processo para monitoramento
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseAdminClient();
    const body = await request.json();
    const { numeroProcesso, clientName } = body;

    if (!numeroProcesso || !clientName) {
      return NextResponse.json({ error: 'Número do processo e nome do cliente são obrigatórios.' }, { status: 400 });
    }

    const cleanNpu = numeroProcesso.replace(/\D/g, '');
    if (cleanNpu.length !== 20) {
      return NextResponse.json({ error: 'O número do processo deve conter 20 dígitos.' }, { status: 400 });
    }

    // Verificar duplicata
    const { data: existing } = await supabase
      .from('monitored_processes')
      .select('id')
      .eq('numero_processo', cleanNpu)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: 'Este processo já está sendo monitorado.' }, { status: 409 });
    }

    // Consultar Datajud para obter metadados
    let processoData: any = null;
    try {
      processoData = await consultarDatajud(cleanNpu);
    } catch (e) {
      console.warn('Datajud temporariamente indisponível, cadastrando sem metadados:', e);
    }

    // Montar dados do processo
    const processRecord: any = {
      numero_processo: cleanNpu,
      client_name: clientName.trim(),
      status: 'Ativo',
      movement_count: 0,
    };

    if (processoData) {
      processRecord.classe = processoData.classe?.nome || null;
      processRecord.orgao_julgador = processoData.orgaoJulgador?.nome || null;
      processRecord.assuntos = processoData.assuntos?.map((a: any) => a.nome).join(', ') || null;
      processRecord.data_ajuizamento = processoData.dataAjuizamento || null;
      processRecord.sistema = processoData.sistema?.nome || null;

      // Calcular última movimentação
      if (processoData.movimentos?.length > 0) {
        const sorted = [...processoData.movimentos].sort(
          (a: any, b: any) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime()
        );
        processRecord.last_movement_date = sorted[0].dataHora;
        processRecord.last_movement_name = sorted[0].nome;
        processRecord.movement_count = sorted.length;
      }
    }

    // Inserir processo
    const { data: newProcess, error: insertError } = await supabase
      .from('monitored_processes')
      .insert(processRecord)
      .select()
      .single();

    if (insertError) throw insertError;

    // Inserir movimentações existentes
    if (processoData?.movimentos?.length > 0) {
      const movements = processoData.movimentos.map((mov: any) => ({
        process_id: newProcess.id,
        numero_processo: cleanNpu,
        movement_name: mov.nome,
        movement_date: mov.dataHora,
        complementos: mov.complementosTabelados
          ? JSON.stringify(mov.complementosTabelados)
          : null,
        is_new: false, // Movimentações já existentes no cadastro não são "novas"
      }));

      const { error: movError } = await supabase
        .from('process_movements')
        .insert(movements);

      if (movError) {
        console.error('Erro ao inserir movimentações:', movError);
      }
    }

    return NextResponse.json({
      success: true,
      process: newProcess,
      movementCount: processoData?.movimentos?.length || 0,
    }, { status: 201 });

  } catch (error) {
    console.error('POST monitoramento error:', error);
    return NextResponse.json({ error: 'Erro ao cadastrar processo: ' + (error as Error).message }, { status: 500 });
  }
}
