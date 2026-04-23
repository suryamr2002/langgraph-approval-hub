// app/api/approvals/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import https from 'https'
import { createClient } from '@supabase/supabase-js'

// Never cache — SDK polls this route to detect status changes
export const dynamic = 'force-dynamic'

/** Fetch using Node's built-in https — completely bypasses Next.js's patched fetch() */
function httpsGet(
  hostname: string,
  path: string,
  headers: Record<string, string>
): Promise<string> {
  return new Promise((resolve, reject) => {
    const req = https.request({ hostname, path, method: 'GET', headers }, (res) => {
      let body = ''
      res.on('data', (chunk: string) => { body += chunk })
      res.on('end', () => resolve(body))
    })
    req.on('error', reject)
    req.end()
  })
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim()
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim()

  // Extract hostname (e.g. rfupdnwalegceczhghjn.supabase.co)
  const hostname = supabaseUrl.replace('https://', '').replace('http://', '').trim()
  // Build path manually — avoid URL class which percent-encodes * and ()
  const path = `/rest/v1/approvals?select=id,agent_name,action_description,agent_reasoning,assignee,assignee_type,escalate_to,timeout_minutes,status,decided_by,decision_note,created_at,decided_at,expires_at&id=eq.${params.id}`

  const reqHeaders = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    Accept: 'application/json',
    // Tell any upstream proxy/edge (Supabase CDN, Cloudflare, etc.) not to serve cached response
    'Cache-Control': 'no-cache, no-store',
    Pragma: 'no-cache',
  }

  // --- Source A: Node https (completely bypasses Next.js fetch patch) ---
  let httpsStatus: string | null = null
  let httpsRows = 0
  let rawBody = ''
  try {
    rawBody = await httpsGet(hostname, path, reqHeaders)
    const rows = JSON.parse(rawBody) as Record<string, unknown>[]
    httpsRows = Array.isArray(rows) ? rows.length : -1
    httpsStatus = Array.isArray(rows) && rows.length > 0 ? String(rows[0].status) : null
  } catch {
    httpsStatus = 'ERROR'
  }

  // --- Source B: Fresh Supabase client (per-request, not module-level) ---
  // Uses Node's native fetch via a brand-new client with explicit no-store
  let sdkStatus: string | null = null
  try {
    const freshClient = createClient(supabaseUrl, serviceKey, {
      global: {
        fetch: (input: RequestInfo | URL, init?: RequestInit) =>
          fetch(input, { ...init, cache: 'no-store' }),
      },
    })
    const { data } = await freshClient
      .from('approvals')
      .select('id, status')
      .eq('id', params.id)
      .single()
    sdkStatus = data?.status ?? null
  } catch {
    sdkStatus = 'ERROR'
  }

  console.log(`[poll] id=${params.id} https=${httpsStatus} sdk=${sdkStatus} https_rows=${httpsRows}`)

  // Use whichever source returns a decided status (approved/rejected/expired)
  // If both agree on "pending", return pending. If one says decided, trust it.
  const decidedStatuses = ['approved', 'rejected', 'expired', 'escalated']
  const resolvedStatus =
    decidedStatuses.includes(httpsStatus ?? '') ? httpsStatus :
    decidedStatuses.includes(sdkStatus ?? '') ? sdkStatus :
    httpsStatus ?? sdkStatus ?? 'pending'

  // Parse the main row from the Node https result
  let row: Record<string, unknown> = {}
  try {
    const rows = JSON.parse(rawBody) as Record<string, unknown>[]
    if (Array.isArray(rows) && rows.length > 0) {
      row = rows[0]
    }
  } catch { /* row stays empty */ }

  if (!row.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({
    ...row,
    status: resolvedStatus,       // override with the most reliable status
    notifications_log: [],
    _debug: {
      https_status: httpsStatus,
      sdk_status: sdkStatus,
      https_rows: httpsRows,
      hostname,
      path,
    },
  }, {
    headers: { 'Cache-Control': 'no-store' },
  })
}
