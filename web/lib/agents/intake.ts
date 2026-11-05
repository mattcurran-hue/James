import { createHash } from "node:crypto";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { review } from "./bank-manager";

// The Intake Clerk (The Receptionist): catches contact-form submissions, has the
// Bank Manager review them, files the lead, and asks Matt through James when it matters.

const NOISE = /^(g-recaptcha|recaptcha|cf-turnstile|_|form_id|formid|submit|page_url|utm_)/i;

export function clean(fields: Record<string, unknown>) {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(fields)) {
    if (NOISE.test(k) || v == null) continue;
    const s = typeof v === "string" ? v : JSON.stringify(v);
    if (s.trim()) out[k] = s.trim().slice(0, 4000);
  }
  return out;
}

export async function processIntake(raw: Record<string, unknown>, origin: "web_form" | "test") {
  const fields = clean(raw);
  if (Object.keys(fields).length === 0) return { ok: false as const, reason: "empty submission" };

  const sb = supabaseAdmin();
  const { data: ws } = await sb.from("workspaces").select("id").eq("slug", "batch-capital").single();
  if (!ws) throw new Error("batch-capital workspace missing");
  const { data: agents } = await sb.from("agents").select("id, slug").eq("workspace_id", ws.id).in("slug", ["intake-clerk", "town-boss"]);
  const clerk = agents?.find((a) => a.slug === "intake-clerk")?.id ?? null;
  const boss = agents?.find((a) => a.slug === "town-boss")?.id ?? null;

  const text = Object.entries(fields).map(([k, v]) => `${k}: ${v}`).join("\n");
  const hash = createHash("sha256").update(text).digest("hex");

  const { data: run } = await sb.from("agent_runs").insert({
    agent_id: clerk, workspace_id: ws.id, status: "running", started_at: new Date().toISOString(),
  }).select("id").single();

  const finish = (patch: Record<string, unknown>) =>
    run && sb.from("agent_runs").update({ finished_at: new Date().toISOString(), ...patch }).eq("id", run.id);

  try {
    const { data: post, error: dupErr } = await sb.from("source_posts").insert({
      workspace_id: ws.id, platform: "web_form", snippet: text.slice(0, 500), content_hash: hash,
      raw: { fields, origin }, captured_by: clerk,
    }).select("id").single();
    if (dupErr?.code === "23505") {
      await finish({ status: "succeeded", summary: "Duplicate submission, skipped" });
      return { ok: true as const, duplicate: true };
    }
    if (dupErr) throw dupErr;

    const { review: r, usage } = await review(sb, ws.id, origin === "test" ? "Website contact form (TEST)" : "Website contact form (batchgroup.co/contact)", text);

    // Inbound leads reached out to us, so nothing from the site gets silently tossed:
    // 8+ is urgent, 6-7.9 goes to the queue, under 6 waits in Maybe, disqualified is archived with a reason.
    const status = r.disqualified ? "discarded" : r.score >= 6 ? "promoted" : "maybe";

    const { data: lead, error: leadErr } = await sb.from("leads").insert({
      workspace_id: ws.id, lead_type: r.lead_type, source_post_id: post!.id, found_by: clerk, platform: "web_form",
      name: r.name, company: r.company, email: r.email, phone: r.phone, industry: r.industry, state: r.state,
      monthly_revenue: r.monthly_revenue, months_in_business: r.months_in_business,
      why_it_matches: r.why_it_matches, segment_keys: r.segment_keys ?? [], score: r.score,
      score_breakdown: { ...r.score_breakdown, likely_lenders: r.likely_lenders, processing_angle: r.processing_angle },
      reviewer_notes: r.disqualified ? `Disqualified: ${r.disqualify_reason}. ${r.reviewer_notes}` : r.reviewer_notes,
      suggested_opener: r.suggested_opener, status, stage_key: "new", stage_changed_at: new Date().toISOString(),
      dedupe_key: `web_form:${(r.email ?? r.phone ?? hash).toLowerCase()}`,
    }).select("id").single();
    if (leadErr) throw leadErr;

    await sb.from("events").insert([
      { workspace_id: ws.id, actor: "agent", agent_id: clerk, entity_type: "lead", entity_id: lead!.id, event_type: "lead.found", payload: { platform: "web_form", origin } },
      { workspace_id: ws.id, actor: "agent", agent_id: boss, entity_type: "lead", entity_id: lead!.id, event_type: "lead.reviewed", payload: { score: r.score, status } },
    ]);

    if (status === "promoted") {
      const who = r.company || r.name || "Unknown";
      await sb.from("cards").insert({
        workspace_id: ws.id, kind: "approve_action", urgency: r.score >= 8 ? "urgent" : "normal",
        title: `New website lead: ${who}, ${r.score}/10. Want me to draft the first reply?`,
        body: [
          r.why_it_matches,
          `Boss: ${r.reviewer_notes}`,
          r.likely_lenders?.length ? `Likely fits: ${r.likely_lenders.slice(0, 4).join(", ")}` : null,
          r.processing_angle ? "Processing prospect too, so the Waitress will pitch BatchOut." : null,
          `Suggested opener: "${r.suggested_opener}"`,
        ].filter(Boolean).join("\n\n"),
        source_agent_id: boss, entity_type: "lead", entity_id: lead!.id,
        proposed_action: { type: "draft_first_reply", lead_id: lead!.id },
      });
    }

    await finish({
      status: "succeeded", items_found: 1, items_promoted: status === "promoted" ? 1 : 0,
      tokens_in: usage.input_tokens, tokens_out: usage.output_tokens,
      summary: `${r.company || r.name || "Lead"} scored ${r.score} → ${status}`,
    });
    return { ok: true as const, lead_id: lead!.id, score: r.score, status };
  } catch (e) {
    await finish({ status: "failed", error: e instanceof Error ? e.message : String(e), summary: "Intake failed" });
    throw e;
  }
}
