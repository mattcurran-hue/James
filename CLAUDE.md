# James repo: working rules for Claude

James is Matt's agent system for Batch Capital (MCA broker). Dashboard in `web/` (Next.js 16 + Supabase, deployed on Vercel from `main`); Obsidian vault in `vault/` (synced by Matt's Obsidian Git plugin every 10 min).

## Standing commands Matt may give

**"Update lenders" / "update all lenders"**
1. Edit `data/lender-parameters.json`, the single source of truth for lenders and segments.
   - Lenders with guidelines on file → `lenders` (full parameters).
   - Lenders without guidelines yet (or passed / dropped / contacted) → `other_lenders` (name, status, submission_email, notes).
   - Status values: `Live`, `Live (note)`, `Pending (note)`, `In setup`, `Not signed`, `Contacted`, `Passed`, `Dropped`.
   - Use the exact lender name already in the file when updating; a new spelling creates a duplicate.
2. Run `python3 scripts/build_lender_seed.py` (keeps the manual SQL fallback current).
3. Update `vault/batch-capital/desk/Desk-Overview.md` to match (funder panel section + a dated Log line).
4. Commit and push to `main`. The deploy syncs the JSON into Supabase automatically (`web/scripts/sync-lenders.mjs`); no SQL step.

**"Update the desk overview" / "update the vault"**
Edit `vault/batch-capital/desk/Desk-Overview.md`: replace outdated lines rather than stacking, add a dated Log line, commit and push.

## Rules
- Pull before editing (`git pull --ff-only`). Matt edits the vault from Obsidian too.
- Never commit secrets, API keys, merchant financials, bank statements, SSNs or account numbers.
- Batch Capital is a broker, never a lender. Never write "we lend", "direct lender", "pre-approved" or "guaranteed".
- Changes to agent behavior go in `vault/batch-capital/00-Lead-Brain.md` and `vault/_hq/01-James-Rules.md`.
