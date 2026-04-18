# Dashboard Filters & UX Improvements — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add status filter tabs and a search box to the dashboard, fix a stats bug, add a demo reset button, improve empty states, update the demo banner, and make export JSON open in a new tab.

**Architecture:** `app/page.tsx` stays a server component — it reads `searchParams.status`, fetches filtered approvals from the API, and passes the list to a new `DashboardClient` client component. `DashboardClient` owns the search input state, renders the filter tabs (as Links), filters the list in-browser, and renders the reset button in demo mode. Stats are always global — fixed in the API by filtering in memory rather than at the DB level.

**Tech Stack:** Next.js 14 App Router, TypeScript, Tailwind CSS, React Testing Library, Jest

**Spec:** `docs/superpowers/specs/2026-04-18-dashboard-filters-ux.md`

---

## File Structure

```
langgraph-approval-hub/
├── app/
│   ├── page.tsx                          # MODIFY: read searchParams, use DashboardClient
│   ├── layout.tsx                        # MODIFY: update demo banner text
│   ├── audit/page.tsx                    # MODIFY: target="_blank" on export link
│   └── api/approvals/route.ts            # MODIFY: fix stats to always be global
├── components/
│   ├── DashboardClient.tsx               # CREATE: tabs + search + reset button
│   └── ApprovalTable.tsx                 # MODIFY: accept emptyMessage prop
└── __tests__/
    ├── api/approvals.test.ts             # CREATE: API tests including stats-global behaviour
    └── components/
        ├── ApprovalTable.test.tsx        # CREATE: empty state message tests
        └── DashboardClient.test.tsx      # CREATE: filter, search, reset button tests
```

---

## Task 1: Fix API — Stats Always Global

The current `/api/approvals` route computes stats from the **filtered** result set. If you request `?status=escalated`, the response shows `pending: 0` — wrong. Fix: always fetch all records, filter in memory for the approvals list.

**Files:**
- Modify: `app/api/approvals/route.ts`
- Create: `__tests__/api/approvals.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// __tests__/api/approvals.test.ts
import { GET } from '@/app/api/approvals/route'
import { NextRequest } from 'next/server'

const mockData = [
  { id: '1', agent_name: 'Finance Agent', action_description: 'Refund', status: 'pending', assignee: 'team-a', assignee_type: 'team', escalate_to: null, timeout_minutes: 60, decided_by: null, decision_note: null, created_at: new Date().toISOString(), decided_at: null, expires_at: new Date(Date.now() + 3600000).toISOString() },
  { id: '2', agent_name: 'HR Agent', action_description: 'Offer letters', status: 'escalated', assignee: 'hr@acme.com', assignee_type: 'person', escalate_to: null, timeout_minutes: 60, decided_by: null, decision_note: null, created_at: new Date().toISOString(), decided_at: null, expires_at: new Date(Date.now() + 3600000).toISOString() },
  { id: '3', agent_name: 'Ops Agent', action_description: 'Deploy', status: 'approved', assignee: 'ops@acme.com', assignee_type: 'person', escalate_to: null, timeout_minutes: 60, decided_by: 'priya@acme.com', decision_note: null, created_at: new Date(Date.now() - 3600000).toISOString(), decided_at: new Date().toISOString(), expires_at: new Date(Date.now() + 3600000).toISOString() },
]

jest.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        order: jest.fn(() => Promise.resolve({ data: mockData, error: null })),
      })),
    })),
  },
}))

jest.mock('@/lib/escalation', () => ({
  checkAndEscalate: jest.fn().mockResolvedValue(undefined),
}))

describe('GET /api/approvals', () => {
  it('returns all approvals when no status filter', async () => {
    const req = new NextRequest('http://localhost/api/approvals')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.approvals).toHaveLength(3)
  })

  it('returns only filtered approvals when status=escalated', async () => {
    const req = new NextRequest('http://localhost/api/approvals?status=escalated')
    const res = await GET(req)
    const body = await res.json()
    expect(body.approvals).toHaveLength(1)
    expect(body.approvals[0].status).toBe('escalated')
  })

  it('stats are always global regardless of status filter', async () => {
    const req = new NextRequest('http://localhost/api/approvals?status=escalated')
    const res = await GET(req)
    const body = await res.json()
    // Even though we filtered to escalated only, stats show global counts
    expect(body.stats.pending).toBe(1)
    expect(body.stats.escalated).toBe(1)
  })

  it('returns stats with approved_today count', async () => {
    const req = new NextRequest('http://localhost/api/approvals')
    const res = await GET(req)
    const body = await res.json()
    expect(body.stats.approved_today).toBe(1)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd langgraph-approval-hub
npx jest __tests__/api/approvals.test.ts --no-coverage
```

