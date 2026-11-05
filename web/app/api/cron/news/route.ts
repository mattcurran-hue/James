import { NextResponse, type NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { runChud } from "@/lib/agents/chud";

export const maxDuration = 300;

// Vercel Cron calls this daily with `Authorization: Bearer $CRON_SECRET`.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  try {
    const result = await runChud(supabaseAdmin(), 1);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error("chud failed", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
