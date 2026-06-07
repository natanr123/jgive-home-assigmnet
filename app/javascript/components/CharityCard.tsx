import type { CharityOrganization } from "../lib/types";
import { he } from "../locales/he";
import styles from "./CharityCard.module.css";

export default function CharityCard({ org }: { org: CharityOrganization }) {
  return (
    <aside className={styles.card}>
      <h4 className={styles.heading}>{he.contactHeading}</h4>
      <dl className={styles.list}>
        {org.email && (
          <div className={styles.row}>
            <dt>{he.email}</dt>
            <dd>{org.email}</dd>
          </div>
        )}
        {org.phoneNumber && (
          <div className={styles.row}>
            <dt>{he.phone}</dt>
            <dd>{org.phoneNumber}</dd>
          </div>
        )}
        {org.websiteUrl && (
          <div className={styles.row}>
            <dt>{he.website}</dt>
            <dd>
              <a href={org.websiteUrl} target="_blank" rel="noopener noreferrer">
                {org.websiteUrl}
              </a>
            </dd>
          </div>
        )}
        {org.charityNumber && (
          <div className={styles.row}>
            <dt>{he.charityNumber}</dt>
            <dd>{org.charityNumber}</dd>
          </div>
        )}
      </dl>

      <div className={styles.note}>
        <strong>{he.didYouKnow}</strong>
        <p>{he.didYouKnowText}</p>
      </div>
    </aside>
  );
}
