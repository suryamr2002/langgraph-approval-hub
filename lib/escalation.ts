// lib/escalation.ts
import { supabaseAdmin } from '@/lib/supabase'
import { sendEscalationNotification } from '@/lib/notifications'
import type { Approval } from '@/types'

export async function checkAndEscalate(): Promise<void> {
  const { data, error } = await supabaseAdmin
    .from('approvals')
    .select('*')
    .in('status', ['pending'])
    .lt('expires_at', new Date().toISOString())

  if (error || !data || data.length === 0) return

  for (const approval of data as Approval[]) {
    await supabaseAdmin
      .from('approvals')
      .update({ status: 'escalated' })
      .eq('id', approval.id)

    await sendEscalationNotification(approval)
  }
}
