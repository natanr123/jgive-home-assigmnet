import type { Campaign } from "../lib/types";

// Placeholder — the real cards + load-more land in step 7.
export default function RecentDonationsTab({ campaign }: { campaign: Campaign }) {
  return (
    <p style={{ color: "var(--muted)" }}>
      {campaign.stats.donorsCount.toLocaleString("he-IL")} תורמים — רשימת התרומות תיטען כאן.
    </p>
  );
}
