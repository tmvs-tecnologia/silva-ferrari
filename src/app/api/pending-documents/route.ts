import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase-server'

export async function GET() {
    try {
        const supabase = getSupabaseServerClient()
        const { data, error } = await supabase
            .from('pending_documents')
            .select('*')
            .gt('missing_count', 0)
            .order('client_name', { ascending: true })

        if (error) throw error

        return NextResponse.json(data || [])
    } catch (error: any) {
        console.error('[API_PENDING_DOCUMENTS_GET]', error)
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
    }
}
