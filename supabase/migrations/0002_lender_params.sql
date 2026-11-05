-- Lender underwriting parameters + prospect segments (from data/lender-parameters.json)

alter table lenders
  add column paper                 text,
  add column min_tib_months        int,
  add column min_fico              int,
  add column negative_day_limit    text,
  add column deal_min              numeric(14,2),
  add column deal_max              numeric(14,2),
  add column max_term              text,
  add column restricted_industries text,
  add column required_stips        text,
  add column status_detail         text,      -- e.g. 'Pending (redline s7)', 'Live (last resort)'
  add column params                jsonb not null default '{}';  -- full original record

-- Segments: who to look for, hard filters, which lenders fit. Scouts tag leads with these.
create table segments (
  id              uuid primary key default gen_random_uuid(),
  workspace_id    uuid not null references workspaces(id) on delete cascade,
  key             text not null,           -- 'stacked_bc'
  position        int not null,
  name            text not null,
  who             text,
  hard_filters    text,
  best_lenders    text,
  public_signals  text,
  unique (workspace_id, key)
);
alter table segments enable row level security;
create policy member_access on segments for all to authenticated
  using (is_member(workspace_id)) with check (is_member(workspace_id));

alter table leads add column segment_keys text[] not null default '{}';
