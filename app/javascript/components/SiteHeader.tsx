import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import {
  useLocale,
  useT,
  LOCALES,
  CURRENCIES,
  LOCALE_LABEL,
  CURRENCY_SYMBOL,
} from "../lib/i18n";
import type { Loc, Ccy } from "../lib/format";
import styles from "./SiteHeader.module.css";

// Site chrome reproducing JGive's top nav. The language/currency switcher is functional —
// it rewrites the /:locale/:currency URL prefix (which drives the whole UI); the rest are
// presentational, matching the original layout.
export default function SiteHeader({ donateTo }: { donateTo: string }) {
  const t = useT();
  const { locale, currency } = useLocale();
  const navigate = useNavigate();
  const loc = useLocation();

  const [open, setOpen] = useState(false);
  const [pendingLocale, setPendingLocale] = useState<Loc>(locale);
  const [pendingCurrency, setPendingCurrency] = useState<Ccy>(currency);

  // Page path after the /:locale/:currency prefix, so switching preserves the current page.
  const rest = loc.pathname.replace(/^\/[^/]+\/[^/]+/, "") || "/campaigns/1";

  function toggle() {
    if (open) {
      setOpen(false);
    } else {
      setPendingLocale(locale);
      setPendingCurrency(currency);
      setOpen(true);
    }
  }

  function apply() {
    setOpen(false);
    navigate(`/${pendingLocale}/${pendingCurrency.toLowerCase()}${rest}${loc.search}`);
  }

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.right}>
          <span className={styles.logo}>Jgive</span>
        </div>

        <div className={styles.left}>
          <div className={styles.switcherWrap}>
            <button
              type="button"
              className={styles.switcher}
              onClick={toggle}
              aria-haspopup="dialog"
              aria-expanded={open}
            >
              <span className={styles.globe} aria-hidden="true">🌐</span>
              {locale.toUpperCase()} | {currency}
              <span className={styles.caret}>▾</span>
            </button>

            {open && (
              <>
                <div className={styles.backdrop} onClick={() => setOpen(false)} />
                <div className={styles.popover} role="dialog" aria-label={t("switcher.taxHeading")}>
                  <ul className={styles.langList}>
                    {LOCALES.map((l) => (
                      <li key={l}>
                        <button
                          type="button"
                          className={styles.langRow}
                          onClick={() => setPendingLocale(l)}
                        >
                          <span className={styles.check} aria-hidden="true">
                            {pendingLocale === l ? "✓" : ""}
                          </span>
                          <span>{LOCALE_LABEL[l]}</span>
                        </button>
                      </li>
                    ))}
                  </ul>

                  <p className={styles.taxHeading}>{t("switcher.taxHeading")}</p>

                  <div className={styles.ccyRow}>
                    {CURRENCIES.map((c) => (
                      <button
                        key={c}
                        type="button"
                        className={styles.ccy}
                        onClick={() => setPendingCurrency(c)}
                        aria-pressed={pendingCurrency === c}
                      >
                        <span
                          className={`${styles.ccyCircle} ${pendingCurrency === c ? styles.ccyActive : ""}`}
                        >
                          {CURRENCY_SYMBOL[c]}
                        </span>
                        <span className={styles.ccyLabel}>({c})</span>
                      </button>
                    ))}
                  </div>

                  <button type="button" className={styles.done} onClick={apply}>
                    {t("switcher.done")}
                  </button>
                </div>
              </>
            )}
          </div>

          <button type="button" className={styles.textItem} disabled>{t("support")}</button>
          <button type="button" className={styles.iconBtn} disabled aria-label={t("search")}>🔍</button>
          <Link to={donateTo} className={styles.donate}>{t("donate")}</Link>
        </div>
      </div>
    </header>
  );
}
