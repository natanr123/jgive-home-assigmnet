import { useState } from "react";
import { Link } from "react-router";
import { he } from "../locales/he";
import styles from "./CtaBlock.module.css";

export default function CtaBlock({ campaign }: { campaign: { name: string; subtitle?: string | null } }) {
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable */
    }
  };

  const shareUrl = encodeURIComponent(typeof window !== "undefined" ? window.location.href : "");

  return (
    <section className={styles.card}>
      <button type="button" className={styles.bit} disabled title={he.bitDisabled}>
        {he.bit}
      </button>

      <Link to="donate/amount" className={styles.donate}>
        {he.donate}
      </Link>

      <div className={styles.tax}>
        <span>{he.taxDeductible}</span>
        <span className={styles.flags} aria-hidden="true">🇺🇸 🇮🇱 🇬🇧 🇨🇦</span>
      </div>

      <div className={styles.share}>
        <button type="button" onClick={copyLink} className={styles.shareBtn} title={he.copyLink}>
          🔗
        </button>
        <a
          className={styles.shareBtn}
          href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Facebook"
        >
          f
        </a>
        <a
          className={styles.shareBtn}
          href={`https://wa.me/?text=${shareUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="WhatsApp"
        >
          ✆
        </a>
        <a
          className={styles.shareBtn}
          href={`https://twitter.com/intent/tweet?url=${shareUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="X"
        >
          𝕏
        </a>
        {copied && <span className={styles.copied}>{he.linkCopied}</span>}
      </div>
    </section>
  );
}
