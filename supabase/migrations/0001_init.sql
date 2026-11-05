-- James: core schema v1
-- Multi-workspace from day one. Every business row carries workspace_id and is
-- protected by row-level security. Agents run server-side with scoped access.

create extension if not exists pgcrypto;

-- ─────────────────────────────────────────────────────────────
-- Enums
-- ─────────────────────────────────────────────────────────────
create type agent_role      as enum ('worker', 'town_boss', 'head_boss', 'james');
create type run_status      as enum ('queued', 'running', 'succeeded', 'failed', 'paused');
create type platform        as enum ('reddit', 'facebook', 'whatsapp', 'web_form', 'gmail', 'ghl', 'crm', 'dialpad', 'manual', 'other');
create type lead_type       as enum ('merchant', 'funder', 'referral_partner', 'processing_prospect', 'marketing_prospect');
create type lead_status     as enum ('pending_review', 'promoted', 'maybe', 'discarded', 'archived');
create type lender_status   as enum ('prospect', 'contacted', 'negotiating', 'signed', 'passed', 'dropped');
create type actor_type      as enum ('matt', 'agent', 'system');
create type card_kind       as enum ('confirm_inference', 'approve_draft', 'approve_action', 'escalation', 'brain_edit');
create type card_status     as enum ('pending', 'approved', 'rejected', 'changes_requested', 'expired');
create type card_urgency    as enum ('normal', 'urgent');
create type draft_channel   as enum ('email', 'sms', 'dm', 'other');
create type draft_status    as enum ('draft', 'awaiting_approval', 'changes_requested', 'approved', 'sent', 'killed');
create type feedback_rating as enum ('up', 'down');

-- ─────────────────────────────────────────────────────────────
-- Workspaces ("towns") and membership
-- ─────────────────────────────────────────────────────────────
create table workspaces (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,              -- 'batch-capital'
  name        text not null,                     -- 'Batch Capital'
  town_name   text,                              -- 'Capital City'
  vault_path  text,                              -- 'vault/batch-capital'
  created_at  timestamptz not null default now()
);

