import type { Campaign } from "../lib/types";
import CharityCard from "./CharityCard";
import styles from "./AboutTab.module.css";

export default function AboutTab({ campaign }: { campaign: Campaign }) {
  return (
    <div className={styles.layout}>
      <article
        className={styles.story}
        // storyHtml is sanitized server-side (HtmlSanitizer) before it reaches us.
        dangerouslySetInnerHTML={{ __html: campaign.storyHtml ?? "" }}
      />
      <CharityCard org={campaign.charityOrganization} />
    </div>
  );
}
