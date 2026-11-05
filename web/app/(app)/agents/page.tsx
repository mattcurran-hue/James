import { supabaseServer } from "@/lib/supabase/server";
import { loadWorkspaces } from "@/lib/workspace";
import { ago } from "@/lib/format";

type Agent = { id: string; name: string; character: string | null; role: string; enabled: boolean; workspace_id: string | null; config: { phase?: number; needs?: string } };
type Run = { agent_id: string; status: string; summary: string | null; created_at: string; items_found: number; items_promoted: number };

const ROLE_ORDER = ["james", "head_boss", "town_boss", "worker"];

export default async function Agents() {
  const sb = await supabaseServer();
  const { current } = await loadWorkspaces(sb);
  const [{ data: a }, { data: r }] = await Promise.all([
    sb.from("agents").select("id, name, character, role, enabled, workspace_id, config")
      .or(`workspace_id.eq.${current!.id},workspace_id.is.null`),
    sb.from("agent_runs").select("agent_id, status, summary, created_at, items_found, items_promoted")
      .order("created_at", { ascending: false }).limit(300),
  ]);
  const agents = ((a ?? []) as Agent[]).sort((x, y) =>
    ROLE_ORDER.indexOf(x.role) - ROLE_ORDER.indexOf(y.role) || (x.config.phase ?? 9) - (y.config.phase ?? 9));
  const last = new Map<string, Run>();
  for (const run of (r ?? []) as Run[]) if (!last.has(run.agent_id)) last.set(run.agent_id, run);

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {agents.map((ag) => {
        const run = last.get(ag.id);
        const status = !ag.enabled ? "off" : run?.status === "running" ? "working" : run?.status === "failed" ? "stuck" : "idle";
        const dot = { off: "bg-line", working: "bg-teal animate-pulse", stuck: "bg-coral", idle: "bg-mustard" }[status];
        return (
          <div key={ag.id} className="card">
            <div className="flex items-center gap-2">
              <span className={`size-2.5 rounded-full ${dot}`} />
              <span className="font-medium">{ag.name}</span>
              <span className="ml-auto text-xs text-muted">{status}</span>
            </div>
            <div className="mt-0.5 text-xs text-muted">
              {ag.character} · {ag.role.replace("_", " ")}{ag.workspace_id ? "" : " · HQ"}
              {ag.config.phase ? ` · phase ${ag.config.phase}` : ""}
            </div>
            <p className="mt-3 text-sm text-muted">
              {run ? `${run.summary ?? run.status} · ${ago(run.created_at)}` : ag.config.needs ? `Waiting on: ${ag.config.needs.replaceAll("_", " ")}` : "Hasn't run yet."}
            </p>
          </div>
        );
      })}
    </div>
  );
}
