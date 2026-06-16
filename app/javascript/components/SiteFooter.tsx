import styles from "./SiteFooter.module.css";
import { i18n, useT, useLocale } from "../lib/i18n";

// Site footer reproducing JGive's. Links are presentational (the focus is the
// campaign page); kept as inert items so the chrome reads complete.
export default function SiteFooter() {
  const t = useT();
  const { locale } = useLocale();
  const list = (k: string) => i18n.t(`frontend.${k}`, { locale }) as unknown as string[];
  const COLUMNS = ["about", "join", "products", "useful"].map((k) => ({
    title: t(`footer.columns.${k}.title`),
    items: list(`footer.columns.${k}.items`),
  }));
  const LEGAL = list("footer.legal");
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <span className={styles.logo}>Jgive</span>
          <p className={styles.copy}>{t("footer.copy")}</p>
        </div>

        <div className={styles.columns}>
          {COLUMNS.map((col) => (
            <div key={col.title} className={styles.column}>
              <h4 className={styles.colTitle}>{col.title}</h4>
              {col.items.map((item) => (
                <span key={item} className={styles.link}>{item}</span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className={styles.legal}>
        {LEGAL.map((l) => (
          <span key={l} className={styles.legalItem}>{l}</span>
        ))}
      </div>
    </footer>
  );
}
