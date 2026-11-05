---
type: agent-brain
owner: Matt Curran
applies_to: [reddit-scout, facebook-scout, head-reviewer]
version: 0.2
updated: 2026-11-05
---

# Lead Brain — Batch Capital

> Every scout and the head reviewer load this file on every run. If it isn't written here, the agents don't know it. Lines marked **TODO** are guesses — Matt to confirm.

## Who we are (for context, never for posting)
- **Batch Capital** is the funding division of **Batch Group** (batchgroup.co). Legal entity: Batch Sales LLC dba Batch Capital.
- We are a **broker**. We connect businesses with a panel of funding partners. **Never** describe us as a lender, direct lender, or "guaranteed."
- Products: MCA, SBA, term loans, lines of credit, equipment financing, HELOCs.
- Batch Group also does payment processing (Batch / BatchOut), marketing, and websites. Every merchant is also a processing prospect.
- One-person desk run by Matt. Target volume is 5–10 funder submissions/month, so **quality over quantity**.
- We don't work with other brokers as sources, use DataMerch, or charge PSF fees.

---

## Lead type 1 — Merchants (clients)

**What a 10/10 looks like**
- An owner (not an employee or broker) asking for working capital *right now*
- Gives specifics: industry, time in business, monthly revenue, what the money is for
- US-based, an operating business with real deposits

**Buying signals (search terms)**
- "need working capital", "cash flow gap", "making payroll", "bank denied me", "SBA taking forever"
- "merchant cash advance", "MCA", "business loan bad credit", "funding for my restaurant/trucking/construction…"
- "equipment financing", "buy out a truck/machine", "line of credit for my business"
- Frustration with current processor fees → processing angle

**Minimums and sweet spot** (source of truth: `data/lender-parameters.json`)
- **Universal floor (fundable by at least one live lender):** 6+ months in business, $15K+/mo true revenue, 500+ FICO, 3+ deposits/month
- **Sweet spot (most lenders):** 12+ months, $30K+/mo, 550+ FICO, 5 or fewer negative days/month, 1st–4th position
- **Preferred industries:** restaurants, retail, medical/healthcare, HVAC, plumbing, electrical, home services, salons, e-commerce, distributors, logistics, nursing homes, franchises
- Revenue, FICO, negative days and positions only show up in bank statements and the app. **Agent scores are pre-qualification, never approval.**

**Segments (tag every merchant lead with the ones that fit)**
1. Clean / low-cost (A–B): 12+ mo, $21K+/mo, 600+ FICO, not construction/trucking
2. Stacked B/C (2nd–4th): already using MCAs, 6–12+ mo, $25K+/mo
3. Low revenue: 6+ mo, $15K–$25K/mo
4. Texas: route to Mint / Merchant Marketplace (Malka high-risk, MCHQ last resort)
5. High risk: heavily stacked, past defaults, 2nd position or deeper
6. Reverse consolidation: 3+ positions, still paying, $50K+ need, not CA/TX
7. Term / SBA (LendCap): 24+ mo, $29K+/mo, positive cash flow, taxes filed
8. Equipment (Navitas): buying specific equipment, decent credit

**Flag but don't kill**
- Texas and California merchants (excluded by many lenders; tag the segment so routing is obvious)
- Trucking and construction (often restricted; need higher revenue or time in business)

