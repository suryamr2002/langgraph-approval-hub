// app/api/approvals/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import https from 'https'
import { URL } from 'url'

// Never cache — SDK polls this route to detect status changes
export const dynamic = 'force-dynamic'

/** Fetch using Node's built-in https — completely bypasses Next.js's patched fetch() and its per-instance cache */
function httpsGet(url: string, headers: Record<string, string>): Promise<string> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url)
    const options = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: 'GET',
      headers,
    }
    const req = https.request(options, (res) => {
      let body = ''
      res.on('data', (chunk) => { body += chunk })
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

  const url = `${supabaseUrl}/rest/v1/approvals?select=*,notifications_log(*)&id=eq.${params.id}`
  const headers = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    Accept: 'application/json',
  }

  let body: string
  try {
    body = await httpsGet(url, headers)
  } catch (e) {
    return NextResponse.json({ error: 'Upstream error' }, { status: 502 })
  }

  let rows: unknown[]
  try { rows = JSON.parse(body) } catch {
    return NextResponse.json({ error: 'Parse error' }, { status: 500 })
  }

  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(rows[0], {
    headers: { 'Cache-Control': 'no-store' },
  })
}
