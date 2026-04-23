// app/api/interrupt/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendNotifications } from '@/lib/notifications'
import type { InterruptPayload } from '@/types'

// Simple in-memory rate limiter: max 30 requests per IP per 5 minutes
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 30
const WINDOW_MS = 5 * 60 * 1000

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return true
  }
  if (entry.count >= RATE_LIMIT) return false
  entry.count++
  return true
}

function authorized(req: NextRequest): boolean {
  const header = req.headers.get('authorization') ?? ''
  const token = (process.env.API_SECRET_TOKEN ?? '').trim()
  return header === `Bearer ${token}`
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Rate limit exceeded. Max 30 requests per 5 minutes.' }, { status: 429 })
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
