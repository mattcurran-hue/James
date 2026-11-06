// Syncs data/lender-parameters.json into Supabase on every build.
// The JSON is the single source of truth for lenders and segments:
// edit it, push, and the database matches after the next deploy. No SQL step.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key || url.includes("example.supabase.co")) {
  console.log("sync-lenders: no Supabase credentials, skipping");
  process.exit(0);
}

const data = JSON.parse(readFileSync(new URL("../../data/lender-parameters.json", import.meta.url), "utf8"));
const sb = createClient(url, key, { auth: { persistSession: false } });

const status = (raw = "") => {
  const r = raw.toLowerCase();
  if (r.startsWith("live")) return "signed";
  if (r.startsWith("pending") || r.startsWith("in setup")) return "negotiating";
  if (r.startsWith("contacted")) return "contacted";
  if (r.startsWith("passed")) return "passed";
  if (r.startsWith("dropped")) return "dropped";
  return "prospect";
};
const blank = (v) => (v === "" || v === undefined ? null : v);

const { data: ws, error: wsErr } = await sb.from("workspaces").select("id").eq("slug", "batch-capital").single();
if (wsErr || !ws) { console.error("sync-lenders: batch-capital workspace not found", wsErr?.message); process.exit(0); }

const full = data.lenders.map((l) => ({
    workspace_id: ws.id, name: l.lender, status: status(l.status), status_detail: l.status,
    products: l.product ? [l.product] : [], paper: blank(l.paper), positions: blank(l.positions),
    min_tib_months: l.min_tib_months ?? null, min_monthly_rev: l.min_monthly_revenue ?? null, min_fico: l.min_fico ?? null,
    negative_day_limit: blank(l.negative_day_limit), deal_min: l.deal_min ?? null, deal_max: l.deal_max ?? null,
    max_term: blank(l.max_term), states_excluded: l.states_excluded ? [l.states_excluded] : [],
    restricted_industries: blank(l.restricted_industries), required_stips: blank(l.required_stips),
    submission_email: l.submission_email ?? null, notes: blank(l.notes), params: l, updated_at: new Date().toISOString(),
  }));
// Lenders without guidelines on file: only status, contact and notes (keeps their other columns as-is).
const light = (data.other_lenders ?? []).map((l) => ({
    workspace_id: ws.id, name: l.lender, status: status(l.status), status_detail: l.status,
    submission_email: l.submission_email ?? null, notes: l.notes ?? null, updated_at: new Date().toISOString(),
  }));
for (const [label, rows] of [["full", full], ["light", light]]) {
  if (!rows.length) continue;
  const { error } = await sb.from("lenders").upsert(rows, { onConflict: "workspace_id,name", defaultToNull: false });
  if (error) console.error(`sync-lenders: ${label} lenders failed:`, error.message);
}
const rows = [...full, ...light];

const segs = (data.segments ?? []).map((s, i) => {
  const name = s.Segment.replace(/^\d+\.\s*/, "");
  return {
    workspace_id: ws.id, key: name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, ""), position: i + 1, name,
    who: s["Who to look for"], hard_filters: s["Hard filters (all must be true)"], best_lenders: s["Best lenders"],
    public_signals: s["Public signals an AI agent can use"],
  };
});
const { error: sErr } = await sb.from("segments").upsert(segs, { onConflict: "workspace_id,key" });
if (sErr) console.error("sync-lenders: segments failed:", sErr.message);

console.log(`sync-lenders: ${rows.length} lenders, ${segs.length} segments synced`);
