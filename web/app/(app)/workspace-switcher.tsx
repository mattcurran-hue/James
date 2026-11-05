"use client";
import { useTransition } from "react";
import { setWorkspace } from "@/app/actions";
import type { Workspace } from "@/lib/workspace";

export function WorkspaceSwitcher({ list, current }: { list: Workspace[]; current: string | null }) {
  const [pending, start] = useTransition();
  return (
    <select
      aria-label="Town"
      className="input w-auto py-1.5 pr-8"
      value={current ?? ""}
      disabled={pending}
      onChange={(e) => start(() => setWorkspace(e.target.value))}
    >
      {list.map((w) => (
        <option key={w.slug} value={w.slug}>{w.town_name ? `${w.town_name} · ${w.name}` : w.name}</option>
      ))}
    </select>
  );
}
