// components/DocsNav.tsx
'use client'
import { useEffect, useState } from 'react'

const SECTIONS = [
  { id: 'why', label: 'Why this exists', group: 'THE PROBLEM' },
  { id: 'deploy', label: '1. Deploy your hub', group: 'GET RUNNING' },
  { id: 'env', label: '2. Configure env vars', group: null },
  { id: 'install', label: '3. Install the SDK', group: null },
  { id: 'agent', label: '4. Add to your agent', group: null },
  { id: 'basic', label: 'Basic approval', group: 'CODE PATTERNS' },
  { id: 'team-routing', label: 'Team routing', group: null },
  { id: 'escalation', label: 'Escalation & timeout', group: null },
  { id: 'errors', label: 'Error handling', group: null },
  { id: 'enterprise', label: 'Teams & routing', group: 'ENTERPRISE' },
  { id: 'notifications', label: 'Notifications', group: null },
  { id: 'audit-trail', label: 'Audit trail', group: null },
  { id: 'sdk-params', label: 'SDK parameters', group: 'REFERENCE' },
  { id: 'api-endpoints', label: 'API endpoints', group: null },
]

export default function DocsNav() {
  const [active, setActive] = useState('why')

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id)
        }
      },
      { rootMargin: '-10% 0px -80% 0px' }
    )
    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [])

  let lastGroup = ''
  return (
    <nav>
      {SECTIONS.map(({ id, label, group }) => {
        const showGroup = group && group !== lastGroup
        if (group) lastGroup = group
        return (
          <div key={id}>
            {showGroup && (
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-3 mt-4 mb-1.5">
                {group}
              </div>
            )}
            <a
              href={`#${id}`}
              className={`block text-sm px-3 py-1.5 rounded-md transition-colors ${
                active === id
                  ? 'bg-green-50 text-green-700 font-semibold'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {label}
            </a>
          </div>
        )
      })}
    </nav>
  )
}
