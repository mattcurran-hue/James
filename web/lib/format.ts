export function ago(iso: string | null | undefined) {
  if (!iso) return "never";
  const s = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.round(s / 60); if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60); if (h < 48) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}
export const money = (n: number | null | undefined) =>
  n == null ? "—" : n >= 1e6 ? `$${(n / 1e6).toFixed(n % 1e6 ? 1 : 0)}M` : `$${Math.round(n / 1000)}K`;
export const today = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
export const hoursAgoIso = (h: number) => new Date(Date.now() - h * 3600e3).toISOString();
