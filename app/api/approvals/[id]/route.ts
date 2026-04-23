// app/api/approvals/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { unstable_noStore as noStore } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase'

// Never cache — SDK polls this route to detect status changes
export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Belt-and-suspenders: explicitly opt out of Next.js data cache
  noStore()

  const { data, error } = await supabaseAdmin
    .from('approvals')
    .select('*, notifications_log(*)')
    .eq('id', params.id)
    .single()

  if (error) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json(data, {
    headers: { 'Cache-Control': 'no-store' },
  })
}
