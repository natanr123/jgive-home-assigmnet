import type { Stats } from "../lib/types";
import { useT, useFormat } from "../lib/i18n";
import styles from "./ProgressBar.module.css";

export default function ProgressBar({ stats }: { stats: Stats }) {
  const t = useT();
  const f = useFormat();
  const pct = Math.min(stats.percent, 100);
  return (
    <section className={styles.wrap} aria-label="התקדמות הקמפיין">
      <div className={styles.topRow}>
        <span className={styles.raised}>{f.money(stats.raisedCents)}</span>
        <span className={styles.percent}>
          <strong>{stats.percent}%</strong> {t("raisedSuffix")}
        </span>
      </div>

      <div
        className={styles.track}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className={styles.fill} style={{ width: `${pct}%` }}>
          <span className={styles.heart} aria-hidden="true">🧡</span>
        </div>
      </div>

      <div className={styles.bottomRow}>
        <span>
          {t("donorsCount")}: <strong>{f.num(stats.donorsCount)}</strong>
        </span>
        <span>
          {t("goal")}: <strong>{f.money(stats.goalAmountCents)}</strong>
        </span>
      </div>
    </section>
  );
}
