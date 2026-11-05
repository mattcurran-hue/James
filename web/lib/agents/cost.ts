import type Anthropic from "@anthropic-ai/sdk";

// Approximate API cost in USD. Prices per million tokens (Nov 2026); cache writes bill at
// 1.25x input and cache reads at 0.1x input; web search is $10 per 1,000 searches.
const PRICES: Record<string, { in: number; out: number; inLong?: number; outLong?: number; longOver?: number }> = {
  "claude-sonnet-5-5": { in: 2, out: 10 },
  "claude-haiku-5-5": { in: 0.1, out: 0.5, inLong: 0.5, outLong: 2.5, longOver: 100_000 },
};

export function costOf(model: string, u: Anthropic.Usage) {
  const p = PRICES[model];
  if (!p) return 0;
  const write = u.cache_creation_input_tokens ?? 0;
  const read = u.cache_read_input_tokens ?? 0;
  const prompt = u.input_tokens + write + read;
  const long = p.longOver != null && prompt > p.longOver;
  const inRate = long ? p.inLong! : p.in;
  const outRate = long ? p.outLong! : p.out;
  const tokens = (u.input_tokens * inRate + write * inRate * 1.25 + read * inRate * 0.1 + u.output_tokens * outRate) / 1e6;
  const searches = (u.server_tool_use?.web_search_requests ?? 0) * 0.01;
  return tokens + searches;
}
