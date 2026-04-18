# Docs Page & Notifications Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a professional developer docs page at `/docs` with a standalone Stripe-style layout, fix team email resolution so team approvals notify all members, and add a Docs link to the sidebar.

**Architecture:** Existing dashboard pages move into an `app/(main)/` route group to share the sidebar layout, freeing `/docs` to use its own full-page layout. The docs page is a static Next.js 14 server component with a client-side scroll-spy nav (`DocsNav`) and per-block copy buttons (`CopyButton`). Team email resolution is fixed in `lib/notifications.ts` by querying Supabase for team members before sending emails.

**Tech Stack:** Next.js 14 App Router, Tailwind CSS, CSS Modules (keyframe animation), Jest + React Testing Library, Supabase (team lookup)

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `app/layout.tsx` | Modify | Remove Sidebar — keep html/body/font/demo banner only |
| `app/(main)/layout.tsx` | Create | Renders Sidebar for all dashboard routes |
| `app/(main)/page.tsx` | Create (move) | Dashboard page (was `app/page.tsx`) |
| `app/(main)/audit/page.tsx` | Create (move) | Audit page (was `app/audit/page.tsx`) |
| `app/(main)/settings/page.tsx` | Create (move) | Settings page (was `app/settings/page.tsx`) |
| `app/(main)/approval/[id]/page.tsx` | Create (move) | Approval detail (was `app/approval/[id]/page.tsx`) |
| `app/docs/layout.tsx` | Create | Docs top nav + left section nav shell |
| `app/docs/page.tsx` | Create | All docs content — static server component |
| `app/docs/docs.module.css` | Create | `@keyframes fadeUp` for pain cards |
| `components/CopyButton.tsx` | Create | Client component — clipboard copy button |
| `components/DocsNav.tsx` | Create | Client component — scroll-spy left nav |
| `components/Sidebar.tsx` | Modify | Add Docs link |
| `lib/notifications.ts` | Modify | Fix team email resolution |
| `__tests__/lib/resolveEmailRecipients.test.ts` | Create | Unit tests for team email resolution |
| `__tests__/components/CopyButton.test.tsx` | Create | Component test for CopyButton |
| `__tests__/components/DocsNav.test.tsx` | Create | Component test for DocsNav |

---

### Task 1: Fix team email resolution in notifications

**Files:**
- Modify: `lib/notifications.ts`
- Create: `__tests__/lib/resolveEmailRecipients.test.ts`

- [ ] **Step 1: Write the failing test**

Create `__tests__/lib/resolveEmailRecipients.test.ts`:

```typescript
import { resolveEmailRecipients } from '@/lib/notifications'
import type { Approval } from '@/types'

const mockSingle = jest.fn()
jest.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: () => ({
      select: () => ({
        eq: () => ({
          single: mockSingle,
        }),
      }),
    }),
  },
}))

const baseApproval: Approval = {
  id: 'test-id',
  agent_name: 'Test Agent',
  action_description: 'Do something',
  agent_reasoning: null,
  assignee: 'alice@example.com',
  assignee_type: 'person',
  escalate_to: null,
  timeout_minutes: 60,
  status: 'pending',
  decided_by: null,
  decision_note: null,
  created_at: new Date().toISOString(),
  expires_at: new Date().toISOString(),
}

describe('resolveEmailRecipients', () => {
  it('returns [assignee] for person type', async () => {
    const result = await resolveEmailRecipients({
      ...baseApproval,
      assignee_type: 'person',
      assignee: 'alice@example.com',
    })
    expect(result).toEqual(['alice@example.com'])
  })

  it('returns team member emails for team type', async () => {
    mockSingle.mockResolvedValue({
      data: { members: ['alice@example.com', 'bob@example.com'] },
      error: null,
    })
    const result = await resolveEmailRecipients({
      ...baseApproval,
      assignee_type: 'team',
      assignee: 'finance-team',
    })
    expect(result).toEqual(['alice@example.com', 'bob@example.com'])
  })

  it('returns [] when team is not found in Supabase', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: 'Not found' } })
    const result = await resolveEmailRecipients({
      ...baseApproval,
      assignee_type: 'team',
      assignee: 'unknown-team',
    })
    expect(result).toEqual([])
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd langgraph-approval-hub
npx jest __tests__/lib/resolveEmailRecipients.test.ts --no-coverage
```

Expected: FAIL — `resolveEmailRecipients` is not exported from `@/lib/notifications`

- [ ] **Step 3: Update `lib/notifications.ts`**

Replace the entire file with:

