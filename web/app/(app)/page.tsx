import { supabaseServer } from "@/lib/supabase/server";
import { loadWorkspaces } from "@/lib/workspace";
import { decideCard, toggleChecklist, addChecklist } from "@/app/actions";
import { ago, today, hoursAgoIso } from "@/lib/format";

type Card = {
  id: string; title: string; body: string | null; urgency: "normal" | "urgent"; kind: string; created_at: string;
  source: { name: string; character: string | null } | null;
};
type Item = { id: string; title: string; done: boolean; owner: { name: string } | null };

export default async function Today() {
  const sb = await supabaseServer();
  const { current } = await loadWorkspaces(sb);
  const ws = current!.id;

  const [{ data: cards }, { data: items }, { count: leadCount }, { data: runs }] = await Promise.all([
    sb.from("cards").select("id, title, body, urgency, kind, created_at, source:source_agent_id(name, character)")
      .eq("status", "pending").or(`workspace_id.eq.${ws},workspace_id.is.null`)
      .order("urgency", { ascending: false }).order("created_at"),
    sb.from("checklist_items").select("id, title, done, owner:owner_agent(name)")
      .eq("for_date", today()).or(`workspace_id.eq.${ws},workspace_id.is.null`).order("created_at"),
    sb.from("leads").select("id", { count: "exact", head: true }).eq("workspace_id", ws).eq("status", "promoted"),
    sb.from("agent_runs").select("id, status").eq("workspace_id", ws)
      .gte("created_at", hoursAgoIso(24)),
  ]);

  const pending = (cards ?? []) as unknown as Card[];
  const list = (items ?? []) as unknown as Item[];
  const mine = list.filter((i) => !i.owner);
  const agents = list.filter((i) => i.owner);
  const failed = (runs ?? []).filter((r) => r.status === "failed").length;

  return (
    <div className="space-y-8">
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Waiting on you" value={pending.length} tone={pending.length ? "coral" : undefined} />
        <Stat label="Leads in queue" value={leadCount ?? 0} />
        <Stat label="Agent runs (24h)" value={runs?.length ?? 0} />
        <Stat label="Failed runs (24h)" value={failed} tone={failed ? "coral" : undefined} />
      </section>

      <section>
        <h2 className="h-section">James needs you</h2>
        {pending.length === 0 ? (
          <p className="card text-sm text-muted">Nothing needs your sign-off. James will speak up when something does.</p>
        ) : (
          <ul className="space-y-3">
            {pending.map((c) => (
              <li key={c.id} className={`card ${c.urgency === "urgent" ? "border-coral/60" : ""}`}>
                <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                  {c.urgency === "urgent" && <span className="pill border-coral/60 text-coral">urgent</span>}
                  <span>{c.source ? `${c.source.name}${c.source.character ? ` (${c.source.character})` : ""}` : "James"}</span>
                  <span>· {ago(c.created_at)}</span>
                </div>
                <p className="font-medium">{c.title}</p>
                {c.body && <p className="mt-1 whitespace-pre-wrap text-sm text-muted">{c.body}</p>}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <form action={decideCard}>
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="decision" value="approved" />
                    <button className="btn btn-teal">Yes</button>
                  </form>
                  <form action={decideCard}>
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="decision" value="rejected" />
                    <button className="btn btn-coral">No</button>
                  </form>
                  <form action={decideCard} className="flex min-w-60 flex-1 gap-2">
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="decision" value="changes_requested" />
                    <input name="note" className="input py-1.5" placeholder="Change it to…" />
                    <button className="btn">Send back</button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div>
          <h2 className="h-section">Your checklist</h2>
          <div className="card space-y-2">
            {mine.length === 0 && <p className="text-sm text-muted">Nothing on your list today.</p>}
            {mine.map((i) => <Check key={i.id} item={i} />)}
            <form action={addChecklist} className="flex gap-2 pt-2">
              <input type="hidden" name="workspace_id" value={current!.id} />
              <input name="title" className="input py-1.5" placeholder="Add a task…" />
              <button className="btn">Add</button>
            </form>
          </div>
        </div>
        <div>
          <h2 className="h-section">Agents&apos; checklist</h2>
          <div className="card space-y-2">
            {agents.length === 0 && <p className="text-sm text-muted">No agent tasks yet. They show up once agents go live.</p>}
            {agents.map((i) => <Check key={i.id} item={i} who={i.owner?.name} />)}
          </div>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: "coral" }) {
  return (
    <div className="card">
      <div className={`text-2xl font-semibold ${tone === "coral" ? "text-coral" : ""}`}>{value}</div>
      <div className="text-xs text-muted">{label}</div>
    </div>
  );
}

function Check({ item, who }: { item: Item; who?: string }) {
  return (
    <form action={toggleChecklist} className="flex items-center gap-2 text-sm">
      <input type="hidden" name="id" value={item.id} />
      <input type="hidden" name="done" value={String(!item.done)} />
      <button aria-label={item.done ? "Mark not done" : "Mark done"}
        className={`grid size-5 place-items-center rounded border ${item.done ? "border-teal bg-teal text-bg" : "border-line"}`}>
        {item.done ? "✓" : ""}
      </button>
      <span className={item.done ? "text-muted line-through" : ""}>{item.title}</span>
      {who && <span className="pill ml-auto">{who}</span>}
    </form>
  );
}
