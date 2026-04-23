// app/api/approvals/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import https from 'https'

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

  const headers = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    Accept: 'application/json',
  }

  let body: string
  try {
    body = await httpsGet(hostname, path, headers)
  } catch {
    return NextResponse.json({ error: 'Upstream error' }, { status: 502 })
  }

  let rows: unknown[]
  try { rows = JSON.parse(body) } catch {
    return NextResponse.json({ error: 'Parse error' }, { status: 500 })
  }

  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // notifications_log is not included (no join) — defaults to [] in UI
  const row = rows[0] as Record<string, unknown>
  // DEBUG: log what we actually got from Supabase
  console.log(`[poll] id=${params.id} got status=${row.status} total_rows=${rows.length}`)

  return NextResponse.json({
    ...row,
    notifications_log: [],
    _debug: {
      total_rows: rows.length,
      hostname,
      path,
      all_statuses: (rows as Record<string, unknown>[]).map((r) => r.status),
    },
  }, {
    headers: { 'Cache-Control': 'no-store' },
  })
}