```typescript
// lib/notifications.ts
import { Resend } from 'resend'
import { supabaseAdmin } from '@/lib/supabase'
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

export async function resolveEmailRecipients(approval: Approval): Promise<string[]> {
  if (approval.assignee_type === 'person') {
    return [approval.assignee]
  }
  const { data } = await supabaseAdmin
    .from('teams')
    .select('members')
    .eq('name', approval.assignee)
    .single()
  return (data?.members as string[]) ?? []
}

export async function sendNotifications(approval: Approval): Promise<void> {
  const url = dashboardUrl(approval.id)
  const slackText = `🤖 *${approval.agent_name}* needs approval\n>${approval.action_description}\n<${url}|View & Decide>`
  const emailHtml = `
    <h2>${approval.agent_name} needs your approval</h2>
    <p>${approval.action_description}</p>
    <a href="${url}" style="background:#4ade80;color:#000;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:bold;">View &amp; Decide</a>
  `
  const subject = `Action required: ${approval.agent_name}`
  const recipients = await resolveEmailRecipients(approval)

  await Promise.allSettled([
    sendSlack(slackText),
    ...recipients.map((r) => sendEmail(r, subject, emailHtml)),
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
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npx jest __tests__/lib/resolveEmailRecipients.test.ts --no-coverage
```

Expected: PASS — 3 tests passing

- [ ] **Step 5: Commit**

```bash
git add lib/notifications.ts __tests__/lib/resolveEmailRecipients.test.ts
git commit -m "fix: resolve team member emails before sending notifications"
```

---

### Task 2: Route group restructure

Move all dashboard pages into `app/(main)/` so `/docs` can have its own layout.

**Files:**
- Modify: `app/layout.tsx`
- Create: `app/(main)/layout.tsx`
- Create: `app/(main)/page.tsx` (content from `app/page.tsx`)
- Create: `app/(main)/audit/page.tsx` (content from `app/audit/page.tsx`)
- Create: `app/(main)/settings/page.tsx` (content from `app/settings/page.tsx`)
- Create: `app/(main)/approval/[id]/page.tsx` (content from `app/approval/[id]/page.tsx`)
- Delete: `app/page.tsx`, `app/audit/page.tsx`, `app/settings/page.tsx`, `app/approval/[id]/page.tsx`

- [ ] **Step 1: Create `app/(main)/layout.tsx`**

```tsx
// app/(main)/layout.tsx
import Sidebar from '@/components/Sidebar'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8">{children}</main>
    </div>
  )
}
```

- [ ] **Step 2: Update `app/layout.tsx` — remove Sidebar**

Replace the entire file:

```tsx
// app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'LangGraph Approval Hub',
  description: 'Enterprise human-in-the-loop approval dashboard for LangGraph agents',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50`}>
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
        {children}
      </body>
    </html>
  )
}
```

- [ ] **Step 3: Move pages using git mv**

Run these commands from inside the `langgraph-approval-hub` directory:

```bash
mkdir -p "app/(main)/audit" "app/(main)/settings" "app/(main)/approval/[id]"
git mv "app/page.tsx" "app/(main)/page.tsx"
git mv "app/audit/page.tsx" "app/(main)/audit/page.tsx"
git mv "app/settings/page.tsx" "app/(main)/settings/page.tsx"
git mv "app/approval/[id]/page.tsx" "app/(main)/approval/[id]/page.tsx"
rmdir "app/audit" "app/settings" "app/approval/[id]" "app/approval" 2>/dev/null; true
```

Note: `app/approval/[id]/` directory stays (git mv handles it). The `rmdir` cleanup is best-effort — ignore errors if directories are not empty.

- [ ] **Step 4: Verify the build compiles**

```bash
npx next build 2>&1 | tail -20
```

Expected: Build completes with no errors. Routes shown: `/` (SSR), `/audit` (SSR), `/settings` (SSR), `/approval/[id]` (SSR). No route for `/docs` yet (will be added in Task 5).

- [ ] **Step 5: Run existing tests**

```bash
npx jest --no-coverage 2>&1 | tail -20
```

Expected: All existing tests still pass. (Route move does not affect test files.)

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "refactor: move dashboard pages into (main) route group for docs layout isolation"
```

---

### Task 3: CopyButton component

**Files:**
- Create: `components/CopyButton.tsx`
- Create: `__tests__/components/CopyButton.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `__tests__/components/CopyButton.test.tsx`:

```tsx
/** @jest-environment jsdom */
import { render, screen, fireEvent, act } from '@testing-library/react'
import CopyButton from '@/components/CopyButton'

beforeEach(() => {
  Object.assign(navigator, {
    clipboard: { writeText: jest.fn().mockResolvedValue(undefined) },
  })
})

