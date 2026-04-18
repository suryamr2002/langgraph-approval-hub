// app/api/interrupt/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendNotifications } from '@/lib/notifications'
import type { InterruptPayload } from '@/types'

function authorized(req: NextRequest): boolean {
  const header = req.headers.get('authorization') ?? ''
  return header === `Bearer ${process.env.API_SECRET_TOKEN}`
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body: InterruptPayload = await req.json()

  if (!body.agent_name || !body.action_description || !body.assignee || !body.assignee_type) {
    return NextResponse.json(
      { error: 'Missing required fields: agent_name, action_description, assignee, assignee_type' },
      { status: 400 }
    )
  }

  const timeoutMinutes = body.timeout_minutes ?? 60
  const expiresAt = new Date(Date.now() + timeoutMinutes * 60 * 1000).toISOString()

  const { data, error } = await supabaseAdmin
    .from('approvals')
    .insert({
      agent_name: body.agent_name,
      action_description: body.action_description,
      agent_reasoning: body.agent_reasoning ?? null,
      assignee: body.assignee,
      assignee_type: body.assignee_type,
      escalate_to: body.escalate_to ?? null,
      timeout_minutes: timeoutMinutes,
      expires_at: expiresAt,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  try {
    await sendNotifications(data)
  } catch {
    // Notification failure should not block the approval creation
    console.error('Failed to send notifications for approval', data.id)
  }

  return NextResponse.json({ approval_id: data.id }, { status: 201 })
}
