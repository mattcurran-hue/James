---
type: desk-notes
source: Matt's Batch Capital / MCA chat
updated: 2026-11-06
---

# Batch Capital desk: overview

> The living summary of the Batch Capital / MCA chat. Update at the end of any session that changes something: a funder signed or dropped, terms decided, a policy changed. Newest facts win; move replaced ones to the log below.

## Structure
- **Batch Capital** = the funding division of **Batch Group** (batchgroup.co; formerly ONYXX Media Group). Keith calls it "BatchCash."
- Legal entity: **Batch Sales LLC dba Batch Capital**, owned by Batch Group. Matt signs funder agreements as CEO and partner agreements as authorized rep. No personal guarantees.
- Some early ISO agreements were signed under ONYXX Media Group LLC, to be moved over to Batch Sales LLC.
- One-person desk (Matt), working from home for now. Expects 5–10 funder submissions/month.
- Doesn't work with other brokers, doesn't use DataMerch, doesn't charge PSF fees. Files are scrubbed (not underwritten) in the in-house CRM.

## Positioning
- **Broker, never a lender.** Never say "we lend," "direct lender," or "guaranteed."
- Marketed as a connection to multiple funders, not any one funder's program.
- Products: MCA, SBA, term loans, lines of credit, equipment financing, HELOCs.
- Every merchant file also gets pitched Batch processing (BatchOut), approved or declined. Pitch as Batch processing; never name Nassau.
- Never say "preapproved." Never cite ValueCAP/PMF.
- Reps: W-2 for dialer/sales reps (NJ ABC final rule, effective Oct 1, 2026, has no B2B exemption). 1099 only for genuine outside referral partners.

## Funder panel
Full parameters live in `data/lender-parameters.json` (repo) and the **Lenders** tab in James.

**Live / signed:** Sentient Capital (Xpress Lend), Capital Minutes (signed + redline addendum, Nov 5), Mint Funding (redlines accepted, countersigned by Zalmen Preizler, CEO, Nov 5), The Merchant Marketplace (Nov 5; edited the contract itself instead of an addendum: entity name, §13, §19, signature block), Lifetime Funding (Nov 6; §7 and §5(H) deleted), Pathway Funding, Lendini / Quick Fix, Malka Advance (high risk), Merchant Cash HQ (last resort only, permanent processing lock), LendCap (SBA/term only; master ISO signed Nov 5), Liquidity Access, South End Capital / Stearns Bank, Smart Step (Total Deposits Advance only), Vox, Velocity (B/C), CFG Merchant Solutions, BusinessFunds.com (specialty outlet), Fundomate (portal), Preferred Funding Group (affiliate).

**Live funder terms and open confirmations:**
- **Lifetime:** 12–13 pts at a 1.49 factor. Submissions to eman@lifetimefundingllc.com. To confirm: min revenue $70K vs $60K; Texas trucking/construction $250K vs $300K; commission timing 3 vs 30 days.
- **Mint:** to confirm what counts as a "low" day, and weekly pay.
- **Merchant Marketplace:** to confirm the revenue minimum and the $500 rule.
- **Capital Minutes:** A paper; Platinum / Gold / Silver tiers; negative days counted combined over 3 months. Submissions to funding@capitalminutes.com. To confirm: rep contact and fees.
- **LendCap:** positive cash flow, $350K+/yr revenue, 2+ yrs in business, up to $100M, comp 0.5%/mo; contact Spencer Adler. CRM sends the "LendCap – Documents Needed" email template.

