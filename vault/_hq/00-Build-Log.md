---
type: build-log
updated: 2026-11-05
---

# James: build log

## Live as of Nov 5, 2026
- **Dashboard:** james-ochre-delta.vercel.app (login + authenticator 2FA). Tabs: Today, Leads, Agents, Lenders, News. Works on PC and phone.
- **Bank Manager** (Capital City boss): scores every lead 1–10 against the Lead Brain and the live lender panel, tags segments, names likely lenders, drafts an opener.
- **Intake Clerk:** webhook for any contact form (/api/intake). Built but not hooked to batchgroup.co; site leads already reach Matt through the CRM.
- **Paperboy** (Reddit): F5Bot keyword alerts → Gmail → "James Bridge" Apps Script (every 15 min) → James. 8+ goes to Today, 6–7.9 to Maybe, the rest is tossed.
- **Drafting:** Yes on a lead → draft → Approve / Send back / Kill → Ready to send (Copy, Open, Mark sent).
- **Chud** (The Town Crier): daily MCA news brief at 6am ET on the News tab. Simple breakdown, what it means for Matt, article + primary-source links. Urgent items go to Today.
- **Your day:** ActivityWatch on Matt's PC → hourly sync (C:\James\activity-to-james.ps1, Task Scheduler "James activity sync") → app and site time on Today. Private-words list in the script.
- **Cost tracking:** API spend on the Agents page. Bank Manager prompt is cached.
- **Vault sync:** Obsidian vault at C:\James\repo\vault, auto commit-and-sync every 10 min via the Git plugin.

## Decisions
- System name: **James**. He is the only voice; silent unless something needs Matt's authorization or immediate attention. Non-urgent approvals are bundled.
- James drafts but **never emails anyone but Matt**. The CRM handles all outreach.
- Agents infer freely and ask before acting (see 01-James-Rules).
- Towns: Capital City (Batch Capital), Swipe Springs (BatchOut), Billboard Bay (Batch Marketing). 1950s atomic-age village look, planned as a later tab.
- Org: workers → town boss (the mean one) → Head Boss (the Mayor) → James.
- Dropped: Funder Matchmaker, Submission Clerk, Follow-up, Renewal Watcher (the CRM does these; the Observer watches instead), Square Loan Spotter, UCC County Clerk.
- Reddit API self-service is closed (Nov 2025), so Reddit goes through F5Bot email alerts instead.
- PC: view only (ActivityWatch). No AI control of the PC.

## Open items
- [ ] CRM API docs + read-only key → build the Observer
- [ ] Facebook groups list → Lead Brain watch list → Facebook scout
- [ ] Spare number for the WhatsApp scout
- [ ] Head Boss (after 1–2 weeks of real yes/no history)
- [ ] Email alerts to Matt for hot leads (optional)
- [ ] Custom domain, e.g. james.batchgroup.co (optional)
- [ ] Vercel Pro ($20/mo) since James is commercial use; Supabase Pro ($25/mo) for backups
- [ ] Village view (after real activity exists)
- [ ] Voice for James (after the dashboard settles)
