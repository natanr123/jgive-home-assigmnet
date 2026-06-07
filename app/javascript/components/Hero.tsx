import type { Campaign } from "../lib/types";
import styles from "./Hero.module.css";

export default function Hero({ campaign }: { campaign: Campaign }) {
  const hasImage = Boolean(campaign.coverImageUrl);
  return (
    <div
      className={hasImage ? styles.hero : `${styles.hero} ${styles.fallback}`}
      style={hasImage ? { backgroundImage: `url(${campaign.coverImageUrl})` } : undefined}
      role="img"
      aria-label={campaign.name}
    >
      <div className={styles.overlay}>
        <h1 className={styles.title}>{campaign.name}</h1>
      </div>
    </div>
  );
}
