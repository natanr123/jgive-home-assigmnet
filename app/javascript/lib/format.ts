// Locale + currency aware formatting. Campaign money is stored in ILS cents; to display
// in another currency we apply a STATIC, approximate demo FX rate (there is no live rate
// feed in scope — see docs/I18N.md). Formatters are cached per (locale, currency).
export type Loc = "he" | "en";
export type Ccy = "ILS" | "USD" | "GBP" | "CAD";

const LOCALE_TAG: Record<Loc, string> = { he: "he-IL", en: "en-US" };

// Approximate static conversion factors FROM ILS (demo only; a real app uses a rate feed).
const FROM_ILS: Record<Ccy, number> = { ILS: 1, USD: 0.27, GBP: 0.21, CAD: 0.37 };

const moneyFmt = new Map<string, Intl.NumberFormat>();
export function formatMoney(ilsCents: number, locale: Loc, currency: Ccy): string {
  const key = `${locale}:${currency}`;
  let f = moneyFmt.get(key);
  if (!f) {
    f = new Intl.NumberFormat(LOCALE_TAG[locale], {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    });
    moneyFmt.set(key, f);
  }
  return f.format((ilsCents / 100) * FROM_ILS[currency]);
}

export function formatNumber(n: number, locale: Loc): string {
  return n.toLocaleString(LOCALE_TAG[locale]);
}

const rtfCache = new Map<Loc, Intl.RelativeTimeFormat>();
const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 31_536_000_000],
  ["month", 2_592_000_000],
  ["week", 604_800_000],
  ["day", 86_400_000],
  ["hour", 3_600_000],
  ["minute", 60_000],
];

// Exact relative time ("לפני שעתיים" / "2 hours ago"), localized.
export function relativeTime(iso: string, locale: Loc): string {
  let rtf = rtfCache.get(locale);
  if (!rtf) {
    rtf = new Intl.RelativeTimeFormat(LOCALE_TAG[locale], { numeric: "auto" });
    rtfCache.set(locale, rtf);
  }
  const diffMs = Date.now() - new Date(iso).getTime();
  for (const [unit, ms] of UNITS) {
    if (Math.abs(diffMs) >= ms) return rtf.format(-Math.round(diffMs / ms), unit);
  }
  return rtf.format(0, "second");
}
