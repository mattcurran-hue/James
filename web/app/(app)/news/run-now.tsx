"use client";
import { useActionState } from "react";
import { runNewsNow } from "@/app/actions";

export function RunNow() {
  const [state, action, pending] = useActionState(runNewsNow, null);
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <select name="days" className="input w-auto py-1.5" defaultValue="7">
        <option value="1">Last 24 hours</option>
        <option value="7">Last 7 days</option>
        <option value="30">Last 30 days</option>
      </select>
      <button className="btn btn-teal" disabled={pending}>{pending ? "Chud is reading the news… (1–3 min)" : "Run Chud now"}</button>
      {state?.msg && <span className="text-sm text-muted">{state.msg}</span>}
    </form>
  );
}
