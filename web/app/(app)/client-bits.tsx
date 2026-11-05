"use client";
import { useState } from "react";
import { useFormStatus } from "react-dom";

export function Submit({ children, pendingText, className = "btn" }: { children: React.ReactNode; pendingText?: string; className?: string }) {
  const { pending } = useFormStatus();
  return <button className={className} disabled={pending}>{pending ? (pendingText ?? "…") : children}</button>;
}

export function CopyButton({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button type="button" className="btn" onClick={async () => {
      try { await navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1500); } catch {}
    }}>{done ? "Copied ✓" : "Copy"}</button>
  );
}
