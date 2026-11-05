import { supabaseServer } from "@/lib/supabase/server";
import { loadWorkspaces } from "@/lib/workspace";
import type { Brief } from "@/lib/agents/chud";
import { RunNow } from "./run-now";

export const maxDuration = 300;

const IMPACT = { urgent: "border-coral/60 text-coral", watch: "border-mustard/60 text-mustard", info: "" } as const;

export default async function News() {
  const sb = await supabaseServer();
  const { current } = await loadWorkspaces(sb);
  const { data } = await sb.from("events").select("id, created_at, payload")
    .eq("workspace_id", current!.id).eq("event_type", "news.brief")
    .order("created_at", { ascending: false }).limit(14);
  const briefs = (data ?? []) as { id: string; created_at: string; payload: Brief & { since_days?: number; date?: string } }[];

  return (
    <div className="space-y-6">
      <div className="card flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="font-medium">Chud <span className="text-muted">· The Town Crier</span></div>
          <div className="text-sm text-muted">Reads the MCA world every morning at 6am ET. Urgent items also land on Today.</div>
        </div>
        <RunNow />
      </div>
      {briefs.length === 0 && <p className="card text-sm text-muted">No briefs yet. Hit &quot;Run Chud now&quot; for the last 7 days.</p>}
      {briefs.map((b) => (
        <section key={b.id}>
          <h2 className="h-section">
            {new Date(b.created_at).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "America/New_York" })}
            {b.payload.since_days && b.payload.since_days > 1 ? ` · last ${b.payload.since_days} days` : ""}
          </h2>
          <p className="mb-3 text-sm">{b.payload.headline}</p>
          <ul className="space-y-3">
            {b.payload.items.map((i, n) => (
              <li key={n} className="card">
                <div className="flex flex-wrap items-center gap-2">
                  {i.impact !== "info" && <span className={`pill ${IMPACT[i.impact]}`}>{i.impact}</span>}
                  <span className="pill">{i.category}</span>
                  <span className="font-medium">{i.title}</span>
                </div>
                <p className="mt-2 text-sm">{i.summary}</p>
                <p className="mt-1 text-sm text-muted">Why it matters: {i.why_it_matters}</p>
                {i.affects.length > 0 && <p className="mt-1 text-xs text-mustard">Touches: {i.affects.join(", ")}</p>}
                {i.url && <a href={i.url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm text-teal">{i.source ?? "Source"} ↗</a>}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
