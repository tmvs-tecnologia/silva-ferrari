import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey)
    const { searchParams } = new URL(request.url)
    const responsible = searchParams.get('responsible')
    const moduleType = searchParams.get('moduleType')
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '200'), 500)
    const offset = parseInt(searchParams.get('offset') ?? '0')

    let query = supabase.from('step_assignments').select('*')

    if (responsible) query = query.ilike('responsible_name', `%${responsible}%`)
    if (moduleType) query = query.eq('module_type', moduleType)
    if (from) query = query.gte('due_date', from)
    if (to) query = query.lte('due_date', to)

    query = query.order('due_date', { ascending: true }).range(offset, offset + limit - 1)

    const { data, error } = await query
    if (error) throw error

    const tasks = (data || []).map((r: any) => ({
      id: r.id,
      moduleType: r.module_type,
      recordId: r.record_id,
      stepIndex: r.step_index,
      responsibleName: r.responsible_name,
      dueDate: r.due_date,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }))

    // Optionally enrich with clientName for known modules (acoes_civeis, acoes_trabalhistas)
    const byModule: Record<string, any[]> = {}
    tasks.forEach(t => {
      byModule[t.moduleType] = byModule[t.moduleType] || []
      byModule[t.moduleType].push(t)
    })

    const enrichCivil = async () => {
      const ids = (byModule['acoes_civeis'] || []).map(t => t.recordId)
      if (!ids.length) return
      const { data: rows, error: e } = await supabase
        .from('acoes_civeis')
        .select('id, client_name, type')
        .in('id', ids)
      if (e) return
      const map = new Map((rows || []).map((r: any) => [r.id, { clientName: r.client_name, caseType: r.type }]))
      byModule['acoes_civeis'].forEach(t => {
        const m = map.get(t.recordId)
        t.clientName = m?.clientName || t.clientName || null
        t.caseType = m?.caseType || null
      })
    }

    const enrich = async (table: string, moduleKey: string, idField = 'id', nameField = 'client_name') => {
      const ids = (byModule[moduleKey] || []).map(t => t.recordId)
      if (!ids.length) return
      const { data: rows, error: e } = await supabase.from(table).select(`${idField}, ${nameField}`).in(idField, ids)
      if (e) return
      const map = new Map((rows || []).map((r: any) => [r[idField], r[nameField]]))
      byModule[moduleKey].forEach(t => { t.clientName = map.get(t.recordId) || null })
    }

    await enrichCivil()
    await enrich('acoes_trabalhistas', 'acoes_trabalhistas')

    return NextResponse.json(tasks, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error: ' + (error?.message || 'unknown') }, { status: 500 })
  }
}
