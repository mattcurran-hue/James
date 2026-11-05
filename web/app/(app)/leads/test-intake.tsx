"use client";
import { useActionState } from "react";
import { testIntake } from "@/app/actions";

const SAMPLE = `Hi, I own a 3-location pizza place in Newark NJ, open 4 years. We do about $85K a month in card sales. Looking for $60K to remodel our second kitchen. Already have one advance with about 40% left. Can someone call me this week?`;

export function TestIntake() {
  const [state, action, pending] = useActionState(testIntake, null);
  return (
    <details className="card">
      <summary className="cursor-pointer text-sm font-medium">Send a test lead through the Intake Clerk</summary>
      <form action={action} className="mt-3 grid gap-2 sm:grid-cols-2">
        <input name="name" className="input" placeholder="Name" defaultValue="Tony Russo" />
        <input name="business" className="input" placeholder="Business" defaultValue="Russo's Pizza" />
        <input name="email" className="input" placeholder="Email" defaultValue="tony@example.com" />
        <input name="phone" className="input" placeholder="Phone" defaultValue="(973) 555-0142" />
        <textarea name="message" className="input sm:col-span-2" rows={4} defaultValue={SAMPLE} />
        <div className="flex items-center gap-3 sm:col-span-2">
          <button className="btn btn-teal" disabled={pending}>{pending ? "Bank Manager reviewing…" : "Send test"}</button>
          {state?.msg && <span className="text-sm text-muted">{state.msg}</span>}
        </div>
      </form>
    </details>
  );
}
