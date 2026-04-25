// app/(main)/settings/page.tsx
'use client'
import { useEffect, useState } from 'react'
import type { Team } from '@/types'
import { setTimeFormat } from '@/lib/formatDate'

type NotifStatus = { email: boolean; slack: boolean }
type TestState = 'idle' | 'sending' | 'ok' | 'error'

export default function SettingsPage() {
  const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE !== 'true'
  const [teams, setTeams] = useState<Team[]>([])
  const [name, setName] = useState('')
  const [members, setMembers] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  // Time format preference (persisted in localStorage)
  const [timeFormat, setTimeFormatState] = useState<'12h' | '24h'>('12h')
  useEffect(() => {
    const saved = localStorage.getItem('timeFormat') as '12h' | '24h' | null
    if (saved) setTimeFormatState(saved)
  }, [])
  function toggleTimeFormat(fmt: '12h' | '24h') {
    setTimeFormatState(fmt)
    setTimeFormat(fmt)
  }

  // Notifications
  const [notifStatus, setNotifStatus] = useState<NotifStatus | null>(null)
  const [testEmail, setTestEmail] = useState('')
  const [emailTest, setEmailTest] = useState<TestState>('idle')
  const [emailTestMsg, setEmailTestMsg] = useState('')
  const [slackTest, setSlackTest] = useState<TestState>('idle')
  const [slackTestMsg, setSlackTestMsg] = useState('')

  useEffect(() => {
    fetch('/api/teams')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setTeams(data)
      })
    fetch('/api/notifications/test')
      .then((r) => r.json())
      .then((data: NotifStatus) => setNotifStatus(data))
      .catch(() => {/* silently ignore */})
  }, [])

  async function sendTestEmail() {
    if (!testEmail.trim()) return
    setEmailTest('sending')
    setEmailTestMsg('')
    const res = await fetch('/api/notifications/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channel: 'email', to: testEmail.trim() }),
    })
    if (res.ok) {
      setEmailTest('ok')
      setEmailTestMsg(`Test sent to ${testEmail.trim()}`)
    } else {
      const data = await res.json()
      setEmailTest('error')
      setEmailTestMsg(data.error ?? 'Failed to send')
    }
    setTimeout(() => setEmailTest('idle'), 5000)
  }

  async function sendTestSlack() {
    setSlackTest('sending')
    setSlackTestMsg('')
    const res = await fetch('/api/notifications/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channel: 'slack' }),
    })
    if (res.ok) {
      setSlackTest('ok')
      setSlackTestMsg('Test message sent to Slack')
    } else {
      const data = await res.json()
      setSlackTest('error')
      setSlackTestMsg(data.error ?? 'Failed to send')
    }
    setTimeout(() => setSlackTest('idle'), 5000)
  }

  async function saveTeam() {
    if (!name.trim()) return
    setSaving(true)
    setMessage('')
    const res = await fetch('/api/teams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.trim(),
        members: members.split(',').map((m) => m.trim()).filter(Boolean),
      }),
    })
    setSaving(false)
    if (res.ok) {
      const team = await res.json()
      setTeams((prev) => [...prev.filter((t) => t.name !== team.name), team])
      setName('')
      setMembers('')
      setMessage('Team saved.')
    } else {
      setMessage('Error saving team.')
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-bold text-gray-900 mb-8">Settings</h1>

      {/* ── Time format ── */}
      <section className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="font-semibold text-gray-800 mb-1">Display</h2>
        <p className="text-sm text-gray-500 mb-4">Choose how timestamps are shown across the app.</p>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-700 font-medium w-28">Time format</span>
          <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm font-medium">
            {(['12h', '24h'] as const).map((fmt) => (
              <button
                key={fmt}
                onClick={() => toggleTimeFormat(fmt)}
                className={`px-4 py-2 transition-colors ${
                  timeFormat === fmt
                    ? 'bg-green-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {fmt === '12h' ? '12 h  (3:45 PM)' : '24 h  (15:45)'}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Teams ── */}
      <section className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="font-semibold text-gray-800 mb-1">Teams</h2>
        <p className="text-sm text-gray-500 mb-4">
          Create named teams so agents can route approvals to a group. Any member can approve.
        </p>

        {demoMode && (
          <div className="mb-4 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 flex items-center gap-2">
            🔒 Read-only demo — inputs are disabled. Deploy your own instance to configure teams.
          </div>
        )}

        {teams.length > 0 && (
          <div className="mb-4 space-y-2">
            {teams.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between bg-gray-50 rounded-md px-3 py-2"
              >
                <span className="font-medium text-sm text-gray-800">{t.name}</span>
                <span className="text-xs text-gray-400">{t.members.join(', ')}</span>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={demoMode}
            placeholder="Team name (e.g. finance-team)"
            className={`w-full border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-200 ${demoMode ? 'bg-gray-50 cursor-not-allowed opacity-60' : ''}`}
          />
          <input
            value={members}
            onChange={(e) => setMembers(e.target.value)}
            disabled={demoMode}
            placeholder="Member emails, comma-separated"
            className={`w-full border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-200 ${demoMode ? 'bg-gray-50 cursor-not-allowed opacity-60' : ''}`}
          />
          <button
            onClick={saveTeam}
            disabled={saving || !name.trim() || demoMode}
            className="bg-green-500 text-white rounded-md px-4 py-2 text-sm font-semibold hover:bg-green-600 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving...' : 'Save Team'}
          </button>
          {message && <p className="text-sm text-gray-500">{message}</p>}
        </div>
      </section>

      <section className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-800 mb-1">Notifications</h2>
        <p className="text-sm text-gray-500 mb-5">
          Set{' '}
          <code className="bg-gray-100 px-1 rounded text-xs">RESEND_API_KEY</code> and{' '}
          <code className="bg-gray-100 px-1 rounded text-xs">SLACK_WEBHOOK_URL</code> in your
          environment variables to enable notifications. Both are optional and free.
        </p>

        {demoMode && (
          <div className="mb-4 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 flex items-center gap-2">
            🔒 Read-only demo — notification testing is disabled.
          </div>
        )}

        {/* Status row */}
        <div className="flex gap-3 mb-6">
          <StatusBadge
            label="Email"
            configured={notifStatus?.email ?? false}
            loading={notifStatus === null}
          />
          <StatusBadge
            label="Slack"
            configured={notifStatus?.slack ?? false}
            loading={notifStatus === null}
          />
        </div>

        {/* Test email */}
        <div className="mb-5">
          <p className="text-sm font-medium text-gray-700 mb-2">Send a test email</p>
          <div className="flex gap-2 items-center">
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="you@example.com"
              disabled={!notifStatus?.email || demoMode}
              className="flex-1 border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-200 disabled:bg-gray-50 disabled:text-gray-400"
            />
            <button
              onClick={sendTestEmail}
              disabled={!notifStatus?.email || emailTest === 'sending' || !testEmail.trim() || demoMode}
              className="bg-green-500 text-white rounded-md px-4 py-2 text-sm font-semibold hover:bg-green-600 disabled:opacity-40 transition-colors whitespace-nowrap"
            >
              {emailTest === 'sending' ? 'Sending…' : 'Send test'}
            </button>
          </div>
          {!notifStatus?.email && notifStatus !== null && (
            <p className="text-xs text-gray-400 mt-1">
              Add <code className="bg-gray-100 px-1 rounded">RESEND_API_KEY</code> to enable email.
            </p>
          )}
          {emailTestMsg && (
            <p className={`text-xs mt-1 ${emailTest === 'error' ? 'text-red-500' : 'text-green-600'}`}>
              {emailTest === 'ok' ? '✅ ' : '❌ '}{emailTestMsg}
            </p>
          )}
        </div>

        {/* Test Slack */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Send a test Slack message</p>
          <button
            onClick={sendTestSlack}
            disabled={!notifStatus?.slack || slackTest === 'sending' || demoMode}
            className="bg-gray-800 text-white rounded-md px-4 py-2 text-sm font-semibold hover:bg-gray-700 disabled:opacity-40 transition-colors"
          >
            {slackTest === 'sending' ? 'Sending…' : 'Send test message'}
          </button>
          {!notifStatus?.slack && notifStatus !== null && (
            <p className="text-xs text-gray-400 mt-1">
              Add <code className="bg-gray-100 px-1 rounded">SLACK_WEBHOOK_URL</code> to enable Slack.
            </p>
          )}
          {slackTestMsg && (
            <p className={`text-xs mt-1 ${slackTest === 'error' ? 'text-red-500' : 'text-green-600'}`}>
              {slackTest === 'ok' ? '✅ ' : '❌ '}{slackTestMsg}
            </p>
          )}
        </div>
      </section>
    </div>
  )
}

function StatusBadge({
  label,
  configured,
  loading,
}: {
  label: string
  configured: boolean
  loading: boolean
}) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
        <div className="w-2 h-2 rounded-full bg-gray-300 animate-pulse" />
        <span className="text-sm text-gray-500">{label}</span>
      </div>
    )
  }
  return (
    <div
      className={`flex items-center gap-2 rounded-lg px-3 py-2 border ${
        configured
          ? 'bg-green-50 border-green-200'
          : 'bg-gray-50 border-gray-200'
      }`}
    >
      <div
        className={`w-2 h-2 rounded-full ${configured ? 'bg-green-500' : 'bg-gray-300'}`}
      />
      <span className={`text-sm font-medium ${configured ? 'text-green-700' : 'text-gray-500'}`}>
        {label}
      </span>
      <span className={`text-xs ${configured ? 'text-green-500' : 'text-gray-400'}`}>
        {configured ? '✓ configured' : 'not set'}
      </span>
    </div>
  )
}
