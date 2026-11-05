import { timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";

// Shared-secret check for machine endpoints: `x-intake-secret` header or `key` query param.
export function hasSecret(req: NextRequest) {
  const want = process.env.INTAKE_SECRET;
  const got = req.headers.get("x-intake-secret") ?? req.nextUrl.searchParams.get("key");
  if (!want || !got || got.length !== want.length) return false;
  return timingSafeEqual(Buffer.from(got), Buffer.from(want));
}
