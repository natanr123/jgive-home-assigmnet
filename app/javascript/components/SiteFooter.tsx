import styles from "./SiteFooter.module.css";

// Site footer reproducing JGive's. Links are presentational (the focus is the
// campaign page); kept as inert items so the chrome reads complete.
const COLUMNS: { title: string; items: string[] }[] = [
  { title: "אודות", items: ["הסיפור שלנו", "הדירקטוריון החברתי", "ועדת ההשקעות", "מחקר ודאטה", "אבטחת מידע"] },
  { title: "הצטרפו אלינו", items: ["תורמים", "עמותות", "חברות", "קריירה"] },
  { title: "מוצרים", items: ["Jgive Platinum", "Jgive PRO", "Jgive Business", "GiveCard", "תרומת מניות"] },
  { title: "שימושי", items: ["תמיכה", "צור קשר", "עמלות", "לתרומה"] },
];

const LEGAL = ["הגדרות קוקיז", "תנאי שימוש", "תנאי שימוש לעמותות", "מדיניות פרטיות", "הצהרת נגישות"];

export default function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <span className={styles.logo}>Jgive</span>
          <p className={styles.copy}>זכויות יוצרים, קרן עשור (ע"ר) 2026</p>
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
