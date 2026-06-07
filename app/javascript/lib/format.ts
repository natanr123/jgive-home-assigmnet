const ILS = new Intl.NumberFormat("he-IL", {
  style: "currency",
  currency: "ILS",
  maximumFractionDigits: 0,
});

export function formatILS(cents: number): string {
  return ILS.format(cents / 100);
}

const RTF = new Intl.RelativeTimeFormat("he", { numeric: "auto" });
const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 31_536_000_000],
  ["month", 2_592_000_000],
  ["week", 604_800_000],
  ["day", 86_400_000],
  ["hour", 3_600_000],
  ["minute", 60_000],
];

// Exact Hebrew relative time ("לפני שעתיים"). The live site uses fuzzy "כ" phrasing;
// exact is an accepted, slightly-cleaner divergence.
export function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  for (const [unit, ms] of UNITS) {
    if (Math.abs(diffMs) >= ms) return RTF.format(-Math.round(diffMs / ms), unit);
  }
  return RTF.format(0, "second");
}
