import { supabaseServer } from "@/lib/supabase/server";
import { loadWorkspaces } from "@/lib/workspace";
import { decideCard, toggleChecklist, addChecklist, markSent } from "@/app/actions";
import { Submit, CopyButton } from "./client-bits";
import { ago, today, hoursAgoIso } from "@/lib/format";

type Card = {
  id: string; title: string; body: string | null; urgency: "normal" | "urgent"; kind: string; created_at: string;
  source: { name: string; character: string | null } | null;
};
type Ready = {
  id: string; channel: string; recipient: string | null; subject: string | null; body: string;
  lead: { url: string | null; company: string | null; name: string | null; author_handle: string | null } | null;
};
type Activity = { active_seconds: number; apps: { name: string; seconds: number }[]; sites: { name: string; seconds: number }[] };
type Item = { id: string; title: string; done: boolean; owner: { name: string } | null };

export default async function Today() {
  const sb = await supabaseServer();
  const { current } = await loadWorkspaces(sb);
  const ws = current!.id;

  const [{ data: cards }, { data: items }, { count: leadCount }, { data: runs }, { data: ready }, { data: act }] = await Promise.all([
    sb.from("cards").select("id, title, body, urgency, kind, created_at, source:source_agent_id(name, character)")
      .eq("status", "pending").or(`workspace_id.eq.${ws},workspace_id.is.null`)
      .order("urgency", { ascending: false }).order("created_at"),
    sb.from("checklist_items").select("id, title, done, owner:owner_agent(name)")
      .eq("for_date", today()).or(`workspace_id.eq.${ws},workspace_id.is.null`).order("created_at"),
    sb.from("leads").select("id", { count: "exact", head: true }).eq("workspace_id", ws).eq("status", "promoted"),
    sb.from("agent_runs").select("id, status").eq("workspace_id", ws)
      .gte("created_at", hoursAgoIso(24)),
    sb.from("drafts").select("id, channel, recipient, subject, body, lead:lead_id(url, company, name, author_handle)")
      .eq("workspace_id", ws).eq("status", "approved").order("created_at"),
    sb.from("events").select("payload").eq("event_type", "activity.day").eq("payload->>date", today())
      .order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);
  const day = (act?.payload ?? null) as Activity | null;
  const toSend = (ready ?? []) as unknown as Ready[];

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
                {c.body && (c.kind === "approve_draft"
                  ? <p className="mt-2 whitespace-pre-wrap rounded-md border border-line bg-panel-2 p-3 text-sm">{c.body}</p>
                  : <p className="mt-1 whitespace-pre-wrap text-sm text-muted">{c.body}</p>)}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <form action={decideCard}>
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="decision" value="approved" />
                    <Submit className="btn btn-teal" pendingText={c.kind === "approve_draft" ? "Approving…" : "Drafting…"}>
                      {c.kind === "approve_draft" ? "Approve" : "Yes"}
                    </Submit>
                  </form>
                  <form action={decideCard}>
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="decision" value="rejected" />
                    <Submit className="btn btn-coral">{c.kind === "approve_draft" ? "Kill" : "No"}</Submit>
                  </form>
                  <form action={decideCard} className="flex min-w-60 flex-1 gap-2">
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="decision" value="changes_requested" />
                    <input name="note" className="input py-1.5" placeholder={c.kind === "approve_draft" ? "Make it shorter, mention…" : "Change it to…"} />
                    <Submit pendingText="Revising…">Send back</Submit>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {toSend.length > 0 && (
        <section>
          <h2 className="h-section">Ready to send</h2>
          <ul className="space-y-3">
            {toSend.map((d) => {
              const who = d.lead?.company || d.lead?.name || (d.lead?.author_handle ? `u/${d.lead.author_handle}` : "lead");
              const href = d.channel === "email" && d.recipient
                ? `mailto:${d.recipient}?subject=${encodeURIComponent(d.subject ?? "")}&body=${encodeURIComponent(d.body)}`
                : d.lead?.url ?? null;
              return (
                <li key={d.id} className="card">
                  <div className="mb-2 text-sm font-medium">
                    {d.channel === "email" ? `Email to ${who}` : `DM to ${who}`}
                    {d.subject && <span className="text-muted"> · {d.subject}</span>}
                  </div>
                  <p className="whitespace-pre-wrap rounded-md border border-line bg-panel-2 p-3 text-sm">{d.body}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <CopyButton text={d.body} />
                    {href && <a className="btn" href={href} target="_blank" rel="noreferrer">{d.channel === "email" ? "Open in email" : "Open post ↗"}</a>}
                    <form action={markSent}>
                      <input type="hidden" name="draft_id" value={d.id} />
                      <Submit className="btn btn-teal">Mark sent</Submit>
                    </form>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {day && (
        <section>
          <h2 className="h-section">Your day · {hm(day.active_seconds)} active</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <Usage title="Apps" rows={day.apps} />
            <Usage title="Sites" rows={day.sites} />
          </div>
        </section>
      )}

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

function hm(sec: number) {
  const h = Math.floor(sec / 3600), m = Math.round((sec % 3600) / 60);
  return h ? `${h}h ${m}m` : `${m}m`;
}

function Usage({ title, rows }: { title: string; rows: { name: string; seconds: number }[] }) {
  const top = rows.slice(0, 6);
  const max = top[0]?.seconds ?? 1;
  return (
    <div className="card">
      <div className="mb-2 text-xs text-muted">{title}</div>
      {top.length === 0 && <p className="text-sm text-muted">Nothing yet.</p>}
      <ul className="space-y-1.5">
        {top.map((r) => (
          <li key={r.name} className="text-sm">
            <div className="flex justify-between gap-2"><span className="truncate">{r.name}</span><span className="text-muted">{hm(r.seconds)}</span></div>
            <div className="mt-0.5 h-1 rounded bg-panel-2"><div className="h-1 rounded bg-teal" style={{ width: `${(r.seconds / max) * 100}%` }} /></div>
          </li>
        ))}
      </ul>
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
