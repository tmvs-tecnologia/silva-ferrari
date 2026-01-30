import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase-server';

export async function GET(_request: NextRequest) {
  try {
    const supabase = getSupabaseAdminClient();

    const tables = [
      'acoes_civeis',
      'acoes_trabalhistas',
      'acoes_criminais',
      'compra_venda_imoveis',
      'perda_nacionalidade',
    ];

    const standardCountsPromises = tables.map(async (table) => {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      if (error) throw error;
      return [table, count ?? 0] as const;
    });

    // Count Vistos (excluding Turismo records)
    const vistosCountPromise = supabase
      .from('vistos')
      .select('*', { count: 'exact', head: true })
      .neq('type', 'Turismo')
      .then(({ count, error }) => {
        if (error) throw error;
        return ['vistos', count ?? 0] as const;
      });

    // Count Turismo (from vistos table with type='Turismo')
    const turismoCountPromise = supabase
      .from('vistos')
      .select('*', { count: 'exact', head: true })
      .eq('type', 'Turismo')
      .then(({ count, error }) => {
        if (error) throw error;
        return ['turismo', count ?? 0] as const;
      });

    const results = await Promise.all([
      ...standardCountsPromises,
      vistosCountPromise,
      turismoCountPromise
    ]);

    const byTable = Object.fromEntries(results);
    const total = Object.values(byTable).reduce((sum: number, c: any) => sum + (c as number), 0);

    return NextResponse.json({ total, byTable }, {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  } catch (error: any) {
    console.error('GET /api/processos/count error:', error);
    return NextResponse.json({ error: 'Internal server error: ' + (error?.message || 'unknown') }, { status: 500 });
  }
}