Expected: FAIL — `stats are always global regardless of status filter` fails because stats currently use filtered data.

- [ ] **Step 3: Fix `app/api/approvals/route.ts`**

Replace the entire file:

```typescript
// app/api/approvals/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { checkAndEscalate } from '@/lib/escalation'
import type { DashboardStats } from '@/types'

export async function GET(req: NextRequest) {
  await checkAndEscalate()

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')

  const { data, error } = await supabaseAdmin
    .from('approvals')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const all = data ?? []
  const approvals = status ? all.filter((a) => a.status === status) : all

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const pending = all.filter((a) => a.status === 'pending').length
  const escalated = all.filter((a) => a.status === 'escalated').length
  const approvedToday = all.filter(
    (a) => a.status === 'approved' && a.decided_at && new Date(a.decided_at) >= todayStart
  ).length

  const decidedItems = all.filter((a) => a.decided_at)
  const avgMs =
    decidedItems.length > 0
      ? decidedItems.reduce((sum, a) => {
          return sum + (new Date(a.decided_at!).getTime() - new Date(a.created_at).getTime())
        }, 0) / decidedItems.length
      : 0

  const stats: DashboardStats = {
    pending,
    escalated,
    approved_today: approvedToday,
    avg_response_minutes: Math.round(avgMs / 60000),
  }

  return NextResponse.json({ approvals, stats })
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest __tests__/api/approvals.test.ts --no-coverage
```

Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add app/api/approvals/route.ts __tests__/api/approvals.test.ts
git commit -m "fix: stats always global regardless of status filter; add approvals API tests"
```

---

## Task 2: Add `emptyMessage` Prop to ApprovalTable

`ApprovalTable` currently hardcodes "No pending approvals". It needs to accept a message so `DashboardClient` can pass a context-aware string.

**Files:**
- Modify: `components/ApprovalTable.tsx`
- Create: `__tests__/components/ApprovalTable.test.tsx`

- [ ] **Step 1: Write the failing test**

```typescript
/**
 * @jest-environment jsdom
 */
// __tests__/components/ApprovalTable.test.tsx
import { render, screen } from '@testing-library/react'
import ApprovalTable from '@/components/ApprovalTable'

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}))

