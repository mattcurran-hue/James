import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import { loadWorkspaces } from "@/lib/workspace";
import { ago, money } from "@/lib/format";

const TABS = [
  ["promoted", "Your queue"], ["maybe", "Maybe"], ["pending_review", "With the boss"], ["discarded", "Tossed"],
] as const;

type Lead = {
  id: string; lead_type: string; name: string | null; company: string | null; author_handle: string | null;
  platform: string | null; url: string | null; industry: string | null; state: string | null;
  monthly_revenue: number | null; score: number | null; why_it_matches: string | null; reviewer_notes: string | null;
  suggested_opener: string | null; segment_keys: string[]; stage_key: string | null; created_at: string;
};

export default async function Leads({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab = "promoted" } = await searchParams;
  const sb = await supabaseServer();
  const { current } = await loadWorkspaces(sb);
  const { data } = await sb.from("leads").select("*").eq("workspace_id", current!.id).eq("status", tab)
    .order("score", { ascending: false, nullsFirst: false }).order("created_at", { ascending: false }).limit(100);
  const leads = (data ?? []) as Lead[];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1">
        {TABS.map(([key, label]) => (
          <Link key={key} href={`/leads?tab=${key}`}
            className={`rounded-md px-3 py-1.5 text-sm ${tab === key ? "bg-panel-2" : "text-muted hover:text-ink"}`}>
            {label}
          </Link>
        ))}
      </div>
      {leads.length === 0 ? (
        <p className="card text-sm text-muted">No leads here yet. The scouts fill this once they go live.</p>
      ) : (
        <ul className="space-y-3">
          {leads.map((l) => (
            <li key={l.id} className="card">
              <div className="flex flex-wrap items-center gap-2">
                {l.score != null && (
                  <span className={`rounded-md px-2 py-0.5 text-sm font-semibold ${l.score >= 8 ? "bg-teal text-bg" : "bg-panel-2"}`}>
                    {l.score.toFixed(1)}
                  </span>
                )}
                <span className="font-medium">{l.company || l.name || l.author_handle || "Unknown"}</span>
                <span className="pill">{l.lead_type.replace("_", " ")}</span>
                {l.segment_keys.map((s) => <span key={s} className="pill border-mustard/50 text-mustard">{s.replaceAll("_", " ")}</span>)}
                <span className="ml-auto text-xs text-muted">{l.platform} · {ago(l.created_at)}</span>
              </div>
              <div className="mt-1 text-xs text-muted">
                {[l.industry, l.state, l.monthly_revenue ? `${money(l.monthly_revenue)}/mo` : null].filter(Boolean).join(" · ")}
              </div>
              {l.why_it_matches && <p className="mt-2 text-sm">{l.why_it_matches}</p>}
              {l.reviewer_notes && <p className="mt-1 text-sm text-muted">Boss: {l.reviewer_notes}</p>}
              {l.suggested_opener && <p className="mt-2 rounded-md bg-panel-2 p-2 text-sm">{l.suggested_opener}</p>}
              {l.url && <a href={l.url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm text-teal">Open post ↗</a>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
