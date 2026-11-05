"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const path = usePathname();
  const active = href === "/" ? path === "/" : path.startsWith(href);
  return (
    <Link href={href}
      className={`rounded-md px-3 py-1.5 text-sm ${active ? "bg-panel-2 text-ink" : "text-muted hover:text-ink"}`}>
      {children}
    </Link>
  );
}
