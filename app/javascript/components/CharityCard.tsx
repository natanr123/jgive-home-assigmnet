import type { CharityOrganization } from "../lib/types";
import { useT } from "../lib/i18n";
import styles from "./CharityCard.module.css";

export default function CharityCard({ org }: { org: CharityOrganization }) {
  const t = useT();
  return (
    <aside className={styles.card}>
      {org.avatarUrl && (
        <img className={styles.avatar} src={org.avatarUrl} alt={org.name} />
      )}
      <h4 className={styles.heading}>{t("contactHeading")}</h4>
      <dl className={styles.list}>
        {org.email && (
          <div className={styles.row}>
            <dt>{t("email")}</dt>
            <dd>{org.email}</dd>
          </div>
        )}
        {org.phoneNumber && (
          <div className={styles.row}>
            <dt>{t("phone")}</dt>
            <dd>{org.phoneNumber}</dd>
          </div>
        )}
        {org.websiteUrl && (
          <div className={styles.row}>
            <dt>{t("website")}</dt>
            <dd>
              <a href={org.websiteUrl} target="_blank" rel="noopener noreferrer">
                {org.websiteUrl}
              </a>
            </dd>
          </div>
        )}
        {org.charityNumber && (
          <div className={styles.row}>
            <dt>{t("charityNumber")}</dt>
            <dd>{org.charityNumber}</dd>
          </div>
        )}
      </dl>

      <div className={styles.note}>
        <strong>{t("didYouKnow")}</strong>
        <p>{t("didYouKnowText")}</p>
      </div>
    </aside>
  );
}
