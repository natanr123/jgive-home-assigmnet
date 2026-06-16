// React i18n runtime. config/locales/*.yml is the source of truth; i18n-js exports the
// `frontend:` namespace to these JSON catalogs (see docs/I18N.md). The active locale +
// currency come from the URL (/:locale/:currency/...) via LocaleProvider, so t() and the
// formatters re-render reactively when the switcher changes the URL.
import { createContext, useContext, useMemo, type ReactNode } from "react";
import { I18n } from "i18n-js";
import he from "../locales/he.json";
import en from "../locales/en.json";
import { formatMoney, formatNumber, relativeTime, type Loc, type Ccy } from "./format";

// he.json is { he: { frontend: {...} } }, en.json is { en: { frontend: {...} } }.
export const i18n = new I18n({ ...he, ...en });
i18n.defaultLocale = "he";
i18n.enableFallback = true; // fall back to :he for any missing key

export const LOCALES: Loc[] = ["he", "en"];
// Order mirrors the reference popover (£ / $C / $ / ₪).
export const CURRENCIES: Ccy[] = ["GBP", "CAD", "USD", "ILS"];

export const LOCALE_LABEL: Record<Loc, string> = { he: "עברית", en: "English" };
export const CURRENCY_SYMBOL: Record<Ccy, string> = { GBP: "£", CAD: "$C", USD: "$", ILS: "₪" };

export function normalizeLocale(raw: string | undefined): Loc {
  return raw === "en" ? "en" : "he";
}
export function normalizeCurrency(raw: string | undefined): Ccy {
  const up = (raw ?? "").toUpperCase();
  return (CURRENCIES as string[]).includes(up) ? (up as Ccy) : "ILS";
}

// Build a /:locale/:currency-prefixed path. `rest` is the page path (e.g. "campaigns/1").
export function localeHref(locale: Loc, currency: Ccy, rest: string): string {
  return `/${locale}/${currency.toLowerCase()}/${rest.replace(/^\/+/, "")}`;
}

type Ctx = { locale: Loc; currency: Ccy };
const LocaleCtx = createContext<Ctx>({ locale: "he", currency: "ILS" });

export function LocaleProvider({ locale, currency, children }: Ctx & { children: ReactNode }) {
  const value = useMemo(() => ({ locale, currency }), [locale, currency]);
  return <LocaleCtx.Provider value={value}>{children}</LocaleCtx.Provider>;
}

export const useLocale = (): Ctx => useContext(LocaleCtx);

export type TFunc = (key: string, opts?: Record<string, unknown>) => string;

// t("tabs.about") -> i18n.t("frontend.tabs.about", { locale }). opts carry count/interpolation.
export function useT(): TFunc {
  const { locale } = useLocale();
  return useMemo<TFunc>(
    () => (key, opts) => i18n.t(`frontend.${key}`, { locale, ...opts }),
    [locale],
  );
}

// Formatters bound to the active locale + currency.
export function useFormat() {
  const { locale, currency } = useLocale();
  return useMemo(
    () => ({
      money: (ilsCents: number) => formatMoney(ilsCents, locale, currency),
      num: (n: number) => formatNumber(n, locale),
      rel: (iso: string) => relativeTime(iso, locale),
    }),
    [locale, currency],
  );
}
