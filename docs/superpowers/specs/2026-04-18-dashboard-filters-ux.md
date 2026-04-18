# Dashboard Filters & UX Improvements — Design Spec
**Date:** 2026-04-18
**Status:** Approved by Surya
**Owner:** surya-mr (GitHub)

---

## Goal

Make the dashboard usable for real enterprise teams with many pending approvals, and improve the demo experience for new visitors.

---

## Scope

1. Status filter tabs (server-side) + search box (client-side) on the dashboard
2. Reset button for demo mode
3. Export JSON opens in new tab
4. Filter-aware empty states
5. Demo banner upgrade
6. Stats bar stays global (always system-wide, never filter-scoped)

**Out of scope:** auth, bulk approve, date-range filter on audit, docs page.

---

## Feature 1: Status Filter Tabs + Search

### Status Tabs (server-side)

Three tab buttons above the approval table: `All` · `Pending` · `Escalated`.

- Clicking a tab updates the URL: `/?status=pending` or `/?status=escalated`. `All` has no param (`/`).
- `app/page.tsx` reads `searchParams.status` and passes it to `GET /api/approvals?status=pending`.
- The API route already supports the `status` query param — no backend change needed.
- Active tab: green bottom border + green text. Inactive: gray text, hover gray background.

### Search Box (client-side)

A text input rendered to the right of the tabs. The dashboard page passes the full approval list to a new client component `DashboardClient` which owns:
- The search string state
- Filtering logic: case-insensitive match against `agent_name` OR `action_description`
- Rendering `ApprovalTable` with the filtered subset

`app/page.tsx` stays a server component — it fetches data and passes it to `DashboardClient`. `ApprovalTable` stays a pure display component (no state).

### Search clears on tab switch

When the user clicks a different status tab, the URL changes and the page re-renders as a server component, which remounts `DashboardClient` with fresh state. Search input is naturally cleared. No explicit reset logic needed.

### Layout

```
[All] [Pending] [Escalated]          [Search: ________________]
──────────────────────────────────────────────────────────────
 Agent / Action    Assignee    Waiting    Status    Action
```

---

## Feature 2: Filter-Aware Empty States

When the filtered result is empty, show a context-aware message:

| Active tab | Message |
|---|---|
| All | "No pending approvals — all clear" |
| Pending | "No pending approvals — all clear" |
| Escalated | "No escalated approvals — all clear" |
| Search returns nothing | "No results for '[query]'" |

The empty state icon and layout stay the same (green checkbox). Only the text changes.

---

## Feature 3: Stats Bar Stays Global

The `StatsBar` component always shows system-wide counts regardless of which tab is active or what is typed in search. Stats are fetched once by the server component alongside the filtered approvals list — the API already returns `stats` in every `/api/approvals` response, and stats are computed globally in the API route (not filtered by status param).

No changes needed to `StatsBar` or the API. This is an explicit design decision: stats = health dashboard, filter = drill-down tool.

---

## Feature 4: Reset Button (Demo Mode Only)

Rendered in the top-right of the dashboard header, only when `process.env.DEMO_MODE === 'true'`.

- Icon: circular arrow (↺), small button, gray by default, spins while in flight
- On click: `POST /api/demo/seed` → on success: `router.refresh()` (Next.js 14 client-side refresh)
- No confirmation dialog — demo data, not destructive
- Shows a "Resetting…" tooltip/label during the POST

The reset button lives inside `DashboardClient` (already a client component) so `useRouter` is available.

---

## Feature 5: Demo Banner Upgrade

Change the demo mode banner text from:
> "Demo mode — data is simulated. Deploy your own →"

To:
> "Demo mode — try approving a request, then hit ↺ to reset. Deploy your own →"

This turns the banner from a passive warning into an active invitation to explore.

The banner is in `app/layout.tsx` and renders server-side. The `NEXT_PUBLIC_DEMO_MODE` env var drives it (same as today).

---

## Feature 6: Export JSON Opens in New Tab

In `app/audit/page.tsx`, change the Export JSON anchor tag:

**Before:**
```tsx
<a href="/api/audit" className="...">↓ Export JSON</a>
```

**After:**
```tsx
<a href="/api/audit" target="_blank" rel="noopener noreferrer" className="...">↗ Export JSON</a>
```

Change the `↓` arrow to `↗` to visually signal "opens in new tab." No other changes.

---

## Files Changed

| File | Change |
|---|---|
| `app/page.tsx` | Read `searchParams.status`, pass list + status to `DashboardClient` |
| `app/layout.tsx` | Update demo banner text |
| `app/audit/page.tsx` | Add `target="_blank"` to export link |
| `components/DashboardClient.tsx` | New client component: search state, filter logic, reset button |
| `components/ApprovalTable.tsx` | Accept `filter` prop for empty state message |

No database changes. No new API routes. No changes to existing API routes.

---

## Testing

- Filter tabs: verify URL param updates, API called with correct status, table shows filtered results
- Search: verify case-insensitive match on agent_name and action_description
- Search clears on tab switch: verify input is empty after navigating to a different tab
- Reset button: verify only shown in demo mode, POST fires, page refreshes with fresh data
- Stats: verify counts do not change when switching tabs or searching
- Export: verify link opens in new tab
