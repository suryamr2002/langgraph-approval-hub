// app/api/demo/seed/route.ts
import { NextResponse } from 'next/server'
import { seedDemoData } from '@/lib/demo-seed'

export async function POST() {
  if (process.env.NEXT_PUBLIC_DEMO_MODE !== 'true') {
    return NextResponse.json({ error: 'Demo mode is not enabled' }, { status: 403 })
  }
  try {
    await seedDemoData()
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
