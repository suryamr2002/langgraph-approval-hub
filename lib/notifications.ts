// lib/notifications.ts
import { Resend } from 'resend'
import type { Approval } from '@/types'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

function dashboardUrl(approvalId: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  return `${base}/approval/${approvalId}`
}

async function sendSlack(text: string): Promise<void> {
  const url = process.env.SLACK_WEBHOOK_URL
  if (!url) return
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  })
}

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (!resend) return
  await resend.emails.send({
    from: 'Approval Hub <noreply@approvals.dev>',
    to,
    subject,
    html,
  })
}

export async function sendNotifications(approval: Approval): Promise<void> {
  const url = dashboardUrl(approval.id)
  const slackText = `🤖 *${approval.agent_name}* needs approval\n>${approval.action_description}\n<${url}|View & Decide>`

  const emailHtml = `
    <h2>${approval.agent_name} needs your approval</h2>
    <p>${approval.action_description}</p>
    <a href="${url}" style="background:#4ade80;color:#000;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:bold;">View &amp; Decide</a>
  `

  const recipient = approval.assignee

  await Promise.allSettled([
    sendSlack(slackText),
    sendEmail(recipient, `Action required: ${approval.agent_name}`, emailHtml),
  ])
}

export async function sendEscalationNotification(approval: Approval): Promise<void> {
  if (!approval.escalate_to) return
  const url = dashboardUrl(approval.id)
  const slackText = `⚠️ *Escalated* — ${approval.agent_name} has been waiting too long\nEscalating to ${approval.escalate_to}\n<${url}|View & Decide>`
  const emailHtml = `
    <h2>Escalation: ${approval.agent_name}</h2>
    <p>This approval has exceeded its timeout and has been escalated to you.</p>
    <p>${approval.action_description}</p>
    <a href="${url}" style="background:#f59e0b;color:#000;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:bold;">View &amp; Decide</a>
  `
  await Promise.allSettled([
    sendSlack(slackText),
    sendEmail(approval.escalate_to, `Escalated: ${approval.agent_name} needs decision`, emailHtml),
  ])
}
