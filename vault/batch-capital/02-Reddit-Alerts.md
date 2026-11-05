---
type: watch-list
applies_to: [reddit-scout, inbox-clerk]
source: F5Bot keyword alerts → Gmail → James
version: 0.1
updated: 2026-11-05
---

# Reddit keyword alerts (F5Bot)

Paste each line below as its own keyword in F5Bot. F5Bot emails every Reddit post or comment that matches. The Inbox Clerk picks those emails up, the Paperboy extracts the post, and the Bank Manager scores it against the Lead Brain.

Keep phrases specific. Single words like "funding" will flood the inbox with noise.

## Merchants (clients)
- merchant cash advance
- need working capital
- working capital loan
- business loan denied
- bank denied my business loan
- SBA loan denied
- small business loan bad credit
- MCA stacking
- MCA consolidation
- reverse consolidation
- daily payments killing
- cash flow problems small business
- make payroll this week
- equipment financing for my
- funding for my restaurant
- funding for my trucking
- funding for my construction

## Funders / lenders
- ISO partners wanted
- looking for ISOs
- MCA funder accepting brokers
- direct funder ISO

## Referral partners
- clients need funding
- refer clients for business funding
- declined loan clients
- funding referral partner

## Tuning notes
- If a phrase sends mostly junk for a week, James will propose cutting it (Tier 1).
- If Matt keeps approving leads from one phrase, James will propose variations of it.
