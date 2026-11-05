# James

Matt's agent system. Scouts find leads, town bosses review them, and James is the single voice that asks Matt for approvals.

## Layout
```
vault/                  Obsidian vault — plain-English brains and rules (open this folder in Obsidian)
  _hq/                  James's rules (apply to every town)
  batch-capital/        Capital City — Lead Brain
  batchout/             Swipe Springs
  batch-marketing/      Billboard Bay
supabase/
  migrations/0001_init.sql   Core schema (multi-workspace, RLS)
  seed.sql                   Towns, pipelines, agent roster, lender panel
```

## Data model (short)
- **workspaces**: one per town; every row is scoped to one, enforced by row-level security
- **agents / agent_runs**: the roster and every run (status, finds, cost). Feeds the dashboard and village.
- **sources / source_posts**: watch list and raw captures (dedupe by hash)
- **leads / pipeline_stages / lenders / deals**: the business pipeline, with stages per town
- **cards**: everything James asks Matt (confirm an inference, approve a draft, escalation)
- **drafts**: outreach with a revision chain (request changes → v2 → …)
- **feedback / events**: thumbs up/down and an append-only log of everything. This is the learning loop.
- **checklist_items**: daily checklist for Matt and for each agent

## Phase 1 build
1. Schema + seed ✅
2. Dashboard shell (Next.js, Supabase auth + 2FA)
3. Reddit Scout + Bank Manager review
4. Intake Clerk (batchgroup.co/contact) + Waitress cross-sell
5. Observer, once CRM read access exists

## Setup
1. Create a Supabase project and run, in order: `supabase/migrations/0001_init.sql`, `0002_lender_params.sql`, `supabase/seed.sql`, `supabase/seed_lenders.sql`.
   - Lender data lives in `data/lender-parameters.json`. After editing it, run `python3 scripts/build_lender_seed.py` and re-run `seed_lenders.sql` (safe to re-run; it updates in place).
2. Add yourself to every workspace (see the comment at the top of seed.sql).
3. Secrets go in Vercel env vars or a local `.env`, never in the repo.