describe('CopyButton', () => {
  it('renders with "Copy" label', () => {
    render(<CopyButton text="some code" />)
    expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument()
  })

  it('calls clipboard.writeText with the correct text on click', async () => {
    render(<CopyButton text="pip install langgraph-approval-hub" />)
    await act(async () => {
      fireEvent.click(screen.getByRole('button'))
    })
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      'pip install langgraph-approval-hub'
    )
  })

  it('shows "✓ Copied" immediately after click', async () => {
    render(<CopyButton text="some code" />)
    await act(async () => {
      fireEvent.click(screen.getByRole('button'))
    })
    expect(screen.getByRole('button')).toHaveTextContent('✓ Copied')
  })
})
```

- [ ] **Step 2: Run to verify it fails**

```bash
npx jest __tests__/components/CopyButton.test.tsx --no-coverage
```

Expected: FAIL — `Cannot find module '@/components/CopyButton'`

- [ ] **Step 3: Create `components/CopyButton.tsx`**

```tsx
// components/CopyButton.tsx
'use client'
import { useState } from 'react'

export default function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={copy}
      className="absolute top-2 right-2 bg-white/10 hover:bg-white/20 border border-white/20 text-slate-400 hover:text-white rounded px-2 py-1 text-xs transition-colors"
    >
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  )
}
```

- [ ] **Step 4: Run to verify it passes**

```bash
npx jest __tests__/components/CopyButton.test.tsx --no-coverage
```

Expected: PASS — 3 tests passing

- [ ] **Step 5: Commit**

```bash
git add components/CopyButton.tsx __tests__/components/CopyButton.test.tsx
git commit -m "feat: add CopyButton client component for docs code blocks"
```

---

### Task 4: DocsNav scroll-spy component

**Files:**
- Create: `components/DocsNav.tsx`
- Create: `__tests__/components/DocsNav.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `__tests__/components/DocsNav.test.tsx`:

```tsx
/** @jest-environment jsdom */
import { render, screen } from '@testing-library/react'
import DocsNav from '@/components/DocsNav'

// IntersectionObserver is not available in jsdom — stub it
beforeAll(() => {
  global.IntersectionObserver = class {
    observe() {}
    disconnect() {}
    unobserve() {}
  } as unknown as typeof IntersectionObserver
})

describe('DocsNav', () => {
  it('renders all top-level group labels', () => {
    render(<DocsNav />)
    expect(screen.getByText('THE PROBLEM')).toBeInTheDocument()
    expect(screen.getByText('GET RUNNING')).toBeInTheDocument()
    expect(screen.getByText('CODE PATTERNS')).toBeInTheDocument()
    expect(screen.getByText('ENTERPRISE')).toBeInTheDocument()
    expect(screen.getByText('REFERENCE')).toBeInTheDocument()
  })

  it('renders section links', () => {
    render(<DocsNav />)
    expect(screen.getByRole('link', { name: 'Why this exists' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '1. Deploy your hub' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'SDK parameters' })).toBeInTheDocument()
  })

  it('first section link is active by default', () => {
    render(<DocsNav />)
    const firstLink = screen.getByRole('link', { name: 'Why this exists' })
    expect(firstLink).toHaveClass('text-green-700')
  })
})
```

- [ ] **Step 2: Run to verify it fails**

```bash
npx jest __tests__/components/DocsNav.test.tsx --no-coverage
```

Expected: FAIL — `Cannot find module '@/components/DocsNav'`

- [ ] **Step 3: Create `components/DocsNav.tsx`**

```tsx
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
```

- [ ] **Step 4: Run to verify it passes**

```bash
npx jest __tests__/components/DocsNav.test.tsx --no-coverage
```

Expected: PASS — 3 tests passing

- [ ] **Step 5: Commit**

```bash
git add components/DocsNav.tsx __tests__/components/DocsNav.test.tsx
git commit -m "feat: add DocsNav client component with IntersectionObserver scroll-spy"
```

---

### Task 5: Docs layout and CSS module

**Files:**
- Create: `app/docs/layout.tsx`
- Create: `app/docs/docs.module.css`

- [ ] **Step 1: Create `app/docs/docs.module.css`**

```css
/* app/docs/docs.module.css */
@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fadeUp {
  opacity: 0;
  animation: fadeUp 0.45s ease forwards;
}
```

- [ ] **Step 2: Create `app/docs/layout.tsx`**

