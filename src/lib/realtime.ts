import { getSupabaseBrowserClient } from '@/lib/supabase'

type ChangeEvent = 'insert' | 'update' | 'delete'

export function subscribeTable(
  opts: {
    channelName?: string
    table: string
    events: ChangeEvent[]
    filter?: string
    onChange: (payload: any) => void
  }
) {
  const { channelName, table, events, filter, onChange } = opts
  const supabase = getSupabaseBrowserClient()
  if (!supabase) return null
  const channel = supabase.channel(channelName || `rt-${table}-${Math.random().toString(36).slice(2)}`)
  events.forEach((ev) => {
    channel.on('postgres_changes', { event: ev, schema: 'public', table, filter }, onChange)
  })
  channel.subscribe()
  return channel
}

export function unsubscribe(channel: { unsubscribe: () => void } | null | undefined) {
  if (channel && typeof channel.unsubscribe === 'function') channel.unsubscribe()
}
