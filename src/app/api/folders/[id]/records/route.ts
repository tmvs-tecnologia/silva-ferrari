import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabaseAdmin = getSupabaseAdminClient();
    const { id } = await params;
    const folderId = parseInt(id);
    if (isNaN(folderId)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 });

    const { searchParams } = new URL(request.url);
    const includeDetails = searchParams.get('includeDetails') === 'true';

    const { data: items, error } = await supabaseAdmin
      .from('folder_records')
      .select('*')
      .eq('folder_id', folderId)
      .order('created_at', { ascending: false });
    if (error) throw error;

    if (!items || items.length === 0) return NextResponse.json([]);

    if (includeDetails) {
      // Agrupar por módulo para buscar detalhes de forma eficiente
      const moduleGroups: Record<string, number[]> = {};
      items.forEach((item: any) => {
        if (!moduleGroups[item.module_type]) moduleGroups[item.module_type] = [];
        moduleGroups[item.module_type].push(item.record_id);
      });

      const detailsMap: Record<string, any> = {};

      for (const [module, ids] of Object.entries(moduleGroups)) {
        let table = '';
        if (module === 'turismo' || module === 'vistos') table = 'vistos';
        else if (module === 'acoes-civeis') table = 'acoes_civeis';
        else if (module === 'acoes-criminais') table = 'acoes_criminais';
        else if (module === 'acoes-trabalhistas') table = 'acoes_trabalhistas';
        else if (module === 'compra-venda') table = 'compra_venda_imoveis';
        else if (module === 'perda-nacionalidade') table = 'perda_nacionalidade';

        if (table) {
          const { data: records, error: detailsError } = await supabaseAdmin
            .from(table)
            .select('*')
            .in('id', ids);

          if (!detailsError && records) {
            records.forEach((r: any) => {
              detailsMap[`${module}_${r.id}`] = r;
            });
          }
        }
      }

      // Filtrar apenas itens que possuem detalhes (exclui órfãos) e mesclar
      const mergedItems = items
        .filter((item: any) => detailsMap[`${item.module_type}_${item.record_id}`])
        .map((item: any) => ({
          ...item,
          details: detailsMap[`${item.module_type}_${item.record_id}`]
        }));

      return NextResponse.json(mergedItems);
    }

    return NextResponse.json(items || []);
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno: ' + (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabaseAdmin = getSupabaseAdminClient();
    const { id } = await params;
    const folderId = parseInt(id);
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

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabaseAdmin = getSupabaseAdminClient();
    const { id } = await params;
    const folderId = parseInt(id);
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
