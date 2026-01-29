import { NextRequest, NextResponse } from 'next/server'
import { NotificationService } from '@/lib/notification'
import { getSupabaseAdminClient, getSupabaseServerClient } from '@/lib/supabase-server'

function mapDbToFrontend(record: any) {
  if (!record) return record
  return {
    id: record.id,
    moduleType: record.module_type,
    recordId: record.record_id,
    stepIndex: record.step_index,
    responsibleName: record.responsible_name,
    dueDate: record.due_date,
    isDone: !!record.is_done,
    completedAt: record.completed_at,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  }
}

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
    const moduleType = searchParams.get('moduleType')
    const recordId = searchParams.get('recordId')
    const recordIds = searchParams.get('recordIds') // New: supports comma-separated IDs
    const stepIndex = searchParams.get('stepIndex')
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '100'), 200)
    const offset = parseInt(searchParams.get('offset') ?? '0')

    if (!moduleType || (!recordId && !recordIds)) {
      return NextResponse.json({ error: 'moduleType e (recordId ou recordIds) são obrigatórios' }, { status: 400 })
    }

    let query = supabase
      .from('step_assignments')
      .select('*')
      .eq('module_type', moduleType)

    if (recordId) {
      query = query.eq('record_id', parseInt(recordId))
    } else if (recordIds) {
      const ids = recordIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))
      if (ids.length > 0) {
        query = query.in('record_id', ids)
      }
    }

    if (stepIndex !== null && stepIndex !== undefined && stepIndex !== '') {
      query = query.eq('step_index', parseInt(stepIndex))
    } else if (!recordId && !recordIds) {
      query = query.range(offset, offset + limit - 1)
    }

    const { data, error } = await query
    if (error) throw error

    const results = Array.isArray(data) ? data.map(mapDbToFrontend) : (data ? [mapDbToFrontend(data)] : [])
    return NextResponse.json(results, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error: ' + (error?.message || 'unknown') }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = (() => {
      try {
        return getSupabaseAdminClient()
      } catch {
        return getSupabaseServerClient()
      }
    })()
    const body = await request.json()
    const { moduleType, recordId, stepIndex, responsibleName, dueDate, isDone, workflowName } = body

    if (!moduleType || !recordId || stepIndex === undefined) {
      return NextResponse.json({ error: 'moduleType, recordId e stepIndex são obrigatórios' }, { status: 400 })
    }

    const { data: existing, error: existErr } = await supabase
      .from('step_assignments')
      .select('*')
      .eq('module_type', moduleType)
      .eq('record_id', parseInt(recordId))
      .eq('step_index', parseInt(stepIndex))
      .maybeSingle()

    const now = new Date().toISOString()

    if (existErr && existErr.code !== 'PGRST116') throw existErr

    if (existing) {
      const { data, error } = await supabase
        .from('step_assignments')
        .update({
          responsible_name: responsibleName ?? existing.responsible_name ?? null,
          due_date: dueDate ?? existing.due_date ?? null,
          updated_at: now,
        })
        .eq('id', existing.id)
        .select()
        .single()
      if (error) {
        console.error('step_assignments update error:', error)
        throw error
      }

      // Notify if responsible changed
      if (responsibleName && responsibleName !== existing.responsible_name) {
        try {
          // Fetch client name for the notification
          const { data: recordData } = await supabase
            .from(moduleType)
            .select('client_name')
            .eq('id', parseInt(recordId))
            .single();

          const clientName = recordData?.client_name || 'Cliente Desconhecido';
          const stepName = workflowName || `Etapa ${stepIndex}`;

          await NotificationService.createNotification(
            'new_responsible',
            {
              responsibleName,
              clientName,
              workflowName: stepName,
              dueDate: dueDate ?? existing.due_date,
              moduleSlug: moduleType.replace(/_/g, '-'),
              recordId: parseInt(recordId)
            },
            moduleType,
            parseInt(recordId),
            `Novo responsável atribuído: ${responsibleName} para ${stepName} - ${clientName}`
          );
        } catch (e) {
          console.error('Notification error:', e);
        }
      }

      return NextResponse.json(mapDbToFrontend(data), { status: 200 })
    } else {
      const { data, error } = await supabase
        .from('step_assignments')
        .insert({
          module_type: moduleType,
          record_id: parseInt(recordId),
          step_index: parseInt(stepIndex),
          responsible_name: responsibleName ?? null,
          due_date: dueDate ?? null,
          is_done: !!isDone,
          completed_at: isDone ? now : null,
          created_at: now,
          updated_at: now,
        })
        .select()
        .single()
      if (error) {
        console.error('step_assignments insert error:', error)
        throw error
      }

      // Notify if responsible provided
      if (responsibleName) {
        try {
          // Fetch client name for the notification
          const { data: recordData } = await supabase
            .from(moduleType)
            .select('client_name')
            .eq('id', parseInt(recordId))
            .single();

          const clientName = recordData?.client_name || 'Cliente Desconhecido';
          const stepName = workflowName || `Etapa ${stepIndex}`;

          await NotificationService.createNotification(
            'new_responsible',
            {
              responsibleName,
              clientName,
              workflowName: stepName,
              dueDate: dueDate,
              moduleSlug: moduleType.replace(/_/g, '-'),
              recordId: parseInt(recordId)
            },
            moduleType,
            parseInt(recordId),
            `Novo responsável atribuído: ${responsibleName} para ${stepName} - ${clientName}`
          );
        } catch (e) {
          console.error('Notification error:', e);
        }
      }

      return NextResponse.json(mapDbToFrontend(data), { status: 201 })
    }
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error: ' + (error?.message || 'unknown') }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = (() => {
      try {
        return getSupabaseAdminClient()
      } catch {
        return getSupabaseServerClient()
      }
    })()
    const body = await request.json()
    const { moduleType, recordId, stepIndex, responsibleName, dueDate, isDone } = body

    if (!moduleType || !recordId || stepIndex === undefined) {
      return NextResponse.json({ error: 'moduleType, recordId e stepIndex são obrigatórios' }, { status: 400 })
    }

    const now = new Date().toISOString()

    const updateData: any = { updated_at: now }
    if (responsibleName !== undefined) updateData.responsible_name = responsibleName ?? null
    if (dueDate !== undefined) updateData.due_date = dueDate ?? null
    if (isDone !== undefined) {
      updateData.is_done = !!isDone
      updateData.completed_at = isDone ? now : null
    }

    const { data: updated, error } = await supabase
      .from('step_assignments')
      .update(updateData)
      .eq('module_type', moduleType)
      .eq('record_id', parseInt(recordId))
      .eq('step_index', parseInt(stepIndex))
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(mapDbToFrontend(updated), { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error: ' + (error?.message || 'unknown') }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = (() => {
      try {
        return getSupabaseAdminClient()
      } catch {
        return getSupabaseServerClient()
      }
    })()
    const { searchParams } = new URL(request.url)
    const moduleType = searchParams.get('moduleType')
    const recordId = searchParams.get('recordId')
    const stepIndex = searchParams.get('stepIndex')

    if (!moduleType || !recordId || stepIndex === null) {
      return NextResponse.json({ error: 'moduleType, recordId e stepIndex são obrigatórios' }, { status: 400 })
    }

    const { error } = await supabase
      .from('step_assignments')
      .delete()
      .eq('module_type', moduleType)
      .eq('record_id', parseInt(recordId))
      .eq('step_index', parseInt(stepIndex))
    if (error) throw error
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error: ' + (error?.message || 'unknown') }, { status: 500 })
  }
}
