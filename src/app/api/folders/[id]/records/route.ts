import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const folderId = parseInt(params.id);
    if (isNaN(folderId)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 });

    const { data: items, error } = await supabaseAdmin
      .from('folder_records')
      .select('*')
      .eq('folder_id', folderId)
      .order('created_at', { ascending: false });
    if (error) throw error;

    return NextResponse.json(items || []);
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno: ' + (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const folderId = parseInt(params.id);
    if (isNaN(folderId)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    const body = await request.json();
    const recordId = parseInt(String(body.recordId));
    const moduleType = String(body.moduleType || '').trim();
    if (isNaN(recordId) || !moduleType) return NextResponse.json({ error: 'recordId e moduleType são obrigatórios' }, { status: 400 });

    const { data, error } = await supabaseAdmin
      .from('folder_records')
      .insert({ folder_id: folderId, record_id: recordId, module_type: moduleType })
      .select('*')
      .single();
    if (error) {
      // Ignora duplicatas
      if ((error as any).code === '23505') {
        return NextResponse.json({ success: true, duplicated: true });
      }
      throw error;
    }
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno: ' + (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const folderId = parseInt(params.id);
    if (isNaN(folderId)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    const { searchParams } = new URL(request.url);
    const recordId = parseInt(String(searchParams.get('recordId')));
    if (isNaN(recordId)) return NextResponse.json({ error: 'recordId é obrigatório' }, { status: 400 });

    const { data, error } = await supabaseAdmin
      .from('folder_records')
      .delete()
      .eq('folder_id', folderId)
      .eq('record_id', recordId)
      .select('*')
      .single();
    if (error) throw error;
    return NextResponse.json({ success: true, removed: data });
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno: ' + (error as Error).message }, { status: 500 });
  }
}

