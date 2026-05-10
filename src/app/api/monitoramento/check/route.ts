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

// POST — Endpoint chamado pelo cron da VPS para verificar todos os processos
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação via secret header
    const cronSecret = request.headers.get('x-cron-secret');
    const expectedSecret = process.env.CRON_SECRET;

    if (expectedSecret && cronSecret !== expectedSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseAdminClient();

    // Buscar todos os processos ativos
    const { data: processes, error: procError } = await supabase
      .from('monitored_processes')
      .select('*')
      .eq('status', 'Ativo');

    if (procError) throw procError;
    if (!processes || processes.length === 0) {
      return NextResponse.json({ message: 'Nenhum processo ativo para verificar.', checked: 0 }, { status: 200 });
    }

    let totalChecked = 0;
    let totalNewMovements = 0;
    const errors: string[] = [];

    for (const process of processes) {
      try {
        // Consultar Datajud
        const processoData = await consultarDatajud(process.numero_processo);
        if (!processoData) {
          errors.push(`Falha ao consultar processo ${process.numero_processo}`);
          continue;
        }

        totalChecked++;

        // Buscar movimentações existentes
        const { data: existingMovements } = await supabase
          .from('process_movements')
          .select('movement_name, movement_date')
          .eq('process_id', process.id);

        const existingSet = new Set(
          (existingMovements || []).map(m => `${m.movement_name}|${m.movement_date}`)
        );

        // Identificar novas movimentações
        const newMovements = (processoData.movimentos || []).filter((mov: any) => {
          const key = `${mov.nome}|${mov.dataHora}`;
          return !existingSet.has(key);
        });

        if (newMovements.length > 0) {
          // Inserir novas movimentações
          const movRecords = newMovements.map((mov: any) => ({
            process_id: process.id,
            numero_processo: process.numero_processo,
            movement_name: mov.nome,
            movement_date: mov.dataHora,
            complementos: mov.complementosTabelados
              ? JSON.stringify(mov.complementosTabelados)
              : null,
            is_new: true,
          }));

          await supabase.from('process_movements').insert(movRecords);

          // Criar alertas
          for (const mov of newMovements) {
            await supabase.from('alerts').insert({
              module_type: 'monitoramento',
              record_id: process.id,
              alert_for: 'monitoramento',
              message: `⚖️ Nova movimentação no processo de ${process.client_name}: ${mov.nome}`,
              is_read: false,
            });
          }

          totalNewMovements += newMovements.length;

          // Atualizar processo
          const allMovs = processoData.movimentos || [];
          const sorted = [...allMovs].sort(
            (a: any, b: any) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime()
          );

          await supabase
            .from('monitored_processes')
            .update({
              last_movement_date: sorted[0]?.dataHora,
              last_movement_name: sorted[0]?.nome,
              movement_count: allMovs.length,
              updated_at: new Date().toISOString(),
            })
            .eq('id', process.id);
        }

        // Rate limiting: esperar 1 segundo entre consultas ao Datajud
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (e) {
        errors.push(`Erro no processo ${process.numero_processo}: ${(e as Error).message}`);
      }
    }

    return NextResponse.json({
      success: true,
      checked: totalChecked,
      newMovements: totalNewMovements,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString(),
    }, { status: 200 });

  } catch (error) {
    console.error('Cron check error:', error);
    return NextResponse.json({ error: 'Erro no monitoramento automático.' }, { status: 500 });
  }
}
