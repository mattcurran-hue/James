import { createHash } from "node:crypto";
import Anthropic from "@anthropic-ai/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";
import { BRAINS } from "@/lib/brains.generated";
import { review } from "./bank-manager";
import { costOf } from "./cost";

// The Paperboy (Reddit Scout): reads F5Bot alert emails, pulls out each Reddit hit,
// triages it cheaply, and sends real candidates to the Bank Manager for a full review.

const TRIAGE_MODEL = "claude-haiku-5-5";

type Hit = {
  url: string; title: string | null; snippet: string; subreddit: string | null; author: string | null;
  keyword: string | null; candidate: boolean; reason: string;
};

const HITS_SCHEMA = {
  type: "object", additionalProperties: false,
  properties: {
    hits: {
      type: "array",
      items: {
        type: "object", additionalProperties: false,
        properties: {
          url: { type: "string", description: "Full reddit.com URL of the post or comment" },
          title: { type: ["string", "null"] },
          snippet: { type: "string", description: "The matched text as it appears in the email" },
          subreddit: { type: ["string", "null"], description: "Without the r/ prefix" },
          author: { type: ["string", "null"], description: "Reddit username if shown" },
          keyword: { type: ["string", "null"], description: "The alert keyword that matched" },
          candidate: { type: "boolean", description: "True if this could plausibly be a merchant needing funding, a funder, or a referral partner per the Lead Brain" },
          reason: { type: "string", description: "Under 15 words" },
        },
        required: ["url", "title", "snippet", "subreddit", "author", "keyword", "candidate", "reason"],
      },
    },
  },
  required: ["hits"],
};

async function extractHits(emailText: string) {
  const client = new Anthropic();
  const msg = await client.messages.create({
    model: TRIAGE_MODEL,
    max_tokens: 8000,
    system: [
      "You are the Paperboy, a scout for Batch Capital (a business-funding broker). You read keyword-alert emails from F5Bot.",
      "Extract every Reddit hit in the email. Mark candidate=true only if the person could plausibly be:",
      "a business owner who needs funding, a funder/lender, or a referral partner (CPA, bookkeeper, consultant, broker of other services) whose clients need funding.",
      "Mark false for: startup/VC fundraising, personal loans, students, crypto, people selling MCAs or advertising broker services, news, and jokes.",
      "\n# Lead Brain (for context)\n" + BRAINS["batch-capital/00-Lead-Brain.md"],
    ].join("\n"),
    output_config: { effort: "low", format: { type: "json_schema", schema: HITS_SCHEMA } },
    messages: [{ role: "user", content: `<email>\n${emailText.slice(0, 60000)}\n</email>` }],
  });
  const block = msg.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") return { hits: [] as Hit[], usage: msg.usage };
  return { hits: (JSON.parse(block.text).hits ?? []) as Hit[], usage: msg.usage };
}

async function pool<T>(items: T[], size: number, fn: (t: T) => Promise<void>) {
  const queue = [...items];
  await Promise.all(Array.from({ length: Math.min(size, queue.length) }, async () => {
    for (let t = queue.shift(); t; t = queue.shift()) await fn(t);
  }));
}

