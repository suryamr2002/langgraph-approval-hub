# Docs Page & Notifications Fix — Design Spec
**Date:** 2026-04-18
**Status:** Approved by Surya
**Owner:** surya-mr (GitHub)

---

## Goal

Build a professional developer docs page at `/docs` with a brand-marketer narrative flow, fix team email resolution in the notifications system, and add a Docs link to the sidebar.

---

## Scope

1. Route restructure — move existing pages into `app/(main)/` group
2. Docs page at `/docs` — standalone layout (Option B: Stripe/Vercel-style)
3. Fix team email resolution in `lib/notifications.ts`
4. Add Docs link to sidebar nav

**Out of scope:** Slack settings UI, auth, bulk actions, docs hosting on separate domain.

---

## Feature 1: Route Group Restructure

Move all existing app pages into a `(main)` route group so they share the sidebar layout. The `/docs` page lives outside this group with its own layout.

**Before:**
```
app/
  layout.tsx          ← renders Sidebar for ALL routes
  page.tsx
  audit/page.tsx
  settings/page.tsx
  approval/[id]/page.tsx
  api/...
```

**After:**
```
app/
  layout.tsx          ← minimal: html/body/font/demo banner only (no Sidebar)
  (main)/
    layout.tsx        ← renders Sidebar (wraps dashboard routes only)
    page.tsx
    audit/page.tsx
    settings/page.tsx
    approval/[id]/page.tsx
  docs/
    layout.tsx        ← docs-specific layout (top nav + left section nav)
    page.tsx          ← docs content
  api/...             ← unchanged
```

### `app/layout.tsx` (after)
- Keeps: `<html>`, `<body>`, Inter font, demo banner
- Removes: `<Sidebar />` and the flex wrapper
- Children rendered directly (no sidebar frame)

### `app/(main)/layout.tsx` (new)
- Wraps children in the sidebar flex frame (exactly what `app/layout.tsx` had before)
- Renders `<Sidebar />`

No changes to any page content — only the layout wrappers change.

---

## Feature 2: Docs Page

### Layout: `app/docs/layout.tsx`

- Top nav bar (sticky):
  - Left: `⚡ Approval Hub Docs` logo
  - Center: section anchor links — Why this exists · Quick Start · Code Patterns · Enterprise · API Reference
  - Right: `← Dashboard` button (links to `/`)
- Body: flex row with left section nav (sticky, 220px wide) + main content area

### Left Section Nav

```
GETTING STARTED
  Why this exists       ← #why
  1. Deploy your hub    ← #deploy
  2. Configure env vars ← #env
  3. Install the SDK    ← #install
  4. Add to your agent  ← #agent

CODE PATTERNS
  Basic approval        ← #basic
  Team routing          ← #teams
  Escalation & timeout  ← #escalation
  Error handling        ← #errors

ENTERPRISE
  Teams & routing       ← #enterprise-teams
  Notifications         ← #enterprise-notifications
  Audit trail           ← #audit

REFERENCE
  SDK parameters        ← #sdk-params
  API endpoints         ← #api-endpoints
```

Active link: green background + green text. Scroll-spy updates active link as user scrolls.

### Docs Content: `app/docs/page.tsx`

Single server component. No data fetching needed. All content is static.

#### Section 1 — Why This Exists (lead with pain)

Eyebrow: `Why this exists`
Title: `LangGraph gives you interrupt(). Everything else is your problem.`
Body: 2-sentence explanation of the gap.

Pain grid — 2×2 CSS grid, four animated cards (CSS `@keyframes slideInUp`, staggered `animation-delay`):
- Card 1: GitHub Issue #6270 (47 upvotes) — nested agent streaming after interrupt/resume
- Card 2: GitHub Issue #3421 (31 upvotes) — custom auth locked behind enterprise plan
- Card 3: Engineer quote — "no email, no Slack, no ping of any kind"
- Card 4: Engineer quote — "no built-in escalation mechanism"

Solution callout (green banner, also animated): "Approval Hub fills every gap — in 3 lines of code."

#### Section 2 — Get Running (numbered steps with connector lines)

Eyebrow: `Get Running`
Title: `Up and running in 5 minutes`

Four steps rendered as a vertical stepper (numbered circles connected by lines):

**Step 1 — Deploy your hub**
- "Deploy to Vercel" button (black, links to Vercel clone URL)

**Step 2 — Set environment variables**
- Table of required env vars:

| Variable | Where to get it |
|---|---|
| `SUPABASE_URL` | Supabase → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API → service_role |
| `API_SECRET_TOKEN` | Any random string — this is your auth key |
| `NEXT_PUBLIC_APP_URL` | Your Vercel deployment URL |

**Step 3 — Install the SDK**
```bash
pip install langgraph-approval-hub
```
Tip callout: "Requires Python 3.9+. Only dependency is `requests` — no version conflicts."

**Step 4 — Add to your agent**
Full code block with syntax highlighting (import + `request_approval()` call + `if decision == "approved"` branch).
Tip callout explaining the flow: SDK posts → assignee emailed → human decides → agent resumes.

#### Section 3 — Code Patterns

Eyebrow: `Code Patterns`
Title: `Real-world examples`

Four sub-sections, each with an h3 heading, one-line description, and a code block with copy button:

**Basic approval** — person assignee, simple if/else

**Team routing:**
```python
decision = request_approval(
    ...
    assignee="data-team",       # team name from Settings → Teams
    assignee_type="team",
)
```

**Escalation & timeout:**
```python
decision = request_approval(
    ...
    escalate_to="cfo@acme.com",
    timeout_minutes=30,
)
```

