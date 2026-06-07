import type { Campaign } from "../lib/types";
import CharityCard from "./CharityCard";
import styles from "./AboutTab.module.css";

export default function OrganizationTab({ campaign }: { campaign: Campaign }) {
  const org = campaign.charityOrganization;
  return (
    <div className={styles.layout}>
      <article className={styles.story}>
        <h2>{org.name}</h2>
        <div dangerouslySetInnerHTML={{ __html: org.aboutHtml ?? "" }} />
      </article>
      <CharityCard org={org} />
    </div>
  );
}
