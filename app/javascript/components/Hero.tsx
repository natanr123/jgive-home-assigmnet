import type { Campaign } from "../lib/types";
import styles from "./Hero.module.css";

// Full-bleed hero. When the campaign has a cover banner (which carries its own
// title art, like JGive's), show it edge-to-edge with no overlay. Otherwise fall
// back to a branded gradient with the campaign name.
export default function Hero({ campaign }: { campaign: Campaign }) {
  if (campaign.coverImageUrl) {
    return (
      <img className={styles.heroImg} src={campaign.coverImageUrl} alt={campaign.name} />
    );
  }

  return (
    <div className={`${styles.hero} ${styles.fallback}`} role="img" aria-label={campaign.name}>
      <div className={styles.overlay}>
        <h1 className={styles.title}>{campaign.name}</h1>
      </div>
    </div>
  );
}
