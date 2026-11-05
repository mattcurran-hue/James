---
type: agent-brain
owner: Matt Curran
applies_to: [reddit-scout, facebook-scout, head-reviewer]
version: 0.1
updated: 2026-11-04
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

**Sweet-spot targets** (**TODO**, confirm numbers)
- Time in business: 6+ months
- Monthly deposits: $15k+ (lower-revenue merchants are a known funder gap, so still surface them but flag them)
- Industries: restaurants, trucking, construction/contractors, retail, auto repair, medical/dental, salons

**Flag but don't kill**
- Texas merchants, high-risk 1st position, low revenue, 7th–10th position stacking. These are known **funder gaps** right now; tag `gap:` so Matt knows.

**Disqualify**
- Startups with no revenue, side hustles, personal loans
- Other brokers or ISOs fishing for deals
- Crypto, cannabis, MLM, gambling (**TODO**, confirm full restricted list)
- Posts older than 14 days, unless still active in the comments
- Anything that reads like a scam or fake distress post

---

## Lead type 2 — Lenders / funders

**What we want**
- Direct funders or ISO desks that accept outside ISOs, especially ones that cover our gaps:
  - **Texas** merchants
  - **High-risk 1st position**
  - **Low-revenue** merchants
  - **7th–10th position**
- Term / SBA / equipment lenders open to referral or ISO deals

**Green flags**
- No personal guarantee from the broker, no post-payoff non-competes, and they allow processing after payoff
- Clawback tied to the payment count, which we can live with. Short-window clawbacks (e.g. 30 days) conflict with our policy.

**Red flags (tag, don't promote)**
- Processor-locked / split-funding-only products
- Post-term non-competes, perpetual merchant restrictions, broker personal guarantee

**Already in the network — do NOT surface as new**
Liquidity Access, South End Capital/Stearns Bank, Smart Step Funding, Vox Funding, Velocity Capital Group, Lendini/QuickFix, CFG Merchant Solutions, BusinessFunds.com, Fundomate, Merchant Cash HQ, Lendcap, Pathway Funding, Malka Advance, Lexio Capital, Preferred Funding Group, Xpress Lend, The Merchant Marketplace, TMRNOW, Navitas Credit, Columbia Bank

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

The reviewer adds a one-line **suggested opener** for every promoted lead (Matt edits before sending), and never claims we lend.

---

## Watch list (**TODO**, Matt to add)
- **Subreddits:** r/smallbusiness, r/Entrepreneur, r/restaurantowners, r/Truckers, r/Construction, r/Accounting, r/tax, r/sweatystartup, r/smallbusinessfinance (**TODO**: verify each is active)
- **Facebook groups:** (Matt to list the groups he's already a member of)