```tsx
// app/docs/layout.tsx
import Link from 'next/link'
import DocsNav from '@/components/DocsNav'

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="font-extrabold text-green-600 text-base">⚡ Approval Hub Docs</span>
          <div className="hidden md:flex items-center gap-6 text-sm text-slate-500">
            <a href="#why" className="hover:text-slate-900 transition-colors">Why this exists</a>
            <a href="#deploy" className="hover:text-slate-900 transition-colors">Quick Start</a>
            <a href="#basic" className="hover:text-slate-900 transition-colors">Code Patterns</a>
            <a href="#enterprise" className="hover:text-slate-900 transition-colors">Enterprise</a>
            <a href="#sdk-params" className="hover:text-slate-900 transition-colors">Reference</a>
          </div>
          <Link
            href="/"
            className="text-sm text-slate-500 border border-slate-200 rounded-md px-3 py-1.5 hover:bg-slate-50 transition-colors"
          >
            ← Dashboard
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 flex">
        <aside className="w-56 shrink-0 py-8">
          <div className="sticky top-20">
            <DocsNav />
          </div>
        </aside>
        <main className="flex-1 min-w-0 py-10 pl-12">{children}</main>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify the docs route shell exists**

```bash
npx next build 2>&1 | grep -E "(docs|error|Error)" | head -20
```

Expected: Build succeeds. `/docs` route appears (even without page.tsx, Next.js may warn — ignore until Task 6 adds the page).

- [ ] **Step 4: Commit**

```bash
git add "app/docs/layout.tsx" "app/docs/docs.module.css"
git commit -m "feat: add docs layout with sticky top nav, left section nav, and CSS fade-up animation"
```

---

### Task 6: Docs page content

**Files:**
- Create: `app/docs/page.tsx`

This is a static server component — no data fetching. All code samples are defined as string constants at the top so `CopyButton` can receive them as props.

- [ ] **Step 1: Create `app/docs/page.tsx`**

Create the file with the content below. The file is long but entirely static — no logic beyond rendering.

```tsx
// app/docs/page.tsx
import styles from './docs.module.css'
import CopyButton from '@/components/CopyButton'

const INSTALL_CMD = 'pip install langgraph-approval-hub'

const BASIC_CODE = `from langgraph_approval_hub import request_approval

decision = request_approval(
    hub_url="https://your-hub.vercel.app",
    api_token="your-api-secret-token",
    agent_name="Finance Agent",
    action_description="Process $4,200 refund for 12 customers",
    assignee="alice@acme.com",
    assignee_type="person",
)

if decision == "approved":
    process_refunds()`

const TEAM_CODE = `decision = request_approval(
    hub_url="https://your-hub.vercel.app",
    api_token="your-api-secret-token",
    agent_name="Data Pipeline Agent",
    action_description="Drop and recreate the events_staging table",
    assignee="data-team",        # team name from Settings → Teams
    assignee_type="team",
)`

const ESCALATION_CODE = `decision = request_approval(
    hub_url="https://your-hub.vercel.app",
    api_token="your-api-secret-token",
    agent_name="Billing Agent",
    action_description="Issue $12,000 credit to enterprise account ACME-001",
    assignee="billing@acme.com",
    assignee_type="person",
    escalate_to="cfo@acme.com",  # notified if no response
    timeout_minutes=30,           # escalates after 30 min
)`

const REASONING_CODE = `decision = request_approval(
    hub_url="https://your-hub.vercel.app",
    api_token="your-api-secret-token",
    agent_name="Customer Service Agent",
    action_description="Issue full refund of $340 to customer #A-4821",
    assignee="support-team",
    assignee_type="team",
    agent_reasoning="""
1. Customer purchased on 2024-03-01, within the 30-day return window.
2. Item returned in original packaging — no restocking fee applies.
3. Customer account has no prior refund requests.
4. Refund amount matches the original charge exactly.
""",
)`

const ERROR_CODE = `try:
    decision = request_approval(
        hub_url="https://your-hub.vercel.app",
        api_token="your-api-secret-token",
        agent_name="Finance Agent",
        action_description="Wire $50,000 to vendor account",
        assignee="finance-team",
        assignee_type="team",
        timeout_minutes=60,
    )
except TimeoutError:
    # Nobody responded — fail safe, do nothing
    notify_team("Approval timed out — no action taken")
    return
except RuntimeError as e:
    # Hub unreachable or rejected the request
    log_error(e)
    raise

if decision == "approved":
    execute_wire_transfer()`

function CodeBlock({ code, label }: { code: string; label?: string }) {
  return (
    <div className="relative my-4">
      {label && (
        <div className="inline-block text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-900 rounded-t-lg px-4 pt-2 pb-0">
          {label}
        </div>
      )}
      <pre
        className={`bg-slate-900 text-slate-200 rounded-lg ${label ? 'rounded-tl-none' : ''} p-5 overflow-x-auto text-[13px] leading-7 font-mono`}
      >
        <code>{code}</code>
      </pre>
      <CopyButton text={code} />
    </div>
  )
}

function Callout({ type, children }: { type: 'tip' | 'warn'; children: React.ReactNode }) {
  const base = 'rounded-lg p-4 text-sm leading-relaxed flex gap-3 my-4'
  if (type === 'tip')
    return <div className={`${base} bg-green-50 border border-green-200 text-green-900`}><span>ℹ</span><div>{children}</div></div>
  return <div className={`${base} bg-amber-50 border border-amber-200 text-amber-900`}><span>⚠</span><div>{children}</div></div>
}

