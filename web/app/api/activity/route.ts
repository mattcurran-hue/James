import { NextResponse, type NextRequest } from "next/server";
import { hasSecret } from "@/lib/auth-secret";
import { supabaseAdmin } from "@/lib/supabase/admin";

// Matt's PC → James. The ActivityWatch sync script posts "today so far" every hour.
// Already privacy-filtered on the PC; stored as an HQ-level event (no town).
type Row = { name: string; seconds: number };
type Body = { date?: string; active_seconds?: number; apps?: Row[]; titles?: Row[]; sites?: Row[] };

const clean = (rows: unknown, max: number) =>
  (Array.isArray(rows) ? rows : [])
    .filter((r): r is Row => typeof r?.name === "string" && typeof r?.seconds === "number" && r.seconds >= 30)
    .map((r) => ({ name: r.name.slice(0, 160), seconds: Math.round(r.seconds) }))
    .slice(0, max);

export async function POST(req: NextRequest) {
  if (!hasSecret(req)) return NextResponse.json({ ok: false }, { status: 401 });
  let body: Body;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, reason: "bad json" }, { status: 400 }); }
  if (!body.date || !/^\d{4}-\d{2}-\d{2}$/.test(body.date)) return NextResponse.json({ ok: false, reason: "date required" }, { status: 400 });

  const payload = {
    date: body.date, active_seconds: Math.round(body.active_seconds ?? 0),
    apps: clean(body.apps, 25), titles: clean(body.titles, 40), sites: clean(body.sites, 25),
  };
  const { error } = await supabaseAdmin().from("events").insert({
    workspace_id: null, actor: "matt", entity_type: "activity", event_type: "activity.day", payload,
  });
  if (error) return NextResponse.json({ ok: false, reason: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
