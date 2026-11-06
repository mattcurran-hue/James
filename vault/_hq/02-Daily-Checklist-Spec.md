---
type: spec
status: waiting on CRM / dialer API keys
updated: 2026-11-06
---

# Daily checklist: what Matt wants (build when the CRM/dialer API arrives)

Shows on Today every day, resets each morning, and **updates itself**: no manual ticking where a data source exists.

| Item | Daily target | Auto-updates from | Status |
|---|---|---|---|
| Calls made | 500 | CRM / dialer API (call count today) | Waiting on API key |
| Lenders onboarded | 2 | Lender data: lenders that moved to Live today (data/lender-parameters.json sync) | Can build now |
| Reddit bot (Paperboy) progress | Hits found, reviewed, sent to queue | agent_runs for reddit-scout | Can build now |
| LinkedIn outreach | 5+ people | No LinkedIn API for this. Options: count from CRM if logged there, LinkedIn notification emails in Gmail, or a one-tap +1 counter | Decide with Matt |
| Facebook bot progress | Hits found, reviewed, sent to queue | agent_runs for facebook-scout | After the Facebook scout is built |

## Notes
- Each item: progress bar (e.g. 312 / 500), turns green at target.
- Agents' progress (Reddit, Facebook) sits next to Matt's numbers so he sees both on one screen.
- Confirm with Matt: is "onboard 2 lenders" per day or per week?
