import Anthropic from "@anthropic-ai/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";
import { MODEL } from "./bank-manager";

// Chud (The Town Crier): keeps Matt current on the MCA world. Researches with live web
// search, then files a structured brief. Silent unless something needs Matt's attention now.

const STRUCTURE_MODEL = "claude-haiku-5-5";

export type BriefItem = {
  title: string; summary: string; why_it_matters: string; url: string | null; source: string | null;
  category: "regulation" | "funders" | "lawsuits" | "market" | "competitors" | "other";
  impact: "info" | "watch" | "urgent"; affects: string[];
};
export type Brief = { headline: string; items: BriefItem[] };

const BRIEF_SCHEMA = {
  type: "object", additionalProperties: false,
  properties: {
    headline: { type: "string", description: "One-line summary of the period for Matt" },
    items: {
      type: "array",
      items: {
        type: "object", additionalProperties: false,
        properties: {
          title: { type: "string" }, summary: { type: "string", description: "2-3 sentences, own words" },
          why_it_matters: { type: "string", description: "What this means for Batch Capital specifically" },
          url: { type: ["string", "null"] }, source: { type: ["string", "null"] },
          category: { type: "string", enum: ["regulation", "funders", "lawsuits", "market", "competitors", "other"] },
          impact: { type: "string", enum: ["info", "watch", "urgent"], description: "urgent = Matt should act or know today (e.g. a panel funder shut down, a new law in a state he funds, a disclosure deadline)" },
          affects: { type: "array", items: { type: "string" }, description: "Lenders on Matt's panel or states this touches" },
        },
        required: ["title", "summary", "why_it_matters", "url", "source", "category", "impact", "affects"],
      },
    },
  },
  required: ["headline", "items"],
};

async function research(panel: string, sinceDays: number) {
  const client = new Anthropic();
  const system = [
    "You are Chud, the Town Crier: an MCA (merchant cash advance) industry analyst working for Matt Curran, who runs Batch Capital, a small MCA/business-funding broker in the NY/NJ area.",
    `Research what happened in the MCA and small-business-finance world in the last ${sinceDays} days. Cover:`,
    "1. Regulation: state commercial financing disclosure laws, usury/MCA rulings, FTC/CFPB/state AG actions, broker licensing.",
    "2. Funders: launches, shutdowns, acquisitions, layoffs, program changes, especially any funder on Matt's panel.",
    "3. Lawsuits and enforcement involving funders, brokers, or ISOs.",
    "4. Market: capital raises, securitizations, default trends, industry events (deBanked, etc.).",
    "Prefer primary and trade sources (deBanked, court records, regulator sites, reputable press). Only include things dated within the window. Skip fluff and press-release spam.",
    "For each item give the date, a short factual summary in your own words, why it matters to a small broker, and the source URL. If nothing material happened in a category, say so in one line.",
    `\nMatt's lender panel:\n${panel}`,
  ].join("\n");

  let messages: Anthropic.MessageParam[] = [{ role: "user", content: `Today is ${new Date().toISOString().slice(0, 10)}. Write the brief research notes.` }];
  let usage = { input_tokens: 0, output_tokens: 0 };
  for (let i = 0; i < 4; i++) {
    const msg = await client.messages.create({
      model: MODEL, max_tokens: 12000, system, messages,
      tools: [{ type: "web_search_20260318", name: "web_search", max_uses: 12 }],
      output_config: { effort: "medium" },
    });
    usage = { input_tokens: usage.input_tokens + msg.usage.input_tokens, output_tokens: usage.output_tokens + msg.usage.output_tokens };
    if (msg.stop_reason === "pause_turn") { messages = [...messages, { role: "assistant", content: msg.content }]; continue; }
    const text = msg.content.filter((b) => b.type === "text").map((b) => (b as Anthropic.TextBlock).text).join("\n");
    const urls = msg.content.flatMap((b) => b.type === "web_search_tool_result" && Array.isArray(b.content)
      ? b.content.map((r) => `${r.title} — ${r.url}`) : []);
    return { notes: `${text}\n\nSources seen:\n${urls.join("\n")}`, usage };
  }
  throw new Error("Research did not finish");
}

