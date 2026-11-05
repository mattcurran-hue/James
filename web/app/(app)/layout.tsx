import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { loadWorkspaces } from "@/lib/workspace";
import { signOut } from "@/app/actions";
import { WorkspaceSwitcher } from "./workspace-switcher";
import { NavLink } from "./nav-link";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login");
  const { data: aal } = await sb.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.currentLevel !== "aal2") redirect("/mfa");

  const { list, current } = await loadWorkspaces(sb);

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-10 border-b border-line bg-bg/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
          <span className="mr-2 text-lg font-semibold tracking-tight">James</span>
          <nav className="flex flex-wrap gap-1">
            <NavLink href="/">Today</NavLink>
            <NavLink href="/leads">Leads</NavLink>
            <NavLink href="/agents">Agents</NavLink>
            <NavLink href="/lenders">Lenders</NavLink>
            <NavLink href="/news">News</NavLink>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            {list.length > 0 && <WorkspaceSwitcher list={list} current={current?.slug ?? null} />}
            <form action={signOut}><button className="btn whitespace-nowrap">Sign out</button></form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        {list.length === 0 ? (
          <div className="card text-sm text-muted">
            You&apos;re signed in, but not a member of any town yet. Run the membership snippet in the Supabase SQL Editor, then refresh.
          </div>
        ) : children}
      </main>
    </div>
  );
}
