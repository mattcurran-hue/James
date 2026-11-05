import { NextResponse, type NextRequest } from "next/server";
import { processIntake } from "@/lib/agents/intake";
import { hasSecret } from "@/lib/auth-secret";

export const maxDuration = 60;

// Any contact form can POST here (JSON, form-encoded, or multipart), authed with INTAKE_SECRET.
export async function POST(req: NextRequest) {
  if (!hasSecret(req)) return NextResponse.json({ ok: false }, { status: 401 });
  const type = req.headers.get("content-type") ?? "";
  let fields: Record<string, unknown>;
  try {
    if (type.includes("application/json")) fields = await req.json();
    else fields = Object.fromEntries((await req.formData()).entries());
  } catch {
    return NextResponse.json({ ok: false, reason: "unreadable body" }, { status: 400 });
  }
  try {
    const result = await processIntake(fields, "web_form");
    return NextResponse.json(result);
  } catch (e) {
    console.error("intake failed", e);
    return NextResponse.json({ ok: false, reason: "processing failed" }, { status: 500 });
  }
}
