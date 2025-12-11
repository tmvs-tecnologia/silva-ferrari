import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const idNum = parseInt(params.id);
    if (isNaN(idNum)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    const { data, error } = await supabaseAdmin
      .from('folders')
      .select('*')
      .eq('id', idNum)
      .single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno: ' + (error as Error).message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const idNum = parseInt(params.id);
    if (isNaN(idNum)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    const body = await request.json();
    const name = String(body.name || '').trim();
    if (!name) return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 });
    const { data, error } = await supabaseAdmin
      .from('folders')
      .update({ name, updated_at: new Date().toISOString() })
      .eq('id', idNum)
      .select('*')
      .single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno: ' + (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const idNum = parseInt(params.id);
    if (isNaN(idNum)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    const { data, error } = await supabaseAdmin
      .from('folders')
      .delete()
      .eq('id', idNum)
      .select('*')
      .single();
    if (error) throw error;
    return NextResponse.json({ success: true, folder: data });
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno: ' + (error as Error).message }, { status: 500 });
  }
}

