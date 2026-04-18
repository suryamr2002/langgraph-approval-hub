// app/api/teams/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('teams')
    .select('*')
    .order('name')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  if (!body.name || !Array.isArray(body.members)) {
    return NextResponse.json({ error: 'name and members[] required' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('teams')
    .upsert({ name: body.name, members: body.members }, { onConflict: 'name' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
