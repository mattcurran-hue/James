"use server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";

export async function setWorkspace(slug: string) {
  (await cookies()).set("ws", slug, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  revalidatePath("/", "layout");
}

// Matt's answer to anything James asks. The card records the decision; the event log feeds learning.
export async function decideCard(formData: FormData) {
  const id = String(formData.get("id"));
  const decision = String(formData.get("decision")) as "approved" | "rejected" | "changes_requested";
  const note = (formData.get("note") as string | null)?.trim() || null;
  if (decision === "changes_requested" && !note) return;
  const sb = await supabaseServer();
  const { data: card } = await sb.from("cards")
    .update({ status: decision, decision_note: note, decided_at: new Date().toISOString() })
    .eq("id", id).eq("status", "pending").select("id, workspace_id, kind").single();
  if (card) {
    await sb.from("events").insert({
      workspace_id: card.workspace_id, actor: "matt", entity_type: "card", entity_id: card.id,
      event_type: `card.${decision}`, payload: { kind: card.kind, note },
    });
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
