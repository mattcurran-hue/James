"use server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";

export async function setWorkspace(slug: string) {
  (await cookies()).set("ws", slug, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  revalidatePath("/", "layout");
}

// Matt's answer to anything James asks. The card records the decision, the event log feeds
// learning, and some cards trigger the next step (drafting, revising, killing).
type CardAction = { type?: string; lead_id?: string; draft_id?: string } | null;

export async function decideCard(formData: FormData) {
  const id = String(formData.get("id"));
  const decision = String(formData.get("decision")) as "approved" | "rejected" | "changes_requested";
  const note = (formData.get("note") as string | null)?.trim() || null;
  if (decision === "changes_requested" && !note) return;
  const sb = await supabaseServer();
  const { data: card } = await sb.from("cards")
    .update({ status: decision, decision_note: note, decided_at: new Date().toISOString() })
    .eq("id", id).eq("status", "pending").select("id, workspace_id, kind, entity_type, entity_id, proposed_action").single();
  if (!card) return revalidatePath("/");

  await sb.from("events").insert({
    workspace_id: card.workspace_id, actor: "matt", entity_type: "card", entity_id: card.id,
    event_type: `card.${decision}`, payload: { kind: card.kind, note },
  });

  const act = card.proposed_action as CardAction;
  const { draftReply } = await import("@/lib/agents/drafter");
  try {
    if (act?.type === "draft_first_reply" && act.lead_id) {
      if (decision === "rejected") {
        await sb.from("feedback").insert({ workspace_id: card.workspace_id, entity_type: "lead", entity_id: act.lead_id, rating: "down", reason: note });
        await sb.from("leads").update({ status: "archived" }).eq("id", act.lead_id);
      } else {
        await sb.from("feedback").insert({ workspace_id: card.workspace_id, entity_type: "lead", entity_id: act.lead_id, rating: "up", reason: note });
        await draftReply(sb, act.lead_id, { guidance: note });
      }
    }
    if (act?.type === "approve_draft" && act.draft_id && act.lead_id) {
      const { data: draft } = await sb.from("drafts").select("id, version, body").eq("id", act.draft_id).single();
      if (decision === "approved") {
        await sb.from("drafts").update({ status: "approved" }).eq("id", act.draft_id);
      } else if (decision === "changes_requested" && draft) {
        await sb.from("drafts").update({ status: "changes_requested" }).eq("id", act.draft_id);
        await draftReply(sb, act.lead_id, { guidance: note, previous: draft });
      } else {
        await sb.from("drafts").update({ status: "killed" }).eq("id", act.draft_id);
        await sb.from("feedback").insert({ workspace_id: card.workspace_id, entity_type: "draft", entity_id: act.draft_id, rating: "down", reason: note });
      }
    }
  } catch (e) {
    // Put the card back so Matt can retry instead of losing it.
    await sb.from("cards").update({ status: "pending", decided_at: null }).eq("id", card.id);
    console.error("card follow-up failed", e);
  }
  revalidatePath("/");
}

// Matt sent an approved draft himself: log it and move the lead to Contacted.
export async function markSent(formData: FormData) {
  const id = String(formData.get("draft_id"));
  const sb = await supabaseServer();
  const { data: d } = await sb.from("drafts").update({ status: "sent", sent_at: new Date().toISOString() })
    .eq("id", id).eq("status", "approved").select("workspace_id, lead_id").single();
  if (d?.lead_id) {
    await sb.from("leads").update({ stage_key: "contacted", stage_changed_at: new Date().toISOString() }).eq("id", d.lead_id);
    await sb.from("events").insert({ workspace_id: d.workspace_id, actor: "matt", entity_type: "lead", entity_id: d.lead_id, event_type: "lead.contacted", payload: { draft_id: id } });
  }
  revalidatePath("/");
}

export async function toggleChecklist(formData: FormData) {
  const id = String(formData.get("id"));
  const done = formData.get("done") === "true";
  const sb = await supabaseServer();
  await sb.from("checklist_items").update({ done, done_at: done ? new Date().toISOString() : null }).eq("id", id);
  revalidatePath("/");
}

export async function addChecklist(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const ws = (formData.get("workspace_id") as string) || null;
  if (!title) return;
  const sb = await supabaseServer();
  await sb.from("checklist_items").insert({ title, workspace_id: ws, created_by: "matt" });
  revalidatePath("/");
}

export async function signOut() {
  const sb = await supabaseServer();
  await sb.auth.signOut();
  redirect("/login");
}

// Signed-in test path for the Intake Clerk: same pipeline as the website webhook.
export async function testIntake(_prev: { msg: string } | null, formData: FormData) {
  const sb = await supabaseServer();
  const { data: aal } = await sb.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.currentLevel !== "aal2") return { msg: "Not signed in." };
  const fields = Object.fromEntries([...formData.entries()].filter(([k]) => !k.startsWith("$")));
  try {
    const { processIntake } = await import("@/lib/agents/intake");
    const r = await processIntake(fields, "test");
    revalidatePath("/", "layout");
    if (!r.ok) return { msg: `Skipped: ${r.reason}` };
    if ("duplicate" in r) return { msg: "Duplicate. Change something and resend." };
    return { msg: `Scored ${r.score}/10 → ${r.status === "promoted" ? "your queue" : r.status}. Check Today.` };
  } catch (e) {
    return { msg: `Failed: ${e instanceof Error ? e.message : String(e)}` };
  }
}
