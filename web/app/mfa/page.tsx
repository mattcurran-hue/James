"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

// Every session must reach AAL2: enroll an authenticator app the first time, verify after that.
export default function Mfa() {
  const router = useRouter();
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const sb = supabaseBrowser();
      const { data: aal } = await sb.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aal?.currentLevel === "aal2") return router.replace("/");
      const { data } = await sb.auth.mfa.listFactors();
      const verified = data?.totp?.[0];
      if (verified) return setFactorId(verified.id);
      // Clear half-finished enrollments, then start a fresh one.
      for (const f of data?.all ?? []) if (f.status !== "verified") await sb.auth.mfa.unenroll({ factorId: f.id });
      const { data: en, error } = await sb.auth.mfa.enroll({ factorType: "totp", friendlyName: "James" });
      if (error) return setError(error.message);
      setFactorId(en.id); setQr(en.totp.qr_code); setSecret(en.totp.secret);
    })();
  }, [router]);

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    if (!factorId) return;
    setBusy(true); setError(null);
    const { error } = await supabaseBrowser().auth.mfa.challengeAndVerify({ factorId, code: code.trim() });
    setBusy(false);
    if (error) return setError(error.message);
    router.replace("/"); router.refresh();
  }

  return (
    <main className="min-h-dvh grid place-items-center px-4">
      <form onSubmit={verify} className="card w-full max-w-sm space-y-4">
        <div>
          <h1 className="text-xl font-semibold">Two-factor check</h1>
          <p className="text-sm text-muted">
            {qr ? "Scan this with your authenticator app (Google Authenticator, 1Password, Authy), then enter the 6-digit code."
                : "Enter the 6-digit code from your authenticator app."}
          </p>
        </div>
        {qr && (
          <div className="space-y-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr} alt="Authenticator QR code" className="mx-auto size-44 rounded bg-white p-2" />
            {secret && <p className="text-center font-mono text-[11px] text-muted break-all">{secret}</p>}
          </div>
        )}
        <input className="input text-center font-mono tracking-[0.4em]" inputMode="numeric" maxLength={6}
          placeholder="000000" value={code} onChange={(e) => setCode(e.target.value)} required />
        {error && <p className="text-sm text-coral">{error}</p>}
        <button className="btn btn-teal w-full justify-center" disabled={busy || !factorId}>
          {busy ? "Checking…" : "Verify"}
        </button>
      </form>
    </main>
  );
}