export async function processAlertEmails(sb: SupabaseClient, emails: { subject?: string; body: string }[]) {
  const { data: ws } = await sb.from("workspaces").select("id").eq("slug", "batch-capital").single();
  if (!ws) throw new Error("batch-capital workspace missing");
  const { data: agents } = await sb.from("agents").select("id, slug").eq("workspace_id", ws.id).in("slug", ["reddit-scout", "town-boss"]);
  const scout = agents?.find((a) => a.slug === "reddit-scout")?.id ?? null;
  const boss = agents?.find((a) => a.slug === "town-boss")?.id ?? null;
  await sb.from("agents").update({ enabled: true }).in("id", [scout, boss].filter(Boolean) as string[]);

  const { data: run } = await sb.from("agent_runs").insert({
    agent_id: scout, workspace_id: ws.id, status: "running", started_at: new Date().toISOString(),
  }).select("id").single();

  let found = 0, reviewed = 0, promoted = 0, tokensIn = 0, tokensOut = 0, cost = 0;
  try {
    const text = emails.map((e) => `Subject: ${e.subject ?? ""}\n${e.body}`).join("\n\n-----\n\n");
    const { hits, usage } = await extractHits(text);
    tokensIn += usage.input_tokens; tokensOut += usage.output_tokens; cost += costOf(TRIAGE_MODEL, usage);
    found = hits.length;

    await pool(hits, 4, async (h) => {
      const hash = createHash("sha256").update(h.url.split("?")[0]).digest("hex");
      const { data: post, error } = await sb.from("source_posts").insert({
        workspace_id: ws.id, platform: "reddit", url: h.url, author_handle: h.author, snippet: h.snippet.slice(0, 1000),
        content_hash: hash, raw: h, captured_by: scout,
      }).select("id").single();
      if (error) return; // already seen this post
      if (!h.candidate) return;

      const dedupe = `reddit:${(h.author ?? hash).toLowerCase()}`;
      const { count } = await sb.from("leads").select("id", { count: "exact", head: true })
        .eq("workspace_id", ws.id).eq("dedupe_key", dedupe)
        .gte("created_at", new Date(Date.now() - 30 * 864e5).toISOString());
      if (count) return; // one lead per person per 30 days

      const submission = [
        `Platform: Reddit${h.subreddit ? ` (r/${h.subreddit})` : ""}`, `Author: ${h.author ?? "unknown"}`,
        `URL: ${h.url}`, h.title ? `Title: ${h.title}` : null, `Matched keyword: ${h.keyword ?? "?"}`,
        `Text (alert excerpt only, full post not fetched):\n${h.snippet}`,
      ].filter(Boolean).join("\n");
      const { review: r, usage: u, cost: c } = await review(sb, ws.id, "Reddit post found by the Paperboy (outbound; they did NOT contact us)", submission);
      reviewed++; tokensIn += u.input_tokens; tokensOut += u.output_tokens; cost += c;

      // Outbound finds use the Lead Brain rubric as written: 8+ queue, 6-7.9 maybe, 5 and under tossed.
      const status = r.disqualified || r.score < 6 ? "discarded" : r.score >= 8 ? "promoted" : "maybe";
      const { data: lead } = await sb.from("leads").insert({
        workspace_id: ws.id, lead_type: r.lead_type, source_post_id: post!.id, found_by: scout, platform: "reddit",
        author_handle: h.author, url: h.url, name: r.name, company: r.company, industry: r.industry, state: r.state,
        monthly_revenue: r.monthly_revenue, months_in_business: r.months_in_business, why_it_matches: r.why_it_matches,
        segment_keys: r.segment_keys ?? [], score: r.score,
        score_breakdown: { ...r.score_breakdown, likely_lenders: r.likely_lenders, processing_angle: r.processing_angle, subreddit: h.subreddit },
        reviewer_notes: r.disqualified ? `Disqualified: ${r.disqualify_reason}. ${r.reviewer_notes}` : r.reviewer_notes,
        suggested_opener: r.suggested_opener, status, stage_key: "new", stage_changed_at: new Date().toISOString(), dedupe_key: dedupe,
      }).select("id").single();
      if (!lead) return;

      await sb.from("events").insert([
        { workspace_id: ws.id, actor: "agent", agent_id: scout, entity_type: "lead", entity_id: lead.id, event_type: "lead.found", payload: { platform: "reddit", subreddit: h.subreddit, keyword: h.keyword } },
        { workspace_id: ws.id, actor: "agent", agent_id: boss, entity_type: "lead", entity_id: lead.id, event_type: "lead.reviewed", payload: { score: r.score, status } },
      ]);

      if (status === "promoted") {
        promoted++;
        const who = h.author ? `u/${h.author}` : r.company || "a Reddit poster";
        await sb.from("cards").insert({
          workspace_id: ws.id, kind: "approve_action", urgency: "normal",
          title: `Paperboy found ${who}${h.subreddit ? ` in r/${h.subreddit}` : ""}, ${r.score}/10 ${r.lead_type.replace("_", " ")}. Want a draft reply?`,
          body: [
            r.why_it_matches, `Boss: ${r.reviewer_notes}`,
            r.likely_lenders?.length ? `Likely fits: ${r.likely_lenders.slice(0, 4).join(", ")}` : null,
            `Post: ${h.url}`, `Suggested opener: "${r.suggested_opener}"`,
          ].filter(Boolean).join("\n\n"),
          source_agent_id: boss, entity_type: "lead", entity_id: lead.id,
          proposed_action: { type: "draft_first_reply", lead_id: lead.id },
        });
      }
    });

    if (run) await sb.from("agent_runs").update({
      status: "succeeded", finished_at: new Date().toISOString(), items_found: found, items_promoted: promoted,
      tokens_in: tokensIn, tokens_out: tokensOut, cost_usd: cost,
      summary: `${found} hits, ${reviewed} reviewed, ${promoted} to your queue`,
    }).eq("id", run.id);
    return { found, reviewed, promoted };
  } catch (e) {
    if (run) await sb.from("agent_runs").update({
      status: "failed", finished_at: new Date().toISOString(), error: e instanceof Error ? e.message : String(e), summary: "Alert processing failed",
    }).eq("id", run.id);
    throw e;
  }
}
