import type { Campaign } from "../lib/types";
import { he } from "../locales/he";
import styles from "./Hero.module.css";

// Full-bleed hero. When the campaign has a cover banner (which carries its own
// title art, like JGive's), show it edge-to-edge with a decorative play button
// (the original's hero is a video; playback is out of scope). Otherwise fall back
// to a branded gradient with the campaign name.
export default function Hero({ campaign }: { campaign: Campaign }) {
  if (campaign.coverImageUrl) {
    return (
      <div className={styles.wrap}>
        <img className={styles.heroImg} src={campaign.coverImageUrl} alt={campaign.name} />
        <button type="button" className={styles.play} disabled title={he.bitDisabled} aria-label="נגן וידאו">
          <span className={styles.playIcon} aria-hidden="true">▶</span>
        </button>
      </div>
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