function SectionTitle({ eyebrow, title, sub }: { eyebrow: string; title: string; sub: string }) {
  return (
    <div className="mb-8">
      <div className="text-xs font-bold uppercase tracking-widest text-green-600 mb-2">{eyebrow}</div>
      <h2 className="text-2xl font-extrabold text-slate-900 mb-3 leading-tight">{title}</h2>
      <p className="text-slate-500 text-base leading-relaxed max-w-2xl">{sub}</p>
    </div>
  )
}

export default function DocsPage() {
  return (
    <div className="space-y-20 pb-20">

      {/* ── WHY THIS EXISTS ── */}
      <section id="why">
        <SectionTitle
          eyebrow="Why this exists"
          title="LangGraph gives you interrupt(). Everything else is your problem."
          sub="The primitive exists — pause an agent and wait for a human. But who gets notified? Where do they decide? What if they don't respond? These are real complaints from engineers running LangGraph in production."
        />
        <div className="grid grid-cols-2 gap-3">
          {[
            {
              tag: '⚠ GitHub Issue #6270 · 47 upvotes',
              tagClass: 'bg-amber-100 text-amber-800',
              title: 'Messages from nested agents don\'t stream after interrupt/resume',
              body: 'The agent silently pauses. There\'s no way to show the approver what\'s happening or why.',
              delay: '0.1s',
            },
            {
              tag: '⚠ GitHub Issue #3421 · 31 upvotes',
              tagClass: 'bg-amber-100 text-amber-800',
              title: 'Custom auth for human-in-the-loop is locked behind the enterprise plan',
              body: 'Teams need approval routing. The open-source tier offers none. Build it yourself or pay up.',
              delay: '0.25s',
            },
            {
              tag: '💬 Production engineer',
              tagClass: 'bg-sky-100 text-sky-800',
              title: '"When a thread is interrupted, nobody gets notified. No email, no Slack, no ping of any kind."',
              body: '',
              delay: '0.4s',
            },
            {
              tag: '💬 Production engineer',
              tagClass: 'bg-sky-100 text-sky-800',
              title: '"There\'s no built-in mechanism to say \'if nobody responds in 30 minutes, escalate to the backup approver.\'"',
              body: '',
              delay: '0.55s',
            },
          ].map((card, i) => (
            <div
              key={i}
              className={`bg-white border border-slate-200 rounded-xl p-5 ${styles.fadeUp}`}
              style={{ animationDelay: card.delay }}
            >
              <span className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded mb-3 ${card.tagClass}`}>
                {card.tag}
              </span>
              <p className="text-sm font-semibold text-slate-800 leading-snug">{card.title}</p>
              {card.body && <p className="text-sm text-slate-500 mt-2 leading-relaxed">{card.body}</p>}
            </div>
          ))}
        </div>
        <div
          className={`mt-4 bg-green-50 border border-green-200 rounded-xl p-5 flex items-center gap-4 ${styles.fadeUp}`}
          style={{ animationDelay: '0.7s' }}
        >
          <span className="text-3xl">⚡</span>
          <div>
            <p className="font-bold text-green-900 text-base">Approval Hub fills every gap — in 3 lines of code.</p>
            <p className="text-green-800 text-sm mt-0.5 opacity-90">Dashboard · Email notifications · Audit trail · Escalation · Team routing. Open source. Free to host.</p>
          </div>
        </div>
      </section>

      {/* ── GET RUNNING ── */}
      <section>
        <SectionTitle
          eyebrow="Get Running"
          title="Up and running in 5 minutes"
          sub="Four steps. One Vercel deploy, one env var table, one pip install, three lines of Python."
        />

        {/* Step 1 */}
        <div id="deploy" className="flex gap-4 mb-8">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-bold shrink-0">1</div>
            <div className="w-0.5 bg-slate-200 flex-1 mt-2" />
          </div>
          <div className="flex-1 pb-8">
            <h3 className="font-bold text-slate-900 text-base mb-1 pt-1">Deploy your hub to Vercel</h3>
            <p className="text-slate-500 text-sm mb-3">One click. Vercel clones the repo and prompts you for env vars during setup.</p>
            <a
              href="https://vercel.com/new/clone?repository-url=https://github.com/suryamr2002/langgraph-approval-hub"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-slate-900 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-slate-700 transition-colors"
            >
              ▲ Deploy to Vercel
            </a>
          </div>
        </div>

        {/* Step 2 */}
        <div id="env" className="flex gap-4 mb-8">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-bold shrink-0">2</div>
            <div className="w-0.5 bg-slate-200 flex-1 mt-2" />
          </div>
          <div className="flex-1 pb-8">
            <h3 className="font-bold text-slate-900 text-base mb-1 pt-1">Set environment variables</h3>
            <p className="text-slate-500 text-sm mb-3">In Vercel → Project Settings → Environment Variables, add:</p>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 text-left">
                  <th className="border border-slate-200 px-3 py-2 font-semibold text-slate-600 text-xs uppercase">Variable</th>
                  <th className="border border-slate-200 px-3 py-2 font-semibold text-slate-600 text-xs uppercase">Where to get it</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['SUPABASE_URL', 'Supabase → Project Settings → API'],
                  ['SUPABASE_SERVICE_ROLE_KEY', 'Supabase → Project Settings → API → service_role'],
                  ['SUPABASE_ANON_KEY', 'Supabase → Project Settings → API → anon/public'],
                  ['API_SECRET_TOKEN', 'Any random string — becomes your auth key'],
                  ['NEXT_PUBLIC_APP_URL', 'Your Vercel deployment URL (e.g. https://my-hub.vercel.app)'],
                  ['RESEND_API_KEY', 'resend.com → API Keys (optional — enables email)'],
                  ['SLACK_WEBHOOK_URL', 'Slack → Incoming Webhooks (optional — enables Slack)'],
                ].map(([key, desc]) => (
                  <tr key={key} className="border-b border-slate-100">
                    <td className="border border-slate-200 px-3 py-2">
                      <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono text-slate-800">{key}</code>
                    </td>
                    <td className="border border-slate-200 px-3 py-2 text-slate-600">{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Step 3 */}
        <div id="install" className="flex gap-4 mb-8">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-bold shrink-0">3</div>
            <div className="w-0.5 bg-slate-200 flex-1 mt-2" />
          </div>
          <div className="flex-1 pb-8">
            <h3 className="font-bold text-slate-900 text-base mb-1 pt-1">Install the SDK</h3>
            <CodeBlock code={INSTALL_CMD} />
            <Callout type="tip">
              Requires Python 3.9+. The only dependency is <code className="bg-green-100 px-1 rounded font-mono text-xs">requests</code> — no LangChain version pinning, no conflicts.
            </Callout>
          </div>
        </div>

        {/* Step 4 */}
        <div id="agent" className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-bold shrink-0">4</div>
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-slate-900 text-base mb-1 pt-1">Add to your agent</h3>
            <p className="text-slate-500 text-sm mb-2">Three lines. Paste anywhere inside a LangGraph node function.</p>
            <CodeBlock code={BASIC_CODE} label="Python" />
            <Callout type="tip">
              <code className="bg-green-100 px-1 rounded font-mono text-xs">request_approval()</code> blocks until a human decides.
              Alice gets an email with a direct dashboard link. Your agent resumes the moment she clicks Approve or Reject.
            </Callout>
          </div>
        </div>
      </section>

      {/* ── CODE PATTERNS ── */}
      <section>
        <SectionTitle
          eyebrow="Code Patterns"
          title="Real-world examples"
          sub="Every team has slightly different requirements. These patterns cover the most common ones."
        />

        <div id="basic" className="mb-10">
          <h3 className="text-base font-bold text-slate-900 mb-1">Basic approval — person assignee</h3>
          <p className="text-sm text-slate-500 mb-2">The simplest case: one person must approve before the agent continues.</p>
          <CodeBlock code={BASIC_CODE} label="Python" />
        </div>

        <div id="team-routing" className="mb-10">
          <h3 className="text-base font-bold text-slate-900 mb-1">Route to a team</h3>
          <p className="text-sm text-slate-500 mb-2">
            Use <code className="bg-slate-100 px-1 rounded font-mono text-xs">assignee_type=&quot;team&quot;</code> when multiple people share responsibility.
            All team members are notified — first to respond wins.
          </p>
          <CodeBlock code={TEAM_CODE} label="Python" />
        </div>

        <div id="escalation" className="mb-10">
          <h3 className="text-base font-bold text-slate-900 mb-1">Escalate if no response</h3>
          <p className="text-sm text-slate-500 mb-2">
            If the assignee doesn&apos;t respond within <code className="bg-slate-100 px-1 rounded font-mono text-xs">timeout_minutes</code>, the hub
            re-notifies the escalation target and marks the request as Escalated on the dashboard.
          </p>
          <CodeBlock code={ESCALATION_CODE} label="Python" />
        </div>

        <div id="errors" className="mb-4">
          <h3 className="text-base font-bold text-slate-900 mb-1">Show agent reasoning + handle errors</h3>
          <p className="text-sm text-slate-500 mb-2">
            Pass <code className="bg-slate-100 px-1 rounded font-mono text-xs">agent_reasoning</code> to give the approver full context.
            Always wrap in try/except — the SDK raises <code className="bg-slate-100 px-1 rounded font-mono text-xs">TimeoutError</code> and <code className="bg-slate-100 px-1 rounded font-mono text-xs">RuntimeError</code>.
          </p>
          <CodeBlock code={REASONING_CODE} label="With reasoning" />
          <CodeBlock code={ERROR_CODE} label="With error handling" />
          <Callout type="warn">
            <strong>Default safe:</strong> if <code className="bg-amber-100 px-1 rounded font-mono text-xs">decision == &quot;rejected&quot;</code> or an exception is raised, your agent should do nothing.
            Never treat a missing decision as implicit approval.
          </Callout>
        </div>
      </section>

      {/* ── ENTERPRISE ── */}
      <section>
        <SectionTitle
          eyebrow="Enterprise"
          title="Deploy for your whole org"
          sub="One hub instance handles all your agents. Route approvals to the right team, escalate to managers, export decisions for compliance."
        />

        <div id="enterprise" className="mb-8">
          <h3 className="text-base font-bold text-slate-900 mb-3">How it fits together</h3>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 font-mono text-xs text-slate-600 leading-8">
            <div><span className="text-green-700 font-bold">Your LangGraph Agent</span> → POST /api/interrupt → Approval Hub (Vercel)</div>
            <div className="pl-8">↓ saves to Supabase</div>
            <div className="pl-8">↓ fires notifications → <span className="text-sky-700">Email (Resend)</span> + <span className="text-purple-700">Slack webhook</span></div>
            <div className="pl-8">↓ Approver opens dashboard link</div>
            <div className="pl-8">↓ Clicks Approve / Reject</div>
            <div className="pl-8">↓ <span className="text-green-700 font-bold">Agent resumes</span> with &quot;approved&quot; or &quot;rejected&quot;</div>
          </div>
        </div>

        <div id="notifications" className="mb-8">
          <h3 className="text-base font-bold text-slate-900 mb-3">Enabling notifications</h3>
          <p className="text-sm text-slate-500 mb-3">Set these two env vars in Vercel — both are free:</p>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th className="border border-slate-200 px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Variable</th>
                <th className="border border-slate-200 px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Service</th>
                <th className="border border-slate-200 px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase">What it enables</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-slate-200 px-3 py-2"><code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-xs">RESEND_API_KEY</code></td>
                <td className="border border-slate-200 px-3 py-2 text-slate-600">resend.com — free up to 100 emails/day</td>
                <td className="border border-slate-200 px-3 py-2 text-slate-600">Email to assignee (and team members) on every new request</td>
              </tr>
              <tr>
                <td className="border border-slate-200 px-3 py-2"><code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-xs">SLACK_WEBHOOK_URL</code></td>
                <td className="border border-slate-200 px-3 py-2 text-slate-600">Slack Incoming Webhooks — free</td>
                <td className="border border-slate-200 px-3 py-2 text-slate-600">Slack message to your channel on every new request + escalation</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div id="audit-trail">
          <h3 className="text-base font-bold text-slate-900 mb-2">Audit trail</h3>
          <p className="text-sm text-slate-500 mb-2">
            Every decision is recorded — agent name, action, who decided, when, and any note they left.
            Go to the <a href="/audit" className="text-green-700 underline">Audit Log</a> to view or export as JSON.
          </p>
          <Callout type="tip">
            The audit log is append-only. Approved and rejected decisions are both recorded. Use{' '}
            <code className="bg-green-100 px-1 rounded font-mono text-xs">↗ Export JSON</code> for compliance exports.
          </Callout>
        </div>
      </section>

      {/* ── REFERENCE ── */}
      <section>
        <SectionTitle
          eyebrow="Reference"
          title="SDK & API reference"
          sub="Full parameter list and API endpoint table."
        />

        <div id="sdk-params" className="mb-12">
          <h3 className="text-base font-bold text-slate-900 mb-3">SDK parameters</h3>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th className="border border-slate-200 px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Parameter</th>
                <th className="border border-slate-200 px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Type</th>
                <th className="border border-slate-200 px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Required</th>
                <th className="border border-slate-200 px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Description</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['hub_url', 'str', true, 'Your Approval Hub URL'],
                ['api_token', 'str', true, 'Your API_SECRET_TOKEN env var value'],
                ['agent_name', 'str', true, 'Name shown in the dashboard'],
                ['action_description', 'str', true, 'Plain-English description of what the agent wants to do'],
                ['assignee', 'str', true, 'Email address or team name'],
                ['assignee_type', '"person" | "team"', true, 'Whether assignee is an individual or a team'],
                ['agent_reasoning', 'str', false, 'Step-by-step reasoning shown to the approver on the detail page'],
                ['escalate_to', 'str', false, 'Email to escalate to if timeout exceeded'],
                ['timeout_minutes', 'int', false, 'Minutes before escalation triggers (default: 60)'],
                ['poll_interval', 'int', false, 'Seconds between status polls (default: 10)'],
              ].map(([param, type, req, desc]) => (
                <tr key={param as string} className="border-b border-slate-100">
                  <td className="border border-slate-200 px-3 py-2">
                    <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-xs">{param}</code>
                  </td>
                  <td className="border border-slate-200 px-3 py-2 font-mono text-xs text-slate-600">{type}</td>
                  <td className="border border-slate-200 px-3 py-2">
                    {req
                      ? <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-0.5 rounded">Required</span>
                      : <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-0.5 rounded">Optional</span>
                    }
                  </td>
                  <td className="border border-slate-200 px-3 py-2 text-slate-600">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div id="api-endpoints">
          <h3 className="text-base font-bold text-slate-900 mb-3">API endpoints</h3>
          <p className="text-sm text-slate-500 mb-3">All endpoints are on your Vercel deployment URL. POST /api/interrupt requires a Bearer token in the Authorization header.</p>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th className="border border-slate-200 px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Method</th>
                <th className="border border-slate-200 px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Route</th>
                <th className="border border-slate-200 px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Auth</th>
                <th className="border border-slate-200 px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Description</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['POST', '/api/interrupt', 'Bearer token', 'Create approval request, fire notifications'],
                ['GET', '/api/approvals', 'Bearer token', 'List approvals (?status=pending|escalated)'],
                ['GET', '/api/approvals/[id]', 'Bearer token', 'Get single approval with notification log'],
                ['POST', '/api/approvals/[id]/decide', 'None', 'Submit approve or reject decision'],
                ['GET', '/api/audit', 'None', 'Full audit log — also used for JSON export'],
                ['GET', '/api/teams', 'None', 'List all configured teams'],
                ['POST', '/api/teams', 'None', 'Create or update a team'],
              ].map(([method, route, auth, desc]) => (
                <tr key={route as string} className="border-b border-slate-100">
                  <td className="border border-slate-200 px-3 py-2">
                    <code className={`text-xs font-bold px-1.5 py-0.5 rounded font-mono ${method === 'POST' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>{method}</code>
                  </td>
                  <td className="border border-slate-200 px-3 py-2 font-mono text-xs text-slate-700">{route}</td>
                  <td className="border border-slate-200 px-3 py-2 text-slate-500 text-xs">{auth}</td>
                  <td className="border border-slate-200 px-3 py-2 text-slate-600">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

    </div>
  )
}
```

- [ ] **Step 2: Verify the page builds**

```bash
npx next build 2>&1 | tail -20
```

Expected: Build completes. Route `/docs` appears as a static page (SSG). No TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add "app/docs/page.tsx"
git commit -m "feat: add docs page with full narrative content, code patterns, and reference tables"
```

---

### Task 7: Add Docs link to sidebar

**Files:**
- Modify: `components/Sidebar.tsx`

- [ ] **Step 1: Update the nav array in `components/Sidebar.tsx`**

Find this section (lines 6-10):

```typescript
const nav = [
  { label: 'Pending', href: '/', icon: '📋' },
  { label: 'Audit Log', href: '/audit', icon: '📊' },
  { label: 'Settings', href: '/settings', icon: '⚙️' },
]
```

Replace with:

```typescript
const nav = [
  { label: 'Pending', href: '/', icon: '📋' },
  { label: 'Audit Log', href: '/audit', icon: '📊' },
  { label: 'Settings', href: '/settings', icon: '⚙️' },
  { label: 'Docs', href: '/docs', icon: '📖' },
]
```

- [ ] **Step 2: Run all tests**

```bash
npx jest --no-coverage 2>&1 | tail -20
```

Expected: All tests pass.

- [ ] **Step 3: Verify the build**

```bash
npx next build 2>&1 | tail -10
```

Expected: Build succeeds with no errors.

- [ ] **Step 4: Commit**

```bash
git add components/Sidebar.tsx
git commit -m "feat: add Docs link to sidebar nav"
```

---

### Task 8: Final verification

- [ ] **Step 1: Run the full test suite**

```bash
npx jest --no-coverage 2>&1
```

Expected: All tests pass. Count should include:
- `resolveEmailRecipients.test.ts` — 3 tests
- `CopyButton.test.tsx` — 3 tests
- `DocsNav.test.tsx` — 3 tests
- All pre-existing tests

- [ ] **Step 2: Run dev server and verify manually**

```bash
npx next dev
```

Open these URLs and verify:
- `http://localhost:3000/` — dashboard loads with sidebar ✓
- `http://localhost:3000/audit` — audit log loads with sidebar ✓
- `http://localhost:3000/settings` — settings loads with sidebar ✓
- `http://localhost:3000/docs` — docs page loads WITHOUT sidebar, with own top nav and left section nav ✓
- Click "← Dashboard" in the docs top nav — returns to `/` ✓
- Click "Docs" in the sidebar — navigates to `/docs` ✓
- Scroll down the docs page — left nav active link updates ✓
- Click a code block's Copy button — code copies to clipboard ✓

- [ ] **Step 3: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: address any issues found during manual verification"
```
