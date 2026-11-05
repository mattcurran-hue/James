import Anthropic from "@anthropic-ai/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";
import { BRAINS } from "@/lib/brains.generated";
import { MODEL } from "./bank-manager";

// Drafts outreach in Matt's voice. Nothing is sent from here: every draft becomes an
// approve_draft card (Approve / Send back / Kill), per the draft → approve loop in James's rules.

const DRAFT_SCHEMA = {
  type: "object", additionalProperties: false,
  properties: {
    channel: { type: "string", enum: ["email", "dm"], description: "email if we have an address, otherwise a Reddit/platform DM" },
    subject: { type: ["string", "null"], description: "Email subject; null for DMs" },
    body: { type: "string" },
  },
  required: ["channel", "subject", "body"],
};

type Lead = {
  id: string; workspace_id: string; lead_type: string; platform: string | null; author_handle: string | null; url: string | null;
  name: string | null; company: string | null; email: string | null; phone: string | null; industry: string | null; state: string | null;
  monthly_revenue: number | null; months_in_business: number | null; why_it_matches: string | null;
  reviewer_notes: string | null; suggested_opener: string | null; score_breakdown: Record<string, unknown> | null;
  source_post_id: string | null;
};

export async function draftReply(sb: SupabaseClient, leadId: string, opts: { guidance?: string | null; previous?: { id: string; version: number; body: string } } = {}) {
  const { data: lead } = await sb.from("leads").select("*").eq("id", leadId).single<Lead>();
  if (!lead) throw new Error("Lead not found");
  const { data: source } = lead.platform === "web_form" && lead.source_post_id
    ? await sb.from("source_posts").select("raw").eq("id", lead.source_post_id).single()
    : { data: null };

  const facts = [
    `Lead type: ${lead.lead_type}`, `Found on: ${lead.platform}${lead.url ? ` (${lead.url})` : ""}`,
    lead.author_handle && `Handle: ${lead.author_handle}`, lead.name && `Name: ${lead.name}`, lead.company && `Business: ${lead.company}`,
    lead.email && `Email: ${lead.email}`, lead.industry && `Industry: ${lead.industry}`, lead.state && `State: ${lead.state}`,
    lead.monthly_revenue && `Revenue: ~$${lead.monthly_revenue}/mo`, lead.months_in_business && `Time in business: ${lead.months_in_business} months`,
    lead.why_it_matches && `Why it matches: ${lead.why_it_matches}`, lead.reviewer_notes && `Bank Manager notes: ${lead.reviewer_notes}`,
    lead.suggested_opener && `Bank Manager's suggested opener: ${lead.suggested_opener}`,
    source && `Original submission: ${JSON.stringify(source.raw)}`,
  ].filter(Boolean).join("\n");

  const system = [
    "You write outreach for Matt Curran, who runs Batch Capital, a business-funding BROKER (never a lender).",
    "Voice: direct, casual, human, short. No hype, no exclamation-mark spam, no corporate filler. Sound like a real person, not a template.",
    "Never say 'we lend', 'direct lender', 'pre-approved', 'approved', or 'guaranteed'. Don't quote rates or amounts as offers.",
    "Goal of a first reply: start a conversation and get a call or bank statements. One clear ask.",
    "Reddit DMs: 60-110 words, reference their post specifically, no links, no signature block. Emails: under 140 words, plain-text, sign off as 'Matt' + 'Batch Capital'.",
    "Referral partners: lead with what's in it for their clients, mention a referral fee exists but no numbers. Funders: brief ISO partnership intro.",
    "\n# Lead Brain\n" + BRAINS["batch-capital/00-Lead-Brain.md"],
  ].join("\n");

  const ask = opts.previous
    ? `Revise this draft. Matt's instructions: "${opts.guidance}".\n\nPrevious draft:\n${opts.previous.body}`
    : opts.guidance ? `Write the first reply. Matt's instructions: "${opts.guidance}".` : "Write the first reply.";

  const client = new Anthropic();
  const msg = await client.messages.create({
    model: MODEL, max_tokens: 4000, system,
    output_config: { effort: "low", format: { type: "json_schema", schema: DRAFT_SCHEMA } },
    messages: [{ role: "user", content: `<lead>\n${facts}\n</lead>\n\n${ask}` }],
  });
  const block = msg.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") throw new Error("No draft returned");
  const d = JSON.parse(block.text) as { channel: "email" | "dm"; subject: string | null; body: string };
  const channel = lead.email ? d.channel : "dm";

  const { data: draft, error } = await sb.from("drafts").insert({
    workspace_id: lead.workspace_id, lead_id: lead.id, parent_id: opts.previous?.id ?? null,
    version: (opts.previous?.version ?? 0) + 1, channel, recipient: channel === "email" ? lead.email : lead.author_handle,
    subject: channel === "email" ? d.subject : null, body: d.body, status: "awaiting_approval",
  }).select("id, version").single();
  if (error) throw error;

  const who = lead.company || lead.name || (lead.author_handle ? `u/${lead.author_handle}` : "lead");
  await sb.from("cards").insert({
    workspace_id: lead.workspace_id, kind: "approve_draft",
    title: `Draft ${channel === "email" ? "email" : "DM"} to ${who}${draft.version > 1 ? ` (v${draft.version})` : ""}. Approve?`,
    body: d.body, entity_type: "draft", entity_id: draft.id,
    proposed_action: { type: "approve_draft", draft_id: draft.id, lead_id: lead.id, channel, subject: d.subject, recipient: lead.email ?? lead.author_handle, url: lead.url },
  });
  return draft;
}