create table workspace_members (
  workspace_id uuid not null references workspaces(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  role         text not null default 'owner',
  primary key (workspace_id, user_id)
);

create or replace function is_member(ws uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from workspace_members
                 where workspace_id = ws and user_id = auth.uid());
$$;

-- ─────────────────────────────────────────────────────────────
-- Agents and their runs
-- ─────────────────────────────────────────────────────────────
create table agents (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid references workspaces(id) on delete cascade,  -- null = HQ-level (James, Head Boss)
  slug          text not null,                   -- 'reddit-scout'
  name          text not null,                   -- 'Reddit Scout'
  character     text,                            -- 'The Paperboy'
  role          agent_role not null default 'worker',
  boss_id       uuid references agents(id),      -- who reviews this agent
  enabled       boolean not null default false,
  schedule_cron text,                            -- '*/45 * * * *'
  config        jsonb not null default '{}',
  created_at    timestamptz not null default now(),
  unique (workspace_id, slug)
);

create table agent_runs (
  id              uuid primary key default gen_random_uuid(),
  agent_id        uuid not null references agents(id) on delete cascade,
  workspace_id    uuid references workspaces(id) on delete cascade,
  status          run_status not null default 'queued',
  started_at      timestamptz,
  finished_at     timestamptz,
  items_found     int not null default 0,
  items_promoted  int not null default 0,
  tokens_in       int not null default 0,
  tokens_out      int not null default 0,
  cost_usd        numeric(10,4) not null default 0,
  summary         text,                          -- one line for the dashboard / village
  error           text,
  created_at      timestamptz not null default now()
);
create index on agent_runs (agent_id, created_at desc);

-- ─────────────────────────────────────────────────────────────
-- Watch list and raw captures
-- ─────────────────────────────────────────────────────────────
create table sources (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references workspaces(id) on delete cascade,
  platform      platform not null,
  identifier    text not null,                   -- 'r/smallbusiness', FB group URL, WhatsApp group name
  label         text,
  enabled       boolean not null default true,
  created_at    timestamptz not null default now(),
  unique (workspace_id, platform, identifier)
);

create table source_posts (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references workspaces(id) on delete cascade,
  source_id     uuid references sources(id) on delete set null,
  platform      platform not null,
  url           text,
  author_handle text,
  posted_at     timestamptz,
  snippet       text,                            -- short excerpt only
  content_hash  text not null,                   -- dedupe
  raw           jsonb,
  captured_by   uuid references agents(id),
  captured_at   timestamptz not null default now(),
  unique (workspace_id, content_hash)
);

-- ─────────────────────────────────────────────────────────────
-- Pipeline: per-workspace stages, leads, lenders, deals
-- ─────────────────────────────────────────────────────────────
create table pipeline_stages (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references workspaces(id) on delete cascade,
  key           text not null,                   -- 'submitted'
  label         text not null,                   -- 'Submitted'
  position      int not null,
  is_terminal   boolean not null default false,
  unique (workspace_id, key)
);

create table leads (
  id                uuid primary key default gen_random_uuid(),
  workspace_id      uuid not null references workspaces(id) on delete cascade,
  lead_type         lead_type not null,
  source_post_id    uuid references source_posts(id) on delete set null,
  found_by          uuid references agents(id),
  platform          platform,
  author_handle     text,
  url               text,
  name              text,
  company           text,
  email             text,
  phone             text,
  industry          text,
  state             text,
  monthly_revenue   numeric(14,2),
  months_in_business int,
  why_it_matches    text,
  gap_tags          text[] not null default '{}',
  score             numeric(4,1),                -- reviewer's 1–10
  score_breakdown   jsonb,
  reviewer_notes    text,                        -- the town boss's (blunt) notes
  suggested_opener  text,
  status            lead_status not null default 'pending_review',
  stage_key         text,                        -- references pipeline_stages.key within workspace
  stage_changed_at  timestamptz,
  dedupe_key        text,                        -- platform:author
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index on leads (workspace_id, status, created_at desc);
create index on leads (workspace_id, dedupe_key);

create table lenders (
  id                uuid primary key default gen_random_uuid(),
  workspace_id      uuid not null references workspaces(id) on delete cascade,
  name              text not null,
  status            lender_status not null default 'prospect',
  products          text[] not null default '{}',  -- 'mca','term','sba','loc','equipment','heloc'
  states_excluded   text[] not null default '{}',
  positions         text,                           -- '1st–4th'
  min_monthly_rev   numeric(14,2),
  submission_email  text,
  contacts          jsonb not null default '[]',
  contract_flags    jsonb not null default '{}',    -- clawback, PG, non-compete notes
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (workspace_id, name)
);

create table deals (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references workspaces(id) on delete cascade,
  lead_id       uuid references leads(id) on delete set null,
  lender_id     uuid references lenders(id) on delete set null,
  product       text,
  amount        numeric(14,2),
  position      int,
  commission    numeric(14,2),
  source        platform,
  funded_at     date,
  notes         text,
  created_at    timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- James's interface: cards, drafts, feedback, checklists
-- ─────────────────────────────────────────────────────────────
create table cards (
  id              uuid primary key default gen_random_uuid(),
  workspace_id    uuid references workspaces(id) on delete cascade,  -- null = cross-town / HQ
  kind            card_kind not null,
  urgency         card_urgency not null default 'normal',
  title           text not null,                 -- what James says
  body            text,
  source_agent_id uuid references agents(id),    -- "The Observer says…"
  entity_type     text,                          -- 'lead','lender','deal','draft','brain'
  entity_id       uuid,
  proposed_action jsonb,                         -- exactly what happens on Yes
  status          card_status not null default 'pending',
  decision_note   text,                          -- Matt's "change it to…"
  expires_at      timestamptz default (now() + interval '7 days'),
  decided_at      timestamptz,
  created_at      timestamptz not null default now()
);
create index on cards (status, urgency, created_at);

create table drafts (
  id              uuid primary key default gen_random_uuid(),
  workspace_id    uuid not null references workspaces(id) on delete cascade,
  lead_id         uuid references leads(id) on delete set null,
  lender_id       uuid references lenders(id) on delete set null,
  card_id         uuid references cards(id) on delete set null,
  parent_id       uuid references drafts(id),    -- revision chain
  version         int not null default 1,
  channel         draft_channel not null,
  recipient       text,
  subject         text,
  body            text not null,
  status          draft_status not null default 'draft',
  drafted_by      uuid references agents(id),
  sent_at         timestamptz,
  created_at      timestamptz not null default now()
);

create table feedback (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid references workspaces(id) on delete cascade,
  entity_type   text not null,
  entity_id     uuid not null,
  rating        feedback_rating,
  reason        text,
  created_at    timestamptz not null default now()
);

create table checklist_items (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid references workspaces(id) on delete cascade,  -- null = "Me" view
  owner_agent   uuid references agents(id),      -- null = Matt's item
  for_date      date not null default current_date,
  title         text not null,
  done          boolean not null default false,
  done_at       timestamptz,
  created_by    actor_type not null default 'matt',
  created_at    timestamptz not null default now()
);
create index on checklist_items (for_date, workspace_id);

-- ─────────────────────────────────────────────────────────────
-- Event log: append-only record of everything (the learning loop)
-- ─────────────────────────────────────────────────────────────
create table events (
  id            bigint generated always as identity primary key,
  workspace_id  uuid references workspaces(id) on delete cascade,
  actor         actor_type not null,
  agent_id      uuid references agents(id),
  entity_type   text not null,
  entity_id     uuid,
  event_type    text not null,                   -- 'lead.found','lead.stage_changed','card.approved'…
  payload       jsonb not null default '{}',
  created_at    timestamptz not null default now()
);
create index on events (workspace_id, created_at desc);
create index on events (entity_type, entity_id);

-- ─────────────────────────────────────────────────────────────
-- Row-level security
-- Dashboard users see only their workspaces. HQ-level rows (workspace_id null)
-- are visible to any signed-in member. Agents use the service role server-side
-- and must always filter by their own workspace_id.
-- ─────────────────────────────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array['agents','agent_runs','sources','source_posts','pipeline_stages',
                           'leads','lenders','deals','cards','drafts','feedback',
                           'checklist_items','events']
  loop
    execute format('alter table %I enable row level security', t);
    execute format($p$create policy member_access on %I for all to authenticated
                     using (workspace_id is null or is_member(workspace_id))
                     with check (workspace_id is null or is_member(workspace_id))$p$, t);
  end loop;
end $$;

alter table workspaces enable row level security;
create policy member_read on workspaces for select to authenticated using (is_member(id));

alter table workspace_members enable row level security;
create policy self_read on workspace_members for select to authenticated using (user_id = auth.uid());

-- Events are append-only for everyone except the service role.
revoke update, delete on events from authenticated;
