// app/api/notifications/test/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

export async function GET() {
  return NextResponse.json({
    email: !!process.env.RESEND_API_KEY,
    slack: !!process.env.SLACK_WEBHOOK_URL,
  })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const channel = body.channel as 'email' | 'slack'

  if (channel === 'email') {
    const to = (body.to as string | undefined)?.trim()
    if (!to) {
      return NextResponse.json({ error: 'Email address required' }, { status: 400 })
    }
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 422 })
    }
    const resend = new Resend(process.env.RESEND_API_KEY)
    const { error } = await resend.emails.send({
      from: 'Approval Hub <noreply@approvals.dev>',
      to,
      subject: 'Approval Hub — test notification',
      html: `
        <h2>✅ Notifications are working!</h2>
        <p>This is a test email from your <strong>LangGraph Approval Hub</strong>.</p>
        <p>When an agent triggers an approval, the right person gets notified here automatically.</p>
      `,
    })
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  }

  if (channel === 'slack') {
    if (!process.env.SLACK_WEBHOOK_URL) {
      return NextResponse.json({ error: 'SLACK_WEBHOOK_URL not configured' }, { status: 422 })
    }
    const res = await fetch(process.env.SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: '✅ *Approval Hub* — test notification. Slack is connected and working!',
      }),
    })
    if (!res.ok) {
      return NextResponse.json({ error: 'Slack webhook returned non-OK status' }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'channel must be email or slack' }, { status: 400 })
}
