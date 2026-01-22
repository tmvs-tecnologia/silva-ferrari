import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdminClient();
    const { searchParams } = new URL(request.url);
    const moduleType = searchParams.get('moduleType') || undefined;

    let query = supabaseAdmin.from('folders').select('*').order('updated_at', { ascending: false });
    if (moduleType) query = query.ilike('module_type', moduleType);

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno: ' + (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdminClient();
    const body = await request.json();
    const name = String(body.name || '').trim();
    const moduleType = String(body.moduleType || '').trim();
    if (!name || !moduleType) {
      return NextResponse.json({ error: 'Nome e módulo são obrigatórios' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('folders')
      .insert({ name, module_type: moduleType })
      .select('*')
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno: ' + (error as Error).message }, { status: 500 });
  }
}