async function structure(notes: string) {
  const client = new Anthropic();
  const msg = await client.messages.create({
    model: STRUCTURE_MODEL, max_tokens: 8000,
    system: "Turn these research notes into Matt's brief. Keep only real, dated, sourced items. Use the notes' own facts; do not add any. Paraphrase; never copy sentences from sources.",
    output_config: { effort: "low", format: { type: "json_schema", schema: BRIEF_SCHEMA } },
    messages: [{ role: "user", content: notes }],
  });
  const block = msg.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") throw new Error("No brief returned");
  return { brief: JSON.parse(block.text) as Brief, usage: msg.usage };
}

export async function runChud(sb: SupabaseClient, sinceDays = 1) {
  const { data: ws } = await sb.from("workspaces").select("id").eq("slug", "batch-capital").single();
  if (!ws) throw new Error("batch-capital workspace missing");

  // Make sure Chud exists on the roster.
  let { data: agent } = await sb.from("agents").select("id").eq("workspace_id", ws.id).eq("slug", "chud").maybeSingle();
  if (!agent) {
    ({ data: agent } = await sb.from("agents").insert({
      workspace_id: ws.id, slug: "chud", name: "Chud", character: "The Town Crier", role: "worker",
      enabled: true, schedule_cron: "0 11 * * *", config: { phase: 1 },
    }).select("id").single());
  }
  const agentId = agent?.id ?? null;

  const { data: run } = await sb.from("agent_runs").insert({
    agent_id: agentId, workspace_id: ws.id, status: "running", started_at: new Date().toISOString(),
  }).select("id").single();

  try {
    const { data: lenders } = await sb.from("lenders").select("name, status").eq("workspace_id", ws.id).in("status", ["signed", "negotiating"]);
    const panel = (lenders ?? []).map((l) => `- ${l.name} (${l.status === "signed" ? "live" : "pending"})`).join("\n");

    const r = await research(panel, sinceDays);
    const s = await structure(r.notes);
    const brief = s.brief;

    const { data: ev } = await sb.from("events").insert({
      workspace_id: ws.id, actor: "agent", agent_id: agentId, entity_type: "brief", event_type: "news.brief",
      payload: { ...brief, since_days: sinceDays, date: new Date().toISOString().slice(0, 10) },
    }).select("id").single();

    // Only urgent items reach Matt; everything else waits quietly on the News page.
    for (const item of brief.items.filter((i) => i.impact === "urgent")) {
      await sb.from("cards").insert({
        workspace_id: ws.id, kind: "escalation", urgency: "urgent",
        title: `Chud: ${item.title}`,
        body: [item.summary, `Why it matters: ${item.why_it_matters}`, item.affects.length ? `Touches: ${item.affects.join(", ")}` : null, item.url].filter(Boolean).join("\n\n"),
        source_agent_id: agentId, entity_type: "brief", proposed_action: { type: "acknowledge", event_id: ev?.id },
      });
    }

    const urgent = brief.items.filter((i) => i.impact === "urgent").length;
    if (run) await sb.from("agent_runs").update({
      status: "succeeded", finished_at: new Date().toISOString(), items_found: brief.items.length, items_promoted: urgent,
      tokens_in: r.usage.input_tokens + s.usage.input_tokens, tokens_out: r.usage.output_tokens + s.usage.output_tokens,
      summary: `${brief.items.length} items${urgent ? `, ${urgent} urgent` : ""}: ${brief.headline}`.slice(0, 300),
    }).eq("id", run.id);
    return { items: brief.items.length, urgent };
  } catch (e) {
    if (run) await sb.from("agent_runs").update({
      status: "failed", finished_at: new Date().toISOString(), error: e instanceof Error ? e.message : String(e), summary: "News run failed",
    }).eq("id", run.id);
    throw e;
  }
}
