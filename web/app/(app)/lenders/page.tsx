import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import { loadWorkspaces } from "@/lib/workspace";
import { money } from "@/lib/format";

const TABS = [["signed", "Live"], ["negotiating", "Pending"], ["contacted", "Contacted"], ["passed", "Passed"], ["dropped", "Dropped"]] as const;

type Lender = {
  id: string; name: string; status_detail: string | null; paper: string | null; positions: string | null;
  min_tib_months: number | null; min_monthly_rev: number | null; min_fico: number | null;
  deal_max: number | null; max_term: string | null; states_excluded: string[]; restricted_industries: string | null;
  submission_email: string | null; notes: string | null;
};

export default async function Lenders({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab = "signed" } = await searchParams;
  const sb = await supabaseServer();
  const { current } = await loadWorkspaces(sb);
  const { data } = await sb.from("lenders").select("*").eq("workspace_id", current!.id).eq("status", tab).order("name");
  const lenders = (data ?? []) as Lender[];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1">
        {TABS.map(([key, label]) => (
          <Link key={key} href={`/lenders?tab=${key}`}
            className={`rounded-md px-3 py-1.5 text-sm ${tab === key ? "bg-panel-2" : "text-muted hover:text-ink"}`}>{label}</Link>
        ))}
      </div>
      {lenders.length === 0 ? <p className="card text-sm text-muted">None in this town.</p> : (
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-panel-2 text-left text-xs text-muted">
              <tr>{["Lender", "Paper", "Positions", "Min TIB", "Min rev", "FICO", "Max deal", "Term", "Excluded", "Restricted"].map((h) =>
                <th key={h} className="px-3 py-2 font-medium">{h}</th>)}</tr>
            </thead>
            <tbody>
              {lenders.map((l) => (
                <tr key={l.id} className="border-t border-line align-top">
                  <td className="px-3 py-2">
                    <div className="font-medium">{l.name}</div>
                    {l.status_detail && <div className="text-xs text-muted">{l.status_detail}</div>}
                    {l.submission_email && <div className="text-xs text-teal">{l.submission_email}</div>}
                  </td>
                  <td className="px-3 py-2">{l.paper ?? "—"}</td>
                  <td className="px-3 py-2">{l.positions ?? "—"}</td>
                  <td className="px-3 py-2">{l.min_tib_months != null ? `${l.min_tib_months} mo` : "—"}</td>
                  <td className="px-3 py-2">{l.min_monthly_rev != null ? `${money(l.min_monthly_rev)}/mo` : "—"}</td>
                  <td className="px-3 py-2">{l.min_fico ?? "—"}</td>
                  <td className="px-3 py-2">{money(l.deal_max)}</td>
                  <td className="px-3 py-2">{l.max_term ?? "—"}</td>
                  <td className="px-3 py-2">{l.states_excluded.join(", ") || "—"}</td>
                  <td className="max-w-64 px-3 py-2 text-xs text-muted">{l.restricted_industries ?? l.notes ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
