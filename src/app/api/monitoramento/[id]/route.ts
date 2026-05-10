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
    headers: { 'Authorization': DATAJUD_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: { match: { numeroProcesso: cleanNpu } } }),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) return null;
  const data = await response.json();
  return data.hits?.hits?.length > 0 ? data.hits.hits[0]._source : null;
}

// GET — Retorna detalhes de um processo + suas movimentações
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = getSupabaseAdminClient();

    const { data: process, error: processError } = await supabase
      .from('monitored_processes')
      .select('*')
      .eq('id', parseInt(id))
      .single();

    if (processError || !process) {
      return NextResponse.json({ error: 'Processo não encontrado.' }, { status: 404 });
    }

    const { data: movements, error: movError } = await supabase
      .from('process_movements')
      .select('*')
      .eq('process_id', parseInt(id))
      .order('movement_date', { ascending: false });

    if (movError) throw movError;

    return NextResponse.json({
      process,
      movements: movements || [],
    }, { status: 200 });
  } catch (error) {
    console.error('GET monitoramento/[id] error:', error);
    return NextResponse.json({ error: 'Erro ao buscar processo.' }, { status: 500 });
  }
}

// POST — Atualizar manualmente (refresh) consultando Datajud
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = getSupabaseAdminClient();

    // Buscar processo
    const { data: process, error: procError } = await supabase
      .from('monitored_processes')
      .select('*')
      .eq('id', parseInt(id))
      .single();

    if (procError || !process) {
      return NextResponse.json({ error: 'Processo não encontrado.' }, { status: 404 });
    }

    // Consultar Datajud
    const processoData = await consultarDatajud(process.numero_processo);
    if (!processoData) {
      return NextResponse.json({ error: 'Não foi possível consultar o Datajud. Tente novamente.' }, { status: 502 });
    }

    // Buscar movimentações já salvas
    const { data: existingMovements } = await supabase
      .from('process_movements')
      .select('movement_name, movement_date')
      .eq('process_id', parseInt(id));

    const existingSet = new Set(
      (existingMovements || []).map(m => `${m.movement_name}|${m.movement_date}`)
    );

    // Filtrar novas movimentações
    const newMovements = (processoData.movimentos || []).filter((mov: any) => {
      const key = `${mov.nome}|${mov.dataHora}`;
      return !existingSet.has(key);
    });

    let newCount = 0;

    if (newMovements.length > 0) {
      const movRecords = newMovements.map((mov: any) => ({
        process_id: parseInt(id),
        numero_processo: process.numero_processo,
        movement_name: mov.nome,
        movement_date: mov.dataHora,
        complementos: mov.complementosTabelados
          ? JSON.stringify(mov.complementosTabelados)
          : null,
        is_new: true,
      }));

      const { error: insertErr } = await supabase
        .from('process_movements')
        .insert(movRecords);

      if (insertErr) throw insertErr;
      newCount = newMovements.length;

      // Criar alerta para cada nova movimentação
      for (const mov of newMovements) {
        await supabase.from('alerts').insert({
          module_type: 'monitoramento',
          record_id: parseInt(id),
          alert_for: 'monitoramento',
          message: `Nova movimentação no processo de ${process.client_name}: ${mov.nome}`,
          is_read: false,
        });
      }
    }

    // Atualizar metadados do processo
    const allMovs = processoData.movimentos || [];
    const sorted = [...allMovs].sort(
      (a: any, b: any) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime()
    );

    await supabase
      .from('monitored_processes')
      .update({
        last_movement_date: sorted[0]?.dataHora || process.last_movement_date,
        last_movement_name: sorted[0]?.nome || process.last_movement_name,
        movement_count: allMovs.length,
        classe: processoData.classe?.nome || process.classe,
        orgao_julgador: processoData.orgaoJulgador?.nome || process.orgao_julgador,
        updated_at: new Date().toISOString(),
      })
      .eq('id', parseInt(id));

    return NextResponse.json({
      success: true,
      newMovements: newCount,
      totalMovements: allMovs.length,
    }, { status: 200 });

  } catch (error) {
    console.error('POST monitoramento/[id] refresh error:', error);
    return NextResponse.json({ error: 'Erro ao atualizar processo.' }, { status: 500 });
  }
}

// DELETE — Remover processo do monitoramento
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = getSupabaseAdminClient();

    const { error } = await supabase
      .from('monitored_processes')
      .delete()
      .eq('id', parseInt(id));

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Processo removido do monitoramento.' }, { status: 200 });
  } catch (error) {
    console.error('DELETE monitoramento/[id] error:', error);
    return NextResponse.json({ error: 'Erro ao remover processo.' }, { status: 500 });
  }
}
