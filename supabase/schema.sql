-- supabase/schema.sql
-- Run this entire file once in your Supabase SQL Editor

create table if not exists approvals (
  id uuid primary key default gen_random_uuid(),
  agent_name text not null,
  action_description text not null,
  agent_reasoning text,
  assignee text not null,
  assignee_type text not null check (assignee_type in ('person', 'team')),
  escalate_to text,
  timeout_minutes integer not null default 60,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'expired', 'escalated')),
  decided_by text,
  decision_note text,
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  expires_at timestamptz not null
);

create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  members text[] not null default '{}'
);

create table if not exists notifications_log (
  id uuid primary key default gen_random_uuid(),
  approval_id uuid not null references approvals(id) on delete cascade,
  type text not null check (type in ('slack', 'email', 'escalation')),
  sent_at timestamptz not null default now(),
  recipient text not null
);

-- Index for fast status queries
create index if not exists approvals_status_idx on approvals(status);
create index if not exists approvals_expires_at_idx on approvals(expires_at);

-- Enable Realtime so the dashboard updates instantly when any approval changes
-- Run this once — if it errors "already member", that's fine.
alter publication supabase_realtime add table approvals;