**Pending / redlines out (don't submit yet):**
- **Navitas Credit** (equipment; two-way: Matt sends equipment deals, Navitas sends files it can't fund). Vendor profile filled under Batch Group 100%; bank refs and signature blank. Ask Keith whether the credit authorization is personal before signing. Comp terms still to confirm.
- **TMR Now:** redlines sent. Rep says the non-compete only covers MCAs to merchants TMR funded; needs to be in writing.
- **Main Capital:** fine with no stacking; redlined the clause requiring return of all commissions ever paid.
- **Belltower:** redlines sent. Told them one team member + admin on this branch; new funding desk building its panel.
- **Blue Sky** (reverse consolidation): refuses to drop the PG. Offered pay-after-clawback; a Batch Group parent guaranty would need Keith/Tristan approval.
- **SBF, Credia, Royalty:** same law-firm template (PG, §19 lien, account freezes). Redlines sent: strike PG and lien, offer pay-after-clawback.
- **800 Funding:** same template, plus a blank commission schedule. Redline email drafted Nov 6. Guidelines: up to 15 pts, 1 yr TIB, 1st position with prior payment history, settled defaults OK, Texas OK if extra clean (merchant pushes weekly ACH). Weed shops OK if they take cards (never through Batch processing). Bans pawn, payday, nonprofit, telemarketing, credit repair, auto sales, gambling, ticket brokers. To confirm: min revenue $70K (flyer) vs ~$40K (rep); accounting in or out; St. Petersburg (virtual office) vs Aventura address.
- **Harbor View:** guidelines and agreement received; under review.
- **Lexio:** asked for a processing carve-out in §10.

**Banks / referral:** Columbia Bank (Michelle): two-way. Matt takes bank declines, sends files too clean for MCA.

**Not signed / passed / dropped:** Blade (not signed), Cashable (dropped, 30-day clawback), 1st Alliance, Splash Advance, Biz Capital Miami, Fenix, Libertas.

**Contacted, no reply:** Vader, ByzFunder, Fox, Bitty.

**Gaps still open:** Texas, high-risk 1st position, low-revenue merchants, trucking/construction at normal revenue. Lifetime partly covers Texas trucking/construction at higher revenue; 800 Funding would cover Texas, 1st position and lower revenue if it signs.

## Funder contract stance
- OK: no processing a funder's merchants while they have an open balance.
- Not OK: restrictions after payoff, post-term non-competes, processor-locked / split-funding-only products.
- Clawback: prefers payment-count based (e.g. 20 cleared payments) over short time windows.
- No personal guarantees and no SSN or home address on any form; EIN only.
- No liens on Batch's accounts or receivables (strike §19-type security interests, UCC filings, cross-collateral). Account-freeze remedies limited to commissions owed under the agreement, entity only.
- Will take commission after the clawback period in exchange for dropping personal-guarantee / lien terms. Doesn't care about full commission on renewals.
- Watch for the law-firm template (SBF, Credia, Royalty, Belltower, 800 Funding, old Lifetime): guarantor block, §19 lien, §21/§30 account freezes, blank fee schedule, renewal comp at funder's discretion.

## Referral partners
- **CPAs:** $250 when a referred merchant boards processing, $500 when one funds an MCA.
- **General partners** (e.g. Stephon, credit repair, via Partner API): 20% of what Batch earns on MCAs, term loans, and processing residuals.
- Partners contract with Batch Sales LLC, never Matt personally.

## Tools
- In-house CRM (handles funder matching, submissions, follow-ups, renewals; has an API). GoHighLevel, Dialpad, Apollo, Clay.
- **James** (this system) for lead scouting, scoring, and the MCA news brief.

## Open items
- [ ] CRM API docs + read-only key → James's Observer
- [ ] Get TMR's non-compete limit in writing
- [ ] Finish Navitas, Lexio, Main Capital, Belltower, Blue Sky, SBF, Credia, Royalty, 800 Funding, Harbor View
- [ ] Close the open confirmations for Lifetime, Mint, Merchant Marketplace and Capital Minutes
- [ ] Move Velocity to B/C in the CRM (check with rep John Abramov first)
- [ ] Joel / OPVS equipment deal: get 4 months of statements, app and debt list before the quote expires Nov 10
- [ ] Fill the Texas / high-risk 1st / low-revenue gaps
- [ ] Move ONYXX-signed agreements over to Batch Sales LLC

## Log
- 2026-11-06: Desk notes created from the Batch Capital chat history.
- 2026-11-06: Lifetime moved from pending to live. Added terms and open confirmations for live funders. Pending list expanded with SBF, Credia, Royalty, 800 Funding, Harbor View. TMR changed from "weighing" to "redlines sent." Added the no-lien, no-SSN, Nassau/ValueCAP and W-2 rep policies.
