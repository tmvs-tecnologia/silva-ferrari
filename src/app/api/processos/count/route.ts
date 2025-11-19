import { NextRequest, NextResponse } from 'next/server';
// @ts-ignore - Supabase types will be resolved in production
import { createClient } from '@supabase/supabase-js';

export async function GET(_request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const tables = [
      'acoes_civeis',
      'acoes_trabalhistas',
      'acoes_criminais',
      'compra_venda_imoveis',
      'perda_nacionalidade',
      'vistos',
    ];

    const counts = await Promise.all(
      tables.map(async (table) => {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        if (error) throw error;
        return count ?? 0;
      })
    );

    const total = counts.reduce((sum, c) => sum + c, 0);

    return NextResponse.json({ total, byTable: Object.fromEntries(tables.map((t, i) => [t, counts[i]])) }, {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  } catch (error: any) {
    console.error('GET /api/processos/count error:', error);
    return NextResponse.json({ error: 'Internal server error: ' + (error?.message || 'unknown') }, { status: 500 });
  }
}