**Error handling (try/except):**
```python
try:
    decision = request_approval(...)
except TimeoutError:
    notify_team("Approval timed out — no action taken")
    return
except RuntimeError as e:
    log_error(e)
    raise

if decision == "approved":
    execute_wire_transfer()
```
Warning callout: "Never treat a missing decision as implicit approval."

#### Section 4 — Enterprise

Eyebrow: `Enterprise`
Title: `Deploy for your whole org`

Architecture diagram (simple CSS boxes with arrows):
```
Your LangGraph Agents → POST /api/interrupt → Approval Hub (Vercel) → Supabase DB
                                                     ↓
                                          Notification engine → Email (Resend) + Slack
                                                     ↓
                                          Approver's dashboard → Decision sent back to agent
```

Teams setup: 2 sentences pointing to Settings → Teams.

Notifications table:

| Variable | Service | What it enables |
|---|---|---|
| `RESEND_API_KEY` | resend.com — free up to 100/day | Email to assignee on every new request |
| `SLACK_WEBHOOK_URL` | Slack Incoming Webhooks — free | Slack message to channel on every new request |

#### Section 5 — Reference

SDK parameters table (full, 10 rows, Required/Optional badges).

API endpoints table:

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/interrupt` | Bearer token | Create approval request, fire notifications |
| GET | `/api/approvals` | Bearer token | List approvals (`?status=pending\|escalated`) |
| GET | `/api/approvals/[id]` | Bearer token | Get single approval detail |
| POST | `/api/approvals/[id]/decide` | None | Submit approve/reject decision |
| GET | `/api/audit` | None | Full audit log (JSON export) |
| GET | `/api/teams` | None | List teams |
| POST | `/api/teams` | None | Create/update team |

---

## Feature 3: Fix Team Email Resolution

**File:** `lib/notifications.ts`

**Problem:** `sendNotifications(approval)` calls `sendEmail(approval.assignee, ...)`. When `assignee_type === "team"`, `approval.assignee` is a team name string (e.g. `"finance-team"`), not an email address. The email silently fails or sends to an invalid address.

**Fix:** In `sendNotifications`, before calling `sendEmail`, check `assignee_type`:
- If `"person"`: send to `approval.assignee` (already an email address)
- If `"team"`: query Supabase `teams` table for `name === approval.assignee`, get `members` array, send email to each member

```typescript
async function resolveEmailRecipients(approval: Approval): Promise<string[]> {
  if (approval.assignee_type === 'person') {
    return [approval.assignee]
  }
  const { data } = await supabaseAdmin
    .from('teams')
    .select('members')
    .eq('name', approval.assignee)
    .single()
  return data?.members ?? []
}
```

Then in `sendNotifications`:
```typescript
const recipients = await resolveEmailRecipients(approval)
await Promise.allSettled([
  sendSlack(slackText),
  ...recipients.map((r) => sendEmail(r, subject, emailHtml)),
])
```

---

## Feature 4: Docs Link in Sidebar

**File:** `components/Sidebar.tsx`

Add a new nav item to the `nav` array:
```typescript
{ label: 'Docs', href: '/docs', icon: '📖' }
```

Position: below Settings (last item). The link navigates to `/docs` in the same tab.

Note: because `/docs` uses its own layout (no sidebar), navigating to Docs will visually transition out of the sidebar frame — this is correct and expected.

---

## Styling Notes

- All docs styles are inline Tailwind classes — no new CSS files
- Code blocks: `bg-slate-900` background, syntax colors via `text-*` spans, `font-mono`
- Animations: CSS `@keyframes` defined in `app/docs/docs.module.css` — imported into `app/docs/page.tsx`. Server components support CSS modules. The pain cards get `className={styles.fadeUp}` with `animationDelay` set via inline style.
- Copy buttons: client component `CopyButton` that calls `navigator.clipboard.writeText()`
- Scroll-spy for active nav link: client component `DocsNav` using `IntersectionObserver`

---

## Files Changed

| File | Change |
|---|---|
| `app/layout.tsx` | Remove Sidebar, keep html/body/demo banner only |
| `app/(main)/layout.tsx` | New — renders Sidebar for dashboard routes |
| `app/(main)/page.tsx` | Moved from `app/page.tsx` |
| `app/(main)/audit/page.tsx` | Moved from `app/audit/page.tsx` |
| `app/(main)/settings/page.tsx` | Moved from `app/settings/page.tsx` |
| `app/(main)/approval/[id]/page.tsx` | Moved from `app/approval/[id]/page.tsx` |
| `app/docs/layout.tsx` | New — docs top nav + left section nav |
| `app/docs/page.tsx` | New — all docs content (static server component) |
| `app/docs/docs.module.css` | New — `@keyframes fadeUp` animation for pain cards |
| `components/CopyButton.tsx` | New — client component for copy-to-clipboard |
| `components/DocsNav.tsx` | New — client component for scroll-spy active link |
| `components/Sidebar.tsx` | Add Docs link |
| `lib/notifications.ts` | Fix team email resolution |

No database changes. No new API routes. No changes to existing API routes.

---

## Testing

- Route restructure: verify all existing routes (`/`, `/audit`, `/settings`, `/approval/[id]`) still render with sidebar
- `/docs`: verify no sidebar renders, top nav shows, left nav shows, all sections visible
- Scroll-spy: verify active nav link updates as user scrolls through sections
- Copy button: verify code blocks copy to clipboard
- Team email fix: verify when `assignee_type=team`, all team member emails receive the notification
- Docs link in sidebar: verify clicking Docs navigates to `/docs`
