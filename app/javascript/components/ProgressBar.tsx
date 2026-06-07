import type { Stats } from "../lib/types";
import { formatILS } from "../lib/format";
import { he } from "../locales/he";
import styles from "./ProgressBar.module.css";

export default function ProgressBar({ stats }: { stats: Stats }) {
  const pct = Math.min(stats.percent, 100);
  return (
    <section className={styles.wrap} aria-label="התקדמות הקמפיין">
      <div className={styles.topRow}>
        <span className={styles.raised}>{formatILS(stats.raisedCents)}</span>
        <span className={styles.percent}>
          <strong>{stats.percent}%</strong> {he.raisedSuffix}
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
          {he.donorsCount}: <strong>{stats.donorsCount.toLocaleString("he-IL")}</strong>
        </span>
        <span>
          {he.goal}: <strong>{formatILS(stats.goalAmountCents)}</strong>
        </span>
      </div>
    </section>
  );
}
