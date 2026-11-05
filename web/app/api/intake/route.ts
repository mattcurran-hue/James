import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { processIntake } from "@/lib/agents/intake";

export const maxDuration = 60;

// Any contact form can POST here (JSON, form-encoded, or multipart).
// Auth: the INTAKE_SECRET in an `x-intake-secret` header or a `key` query param
// (many form builders can only set a URL).
function authorized(req: NextRequest) {
  const want = process.env.INTAKE_SECRET;
  const got = req.headers.get("x-intake-secret") ?? req.nextUrl.searchParams.get("key");
  if (!want || !got || got.length !== want.length) return false;
  return timingSafeEqual(Buffer.from(got), Buffer.from(want));
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ ok: false }, { status: 401 });
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
