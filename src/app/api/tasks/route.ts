import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient, getSupabaseServerClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = (() => {
      try {
        return getSupabaseAdminClient()
      } catch {
        return getSupabaseServerClient()
      }
    })()
    const { searchParams } = new URL(request.url)
    const responsible = searchParams.get('responsible')
    const moduleType = searchParams.get('moduleType')
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '200'), 500)
    const offset = parseInt(searchParams.get('offset') ?? '0')

    let query = supabase.from('step_assignments').select('*')

    if (responsible === '__none__') {
      // Somente tarefas sem responsável (null ou string vazia)
      query = query.or('responsible_name.is.null,responsible_name.eq.')
    } else if (responsible) {
      query = query.ilike('responsible_name', `%${responsible}%`)
    }
    if (moduleType) query = query.eq('module_type', moduleType)
    if (from) query = query.gte('due_date', from)
    if (to) query = query.lte('due_date', to)

    query = query.order('due_date', { ascending: true }).range(offset, offset + limit - 1)

    const { data, error } = await query
    if (error) throw error

    type TaskItem = {
      id: number;
      moduleType: string;
      recordId: number;
      stepIndex: number;
      responsibleName?: string;
      dueDate?: string;
      isDone?: boolean;
      completedAt?: string | null;
      createdAt: string;
      updatedAt: string;
      clientName?: string | null;
      caseType?: string | null;
    };

    const tasks: TaskItem[] = (data || []).map((r: any) => ({
      id: r.id,
      moduleType: r.module_type,
      recordId: r.record_id,
      stepIndex: r.step_index,
      responsibleName: r.responsible_name,
      dueDate: r.due_date,
      isDone: !!r.is_done,
      completedAt: r.completed_at ?? null,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      clientName: null,
      caseType: null,
    }))

    // Optionally enrich with clientName for known modules (acoes_civeis, acoes_trabalhistas)
    const byModule: Record<string, TaskItem[]> = {}
    tasks.forEach((t: TaskItem) => {
      byModule[t.moduleType] = byModule[t.moduleType] || []
      byModule[t.moduleType].push(t)
    })

    const enrichCivil = async () => {
      const ids = (byModule['acoes_civeis'] || []).map((t: TaskItem) => t.recordId)
      if (!ids.length) return
      const { data: rows, error: e } = await supabase
        .from('acoes_civeis')
        .select('id, client_name, type')
        .in('id', ids)
      if (e) return
      const map = new Map((rows || []).map((r: any) => [r.id, { clientName: r.client_name, caseType: r.type }]))
      byModule['acoes_civeis'].forEach((t: TaskItem) => {
        const m = map.get(t.recordId)
        t.clientName = m?.clientName || t.clientName || null
        t.caseType = m?.caseType || null
      })
    }

    const enrich = async (table: string, moduleKey: string, idField = 'id', nameField = 'client_name') => {
      const ids = (byModule[moduleKey] || []).map((t: TaskItem) => t.recordId)
      if (!ids.length) return
      const { data: rows, error: e } = await supabase.from(table).select(`${idField}, ${nameField}`).in(idField, ids)
      if (e) return
      const map = new Map((rows || []).map((r: any) => [r[idField], r[nameField]]))
      byModule[moduleKey].forEach((t: TaskItem) => { t.clientName = map.get(t.recordId) || null })
    }

    await enrichCivil()
    await enrich('acoes_trabalhistas', 'acoes_trabalhistas')

    return NextResponse.json(tasks, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error: ' + (error?.message || 'unknown') }, { status: 500 })
  }
}
