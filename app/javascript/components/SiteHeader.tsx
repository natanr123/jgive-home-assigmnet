import { Link } from "react-router";
import { he } from "../locales/he";
import styles from "./SiteHeader.module.css";

// Site chrome reproducing JGive's top nav. Only the donate CTA is functional (opens
// the donation modal); the rest are presentational, matching the original layout.
export default function SiteHeader({ donateTo }: { donateTo: string }) {
  const menu = ["פתרונות", "מוצרים", "עלינו"];

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.right}>
          <span className={styles.logo}>Jgive</span>
          <nav className={styles.menu} aria-label="ראשי">
            {menu.map((m) => (
              <button key={m} type="button" className={styles.menuItem} disabled title={he.bitDisabled}>
                {m} <span className={styles.caret}>▾</span>
              </button>
            ))}
          </nav>
        </div>

        <div className={styles.left}>
          <button type="button" className={styles.iconBtn} disabled aria-label="חיפוש" title={he.bitDisabled}>🔍</button>
          <button type="button" className={styles.textItem} disabled title={he.bitDisabled}>תמיכה</button>
          <button type="button" className={styles.textItem} disabled title={he.bitDisabled}>HE | ILS <span className={styles.caret}>▾</span></button>
          <Link to={donateTo} className={styles.donate}>{he.donate}</Link>
          <button type="button" className={styles.login} disabled title={he.bitDisabled}>התחברות</button>
        </div>
      </div>
    </header>
  );
}
