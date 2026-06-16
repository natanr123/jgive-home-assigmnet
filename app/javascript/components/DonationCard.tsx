import type { Donation } from "../lib/types";
import { useT, useFormat } from "../lib/i18n";
import styles from "./DonationCard.module.css";

export default function DonationCard({ donation }: { donation: Donation }) {
  const t = useT();
  const f = useFormat();
  return (
    <li className={styles.card}>
      <div className={styles.top}>
        <span className={styles.amount}>{f.money(donation.amountCents)}</span>
        {donation.pending && <span className={styles.pending}>{t("pendingBadge")}</span>}
        {donation.recurring && (
          <span className={styles.recurring}>
            {t("recurringLabel")}
            {donation.recurringMonths ? ` · ${donation.recurringMonths} ${t("months", { count: donation.recurringMonths })}` : ""}
          </span>
        )}
      </div>
      <div className={styles.name}>{donation.displayName ?? t("anonymous")}</div>
      <div className={styles.time}>{f.rel(donation.createdAt)}</div>
      {donation.comment && <p className={styles.comment}>{donation.comment}</p>}
    </li>
  );
}