**Disqualify**
- Startups with no revenue, side hustles, personal loans
- Other brokers or ISOs fishing for deals
- **Almost always restricted:** cannabis, auto sales/dealerships, financial services/lenders/brokers, open bankruptcy
- **Case by case (flag, don't kill):** law firms, real estate, solar, staffing, non-profits
- Under 6 months in business or under $15K/mo when the post states it
- Posts older than 14 days, unless still active in the comments
- Anything that reads like a scam or fake distress post

---

## Lead type 2 — Lenders / funders

**What we want**
- Direct funders or ISO desks that accept outside ISOs, especially ones that cover our thin spots:
  - **Texas and California** (only Mint and Merchant Marketplace cover TX cleanly)
  - **Low revenue** ($15K–$25K/mo; only Main Capital C paper (pending) and Lendini today)
  - **High-risk 1st position** (Malka doesn't do 1st)
  - **Trucking and construction** at normal revenue levels
- Term / SBA / equipment lenders open to referral or ISO deals

**Green flags**
- No personal guarantee from the broker, no post-payoff non-competes, and they allow processing after payoff
- Clawback tied to the payment count, which we can live with. Short-window clawbacks (e.g. 30 days) conflict with our policy.

**Red flags (tag, don't promote)**
- Processor-locked / split-funding-only products, or permanent processing locks (Merchant Cash HQ is last-resort for this reason)
- Post-term non-competes, perpetual merchant restrictions, broker personal guarantee

**Already in the network — do NOT surface as new**
Sentient Capital (Xpress Lend), Capital Minutes, Mint Funding, The Merchant Marketplace, Pathway Funding, Lendini, Quick Fix Capital, Malka Advance, Merchant Cash HQ, LendCap, Navitas Credit, TMR Now, Main Capital, Belltower Funding, Lifetime Funding, Blue Sky Advance (VPS), Blade Funding, Liquidity Access, South End Capital/Stearns Bank, Smart Step Funding, Vox Funding, Velocity Capital Group, CFG Merchant Solutions, BusinessFunds.com, Fundomate, Preferred Funding Group, Lexio Capital, Columbia Bank

**Already passed / dropped — do NOT surface**
Cashable, 1st Alliance Group, Splash Advance, Biz Capital Miami, Fenix Capital Funding, Libertas Funding

**Already contacted, no reply yet — surface only if there's new info**
Vader, ByzFunder, Fox, Bitty

---

## Lead type 3 — Referral partners

**Ideal partners**
- **CPAs / bookkeepers / tax preparers.** Comp: $250 when a referred merchant boards processing, $500 when one funds an MCA.
- **Credit repair, business consultants, commercial real estate brokers, equipment dealers, POS/payment resellers, insurance agents, bankers with declines.** Comp: 20% of what Batch earns on MCA, term, and processing residuals.
- Banks/credit unions with declined files (model: Columbia Bank two-way referrals)

**Signals**
- "my clients keep asking about funding", "what do you do with declined loan clients"
- "looking for a funding partner", "referral partner", "white label business funding"
- Professionals who regularly answer small-business money questions in groups

**Disqualify**
- People who want to be paid upfront, or "lead sellers" pushing aged lists
- Other MCA brokers pitching themselves as "partners"

---

## Rules for all agents
1. **Read-only.** Never post, comment, DM, like, or join anything. Matt does all outreach.
2. **Never** use Matt's name, phone, or company in any platform action.
3. Capture for every lead: platform, group/subreddit, post URL, author handle, post date, quoted snippet (under 40 words), lead type, why it matches, and any gap tags.
4. One lead per person per 30 days. Dedupe on author + platform.
5. If unsure, include it and let the reviewer decide. Don't invent details that aren't in the post.

## Head reviewer rubric (score 1–10)
| Factor | Weight |
|---|---|
| Fit with the lead-type profile above | 35% |
| Urgency / intent (asking now vs. just chatting) | 25% |
| Specifics given (revenue, TIB, industry, location) | 20% |
| Reachability (real person, active account, recent post) | 10% |
| Not a duplicate / not in an exclusion list | 10% |

- **8–10:** Send to Matt's queue
- **6–7:** Hold in "maybe" for weekly review
- **≤5:** Discard, but log the reason so the scouts learn

The reviewer adds a one-line **suggested opener** for every promoted lead (Matt edits before sending).

**Outreach compliance (applies to every draft):** opt-in or B2B-permitted channels only; TCPA for calls/texts (no auto-dialed texts to cell phones without consent); CAN-SPAM for email; never say "pre-approved," "guaranteed," "we lend," or "direct lender."

---

## Watch list (**TODO**, Matt to add)
- **Subreddits:** r/smallbusiness, r/Entrepreneur, r/restaurantowners, r/Truckers, r/Construction, r/Accounting, r/tax, r/sweatystartup, r/smallbusinessfinance (**TODO**: verify each is active)
- **Facebook groups:** (Matt to list the groups he's already a member of)
