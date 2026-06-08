import type { Donation } from "../lib/types";
import { formatILS, relativeTime } from "../lib/format";
import { he } from "../locales/he";
import styles from "./DonationCard.module.css";

export default function DonationCard({ donation }: { donation: Donation }) {
  return (
    <li className={styles.card}>
      <div className={styles.top}>
        <span className={styles.amount}>{formatILS(donation.amountCents)}</span>
        {donation.pending && <span className={styles.pending}>{he.pendingBadge}</span>}
        {donation.recurring && (
          <span className={styles.recurring}>
            {he.recurringLabel}
            {donation.recurringMonths ? ` · ${donation.recurringMonths} ${he.monthsUnit}` : ""}
          </span>
        )}
      </div>
      <div className={styles.name}>{donation.displayName ?? he.anonymous}</div>
      <div className={styles.time}>{relativeTime(donation.createdAt)}</div>
      {donation.comment && <p className={styles.comment}>{donation.comment}</p>}
    </li>
  );
}
