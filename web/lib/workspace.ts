import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";

export type Workspace = { id: string; slug: string; name: string; town_name: string | null };

export async function loadWorkspaces(sb: SupabaseClient) {
  const { data } = await sb.from("workspaces").select("id, slug, name, town_name").order("created_at");
  const list = (data ?? []) as Workspace[];
  const want = (await cookies()).get("ws")?.value;
  const current = list.find((w) => w.slug === want) ?? list[0] ?? null;
  return { list, current };
}
