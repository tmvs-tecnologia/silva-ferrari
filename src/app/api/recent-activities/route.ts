import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey)
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 100)

    const tables = [
      { key: 'acoes_civeis', table: 'acoes_civeis' },
      { key: 'acoes_trabalhistas', table: 'acoes_trabalhistas' },
      { key: 'acoes_criminais', table: 'acoes_criminais' },
      { key: 'compra_venda_imoveis', table: 'compra_venda_imoveis' },
      { key: 'perda_nacionalidade', table: 'perda_nacionalidade' },
      { key: 'vistos', table: 'vistos' },
    ]

    const createdPromises = tables.map(async (t) => {
      const { data } = await supabase.from(t.table).select('id, client_name, type, created_at').order('created_at', { ascending: false }).limit(20)
      return (data || []).map((r: any) => ({
        id: `${t.key}-created-${r.id}`,
        moduleType: t.key,
        recordId: r.id,
        title: r.client_name,
        type: 'criado',
        time: r.created_at,
        detail: r.type || null,
      }))
    })

    const finalizedPromises = tables.map(async (t) => {
      const { data } = await supabase.from(t.table).select('id, client_name, type, status, updated_at').eq('status', 'Finalizado').order('updated_at', { ascending: false }).limit(20)
      return (data || []).map((r: any) => ({
        id: `${t.key}-finalized-${r.id}`,
        moduleType: t.key,
        recordId: r.id,
        title: r.client_name,
        type: 'finalizado',
        time: r.updated_at,
        detail: r.type || null,
      }))
    })

    const { data: assignments } = await supabase
      .from('step_assignments')
      .select('id, module_type, record_id, step_index, responsible_name, due_date, updated_at')
      .order('updated_at', { ascending: false })
      .limit(50)

    const assignmentActivities = (assignments || []).map((r: any) => ({
      id: `assign-${r.id}`,
      moduleType: r.module_type,
      recordId: r.record_id,
      title: r.responsible_name || 'Responsável definido',
      type: 'responsavel_definido',
      time: r.updated_at,
      detail: r.due_date || null,
      stepIndex: r.step_index,
    }))

    const createdLists = await Promise.all(createdPromises)
    const finalizedLists = await Promise.all(finalizedPromises)
    const merged = [...createdLists.flat(), ...finalizedLists.flat(), ...assignmentActivities]
    merged.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())

    const limited = merged.slice(0, limit)
    return NextResponse.json(limited, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error: ' + (error?.message || 'unknown') }, { status: 500 })
  }
}