describe('ApprovalTable', () => {
  it('shows default empty message when no approvals and no emptyMessage prop', () => {
    render(<ApprovalTable approvals={[]} />)
    expect(screen.getByText('No pending approvals')).toBeInTheDocument()
  })

  it('shows custom empty message when provided', () => {
    render(<ApprovalTable approvals={[]} emptyMessage="No escalated approvals — all clear" />)
    expect(screen.getByText('No escalated approvals — all clear')).toBeInTheDocument()
  })

  it('renders a row for each approval', () => {
    const approvals = [
      { id: '1', agent_name: 'Finance Agent', action_description: 'Process refund', assignee: 'team-a', assignee_type: 'team' as const, status: 'pending' as const, escalate_to: null, timeout_minutes: 60, decided_by: null, decision_note: null, created_at: new Date().toISOString(), decided_at: null, expires_at: new Date().toISOString(), agent_reasoning: null },
    ]
    render(<ApprovalTable approvals={approvals} />)
    expect(screen.getByText('Finance Agent')).toBeInTheDocument()
    expect(screen.getByText('Process refund')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest __tests__/components/ApprovalTable.test.tsx --no-coverage
```

Expected: FAIL — `emptyMessage` prop does not exist yet.

- [ ] **Step 3: Update `components/ApprovalTable.tsx`**

Replace the entire file:

```typescript
// components/ApprovalTable.tsx
'use client'
import Link from 'next/link'
import StatusBadge from './StatusBadge'
import type { Approval } from '@/types'

function minutesAgo(isoString: string): string {
  const mins = Math.floor((Date.now() - new Date(isoString).getTime()) / 60000)
  if (mins < 60) return `${mins}m`
  return `${Math.floor(mins / 60)}h ${mins % 60}m`
}

export default function ApprovalTable({
  approvals,
  emptyMessage = 'No pending approvals',
}: {
  approvals: Approval[]
  emptyMessage?: string
}) {
  if (approvals.length === 0) {
    return (
      <div className="text-center py-20 text-gray-400">
        <div className="text-4xl mb-3">✅</div>
        <p className="font-medium">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="grid grid-cols-[2fr_1.2fr_0.8fr_0.8fr_1fr] gap-4 px-4 py-2 border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wide">
        <div>Agent / Action</div>
        <div>Assignee</div>
        <div>Waiting</div>
        <div>Status</div>
        <div>Action</div>
      </div>
      {approvals.map((a) => (
        <div
          key={a.id}
          className="grid grid-cols-[2fr_1.2fr_0.8fr_0.8fr_1fr] gap-4 px-4 py-3 border-b border-gray-50 items-center hover:bg-gray-50 transition-colors"
        >
          <div>
            <div className="font-semibold text-sm text-gray-900">{a.agent_name}</div>
            <div className="text-xs text-gray-500 truncate max-w-xs">{a.action_description}</div>
          </div>
          <div className="text-sm text-gray-600">{a.assignee}</div>
          <div className="text-sm text-gray-600">{minutesAgo(a.created_at)}</div>
          <div><StatusBadge status={a.status} /></div>
          <div>
            <Link
              href={`/approval/${a.id}`}
              className="rounded px-3 py-1 text-xs font-semibold bg-green-500 text-white hover:bg-green-600 transition-colors"
            >
              Review
            </Link>
          </div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest __tests__/components/ApprovalTable.test.tsx --no-coverage
```

Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add components/ApprovalTable.tsx __tests__/components/ApprovalTable.test.tsx
git commit -m "feat: add emptyMessage prop to ApprovalTable"
```

---

## Task 3: Create DashboardClient Component

Client component that owns: status tab UI (links), search input state, in-browser filter logic, reset button (demo mode only).

**Files:**
- Create: `components/DashboardClient.tsx`
- Create: `__tests__/components/DashboardClient.test.tsx`

- [ ] **Step 1: Write the failing test**

```typescript
/**
 * @jest-environment jsdom
 */
// __tests__/components/DashboardClient.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import DashboardClient from '@/components/DashboardClient'
import type { Approval } from '@/types'

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}))

jest.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: jest.fn() }),
}))

const makeApproval = (overrides: Partial<Approval> = {}): Approval => ({
  id: '1',
  agent_name: 'Finance Agent',
  action_description: 'Process refund',
  agent_reasoning: null,
  assignee: 'finance-team',
  assignee_type: 'team',
  escalate_to: null,
  timeout_minutes: 60,
  status: 'pending',
  decided_by: null,
  decision_note: null,
  created_at: new Date().toISOString(),
  decided_at: null,
  expires_at: new Date(Date.now() + 3600000).toISOString(),
  ...overrides,
})

describe('DashboardClient', () => {
  it('renders all approvals by default', () => {
    const approvals = [makeApproval({ agent_name: 'Finance Agent' }), makeApproval({ id: '2', agent_name: 'HR Agent' })]
    render(<DashboardClient approvals={approvals} activeStatus={null} demoMode={false} />)
    expect(screen.getByText('Finance Agent')).toBeInTheDocument()
    expect(screen.getByText('HR Agent')).toBeInTheDocument()
  })

  it('filters by search query against agent_name', () => {
    const approvals = [makeApproval({ agent_name: 'Finance Agent' }), makeApproval({ id: '2', agent_name: 'HR Agent' })]
    render(<DashboardClient approvals={approvals} activeStatus={null} demoMode={false} />)
    fireEvent.change(screen.getByPlaceholderText('Search agents or actions…'), { target: { value: 'finance' } })
    expect(screen.getByText('Finance Agent')).toBeInTheDocument()
    expect(screen.queryByText('HR Agent')).not.toBeInTheDocument()
  })

  it('filters by search query against action_description', () => {
    const approvals = [
      makeApproval({ agent_name: 'Finance Agent', action_description: 'Process refund' }),
      makeApproval({ id: '2', agent_name: 'HR Agent', action_description: 'Send offer letters' }),
    ]
    render(<DashboardClient approvals={approvals} activeStatus={null} demoMode={false} />)
    fireEvent.change(screen.getByPlaceholderText('Search agents or actions…'), { target: { value: 'offer' } })
    expect(screen.getByText('HR Agent')).toBeInTheDocument()
    expect(screen.queryByText('Finance Agent')).not.toBeInTheDocument()
  })

  it('shows filter-aware empty message for escalated tab', () => {
    render(<DashboardClient approvals={[]} activeStatus="escalated" demoMode={false} />)
    expect(screen.getByText('No escalated approvals — all clear')).toBeInTheDocument()
  })

  it('shows search empty message when search returns nothing', () => {
    const approvals = [makeApproval()]
    render(<DashboardClient approvals={approvals} activeStatus={null} demoMode={false} />)
    fireEvent.change(screen.getByPlaceholderText('Search agents or actions…'), { target: { value: 'zzz' } })
    expect(screen.getByText('No results for "zzz"')).toBeInTheDocument()
  })

  it('does not show reset button when demoMode is false', () => {
    render(<DashboardClient approvals={[]} activeStatus={null} demoMode={false} />)
    expect(screen.queryByTitle('Reset demo data')).not.toBeInTheDocument()
  })

  it('shows reset button when demoMode is true', () => {
    render(<DashboardClient approvals={[]} activeStatus={null} demoMode={true} />)
    expect(screen.getByTitle('Reset demo data')).toBeInTheDocument()
  })

  it('calls /api/demo/seed on reset click and refreshes', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true })
    const mockRefresh = jest.fn()
    jest.spyOn(require('next/navigation'), 'useRouter').mockReturnValue({ refresh: mockRefresh })

    render(<DashboardClient approvals={[]} activeStatus={null} demoMode={true} />)
    fireEvent.click(screen.getByTitle('Reset demo data'))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/demo/seed', { method: 'POST' })
      expect(mockRefresh).toHaveBeenCalled()
    })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest __tests__/components/DashboardClient.test.tsx --no-coverage
```

Expected: FAIL — `Cannot find module '@/components/DashboardClient'`

- [ ] **Step 3: Create `components/DashboardClient.tsx`**

```typescript
// components/DashboardClient.tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ApprovalTable from './ApprovalTable'
import type { Approval } from '@/types'

const TABS = [
  { label: 'All', status: null, href: '/' },
  { label: 'Pending', status: 'pending', href: '/?status=pending' },
  { label: 'Escalated', status: 'escalated', href: '/?status=escalated' },
]

function getEmptyMessage(activeStatus: string | null, search: string): string {
  if (search.trim()) return `No results for "${search.trim()}"`
  if (activeStatus === 'escalated') return 'No escalated approvals — all clear'
  return 'No pending approvals — all clear'
}

export default function DashboardClient({
  approvals,
  activeStatus,
  demoMode,
}: {
  approvals: Approval[]
  activeStatus: string | null
  demoMode: boolean
}) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [resetting, setResetting] = useState(false)

  const filtered = search.trim()
    ? approvals.filter(
        (a) =>
          a.agent_name.toLowerCase().includes(search.toLowerCase()) ||
          a.action_description.toLowerCase().includes(search.toLowerCase())
      )
    : approvals

  async function handleReset() {
    setResetting(true)
    await fetch('/api/demo/seed', { method: 'POST' })
    router.refresh()
    setResetting(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-4">
        <div className="flex items-center gap-1">
          {TABS.map((tab) => {
            const isActive = activeStatus === tab.status
            return (
              <Link
                key={tab.label}
                href={tab.href}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  isActive
                    ? 'bg-green-50 text-green-700 border-b-2 border-green-600'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </Link>
            )
          })}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search agents or actions…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-200 rounded-md px-3 py-1.5 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          {demoMode && (
            <button
              onClick={handleReset}
              disabled={resetting}
              title="Reset demo data"
              className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              {resetting ? '…' : '↺'}
            </button>
          )}
        </div>
      </div>
      <ApprovalTable
        approvals={filtered}
        emptyMessage={getEmptyMessage(activeStatus, search)}
      />
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest __tests__/components/DashboardClient.test.tsx --no-coverage
```

Expected: PASS (8 tests)

- [ ] **Step 5: Commit**

```bash
git add components/DashboardClient.tsx __tests__/components/DashboardClient.test.tsx
git commit -m "feat: add DashboardClient with status tabs, search, and demo reset button"
```

---

## Task 4: Update `app/page.tsx` to Use DashboardClient

Wire the server component to read `searchParams`, pass `activeStatus` and `demoMode` to `DashboardClient`.

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Replace `app/page.tsx`**

```typescript
// app/page.tsx
import StatsBar from '@/components/StatsBar'
import DashboardClient from '@/components/DashboardClient'
import type { Approval, DashboardStats } from '@/types'

async function getData(status?: string): Promise<{ approvals: Approval[]; stats: DashboardStats }> {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const url = status ? `${base}/api/approvals?status=${status}` : `${base}/api/approvals`
  try {
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) throw new Error('Failed')
    return res.json()
  } catch {
    return {
      approvals: [],
      stats: { pending: 0, escalated: 0, approved_today: 0, avg_response_minutes: 0 },
    }
  }
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { status?: string }
}) {
  const activeStatus = searchParams.status ?? null
  const { approvals, stats } = await getData(activeStatus ?? undefined)
  const demoMode = process.env.DEMO_MODE === 'true'

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Pending Approvals</h1>
        <span className="text-xs text-gray-400">Updates on refresh</span>
      </div>
      <StatsBar stats={stats} />
      <div className="mt-6">
        <DashboardClient
          approvals={approvals}
          activeStatus={activeStatus}
          demoMode={demoMode}
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Run full test suite**

```bash
npx jest --no-coverage
```

Expected: All existing tests still pass (no regressions). New tests from Tasks 1–3 also pass.

- [ ] **Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "feat: wire dashboard page to status filter and DashboardClient"
```

---

## Task 5: Update Demo Banner + Export Link

Two one-line changes. No tests needed — these are text/attribute changes with no logic.

**Files:**
- Modify: `app/layout.tsx`
- Modify: `app/audit/page.tsx`

- [ ] **Step 1: Update demo banner text in `app/layout.tsx`**

Find this line:
```
🎭 Demo mode — data is simulated.{' '}
```

Replace with:
```
🎭 Demo mode — try approving a request, then hit ↺ to reset.{' '}
```

Full updated banner block:
```tsx
{process.env.NEXT_PUBLIC_DEMO_MODE === 'true' && (
  <div className="w-full bg-yellow-50 border-b border-yellow-200 px-4 py-2 text-xs text-yellow-800 text-center">
    🎭 Demo mode — try approving a request, then hit ↺ to reset.{' '}
    <a
      href="https://github.com/suryamr2002/langgraph-approval-hub"
      className="underline font-semibold"
    >
      Deploy your own →
    </a>
  </div>
)}
```

- [ ] **Step 2: Update export link in `app/audit/page.tsx`**

Find:
```tsx
<a
  href="/api/audit"
  className="text-sm text-green-600 hover:underline font-medium"
>
  ↓ Export JSON
</a>
```

Replace with:
```tsx
<a
  href="/api/audit"
  target="_blank"
  rel="noopener noreferrer"
  className="text-sm text-green-600 hover:underline font-medium"
>
  ↗ Export JSON
</a>
```

- [ ] **Step 3: Run full test suite**

```bash
npx jest --no-coverage
```

Expected: All tests pass.

- [ ] **Step 4: Commit**

```bash
git add app/layout.tsx app/audit/page.tsx
git commit -m "feat: update demo banner text; export JSON opens in new tab"
```

---

## Self-Review

**Spec coverage check:**
- ✅ Status filter tabs (server-side) — Task 4 passes `searchParams.status` to API
- ✅ Search box (client-side) — Task 3 `DashboardClient` filters on `agent_name` / `action_description`
- ✅ Search clears on tab switch — Handled naturally: tab click changes URL → server re-renders → `DashboardClient` remounts with fresh state
- ✅ Stats always global — Task 1 fixes API to filter in memory
- ✅ Filter-aware empty states — Task 3 `getEmptyMessage()` returns context-specific string
- ✅ Reset button (demo mode only) — Task 3, gated on `demoMode` prop
- ✅ Demo banner upgraded — Task 5
- ✅ Export JSON opens in new tab — Task 5
- ✅ `DEMO_MODE` env var (not `NEXT_PUBLIC_DEMO_MODE`) used for reset button — `app/page.tsx` reads `process.env.DEMO_MODE`

**Placeholder scan:** No TBDs. All code blocks are complete.

**Type consistency:** `activeStatus: string | null` used consistently across `DashboardClient` props, `getEmptyMessage`, and `TABS` comparison. `emptyMessage?: string` with default `'No pending approvals'` in `ApprovalTable`. ✅
