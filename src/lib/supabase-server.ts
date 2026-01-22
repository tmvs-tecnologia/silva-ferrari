import 'server-only'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let cachedAdminClient: SupabaseClient | null = null
let cachedAnonServerClient: SupabaseClient | null = null

export function getSupabaseAdminClient(): SupabaseClient {
  if (cachedAdminClient) return cachedAdminClient
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase env vars are not configured.')
  }
  cachedAdminClient = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } })
  return cachedAdminClient
}

export function getSupabaseServerClient(): SupabaseClient {
  if (cachedAnonServerClient) return cachedAnonServerClient
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !anonKey) {
    throw new Error('Supabase env vars are not configured.')
  }
  cachedAnonServerClient = createClient(supabaseUrl, anonKey, { auth: { persistSession: false } })
  return cachedAnonServerClient
}
