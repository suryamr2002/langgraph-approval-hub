// app/(main)/settings/page.tsx
'use client'
import { useEffect, useState } from 'react'
import type { Team } from '@/types'

export default function SettingsPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [name, setName] = useState('')
  const [members, setMembers] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetch('/api/teams')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setTeams(data)
      })
  }, [])

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

      <section className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="font-semibold text-gray-800 mb-1">Teams</h2>
        <p className="text-sm text-gray-500 mb-4">
          Create named teams so agents can route approvals to a group. Any member can approve.
        </p>

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
            placeholder="Team name (e.g. finance-team)"
            className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-200"
          />
          <input
            value={members}
            onChange={(e) => setMembers(e.target.value)}
            placeholder="Member emails, comma-separated"
            className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-200"
          />
          <button
            onClick={saveTeam}
            disabled={saving || !name.trim()}
            className="bg-green-500 text-white rounded-md px-4 py-2 text-sm font-semibold hover:bg-green-600 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving...' : 'Save Team'}
          </button>
          {message && <p className="text-sm text-gray-500">{message}</p>}
        </div>
      </section>

      <section className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-800 mb-1">Notifications</h2>
        <p className="text-sm text-gray-500">
          Set <code className="bg-gray-100 px-1 rounded text-xs">SLACK_WEBHOOK_URL</code> and{' '}
          <code className="bg-gray-100 px-1 rounded text-xs">RESEND_API_KEY</code> in your
          environment variables to enable notifications. Both are optional and free.
        </p>
      </section>
    </div>
  )
}
