export function fmtDistance(v: number | null): string {
  if (v == null) return "—";
  return Math.round(v).toLocaleString("en-US");
}

export function fmtTokens(v: number | null): string {
  if (v == null) return "—";
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + "M";
  if (v >= 1_000) return Math.round(v / 1_000) + "K";
  return String(v);
}

export function fmtTemp(v: number | null): string {
  if (v == null) return "—";
  return (v >= 0 ? "+" : "") + Math.round(v) + "°";
}

export function fmtWildlife(v: number | null): string {
  if (v == null) return "—";
  return v.toLocaleString("en-US");
}

export function fmtDay(v: number | null): string {
  if (v == null) return "—";
  return "Day " + v;
}
