import { NextResponse, type NextRequest } from "next/server";
import { hasSecret } from "@/lib/auth-secret";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { processAlertEmails } from "@/lib/agents/paperboy";

export const maxDuration = 300;

// Gmail → James. The Apps Script in integrations/ posts batches of emails here.
// kind "f5bot": Reddit keyword alerts for the Paperboy. Other kinds come later (Inbox Clerk).
type Body = { kind?: string; messages?: { id?: string; from?: string; subject?: string; date?: string; body?: string }[] };

export async function POST(req: NextRequest) {
  if (!hasSecret(req)) return NextResponse.json({ ok: false }, { status: 401 });
  let body: Body;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, reason: "bad json" }, { status: 400 }); }
  const emails = (body.messages ?? []).filter((m) => m.body?.trim()).map((m) => ({ subject: m.subject, body: m.body! }));
  if (emails.length === 0) return NextResponse.json({ ok: true, skipped: "no messages" });

  if (body.kind === "f5bot") {
    try {
      const result = await processAlertEmails(supabaseAdmin(), emails);
      return NextResponse.json({ ok: true, ...result });
    } catch (e) {
      console.error("paperboy failed", e);
      return NextResponse.json({ ok: false, reason: "processing failed" }, { status: 500 });
    }
  }
  return NextResponse.json({ ok: false, reason: `unknown kind: ${body.kind}` }, { status: 400 });
}
