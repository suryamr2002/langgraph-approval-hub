// app/api/demo/seed/route.ts
import { NextResponse } from 'next/server'
import { seedDemoData } from '@/lib/demo-seed'

// POST — called by the owner via the ↺ reset button (live mode only, button hidden in demo mode)
export async function POST() {
  try {
    await seedDemoData()
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// GET — called by Vercel Cron (authenticated via CRON_SECRET)
export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    await seedDemoData()
    return NextResponse.json({ ok: true, reset: 'demo data seeded by cron' })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
