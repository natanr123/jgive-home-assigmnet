import { useEffect, useState } from "react";
import { gql } from "../lib/gql";
import { RECENT_DONATIONS_QUERY } from "../lib/queries";
import type { Campaign, Donation, RecentDonations } from "../lib/types";
import DonationCard from "./DonationCard";
import { he } from "../locales/he";
import styles from "./RecentDonationsTab.module.css";

const PER_PAGE = 8;

// Self-contained paging: page 1 on mount, "load more" appends (deduped by id).
// fetcher.data would replace rather than accumulate, so we own the list in state;
// remounting the tab (e.g. after donating + returning) naturally resets to page 1
// with the new pending donation on top.
export default function RecentDonationsTab({ campaign }: { campaign: Campaign }) {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [nextPage, setNextPage] = useState<number | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  async function loadPage(page: number) {
    setLoading(true);
    const { recentDonations } = await gql<{ recentDonations: RecentDonations }>(
      RECENT_DONATIONS_QUERY,
      { campaignId: campaign.id, page, perPage: PER_PAGE }
    );
    setDonations((prev) => {
      if (page === 1) return recentDonations.donations;
      const seen = new Set(prev.map((d) => d.id));
      return [...prev, ...recentDonations.donations.filter((d) => !seen.has(d.id))];
    });
    setNextPage(recentDonations.nextPage);
    setTotal(recentDonations.totalCount);
    setLoading(false);
  }

  useEffect(() => {
    loadPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaign.id]);

  if (!loading && donations.length === 0) {
    return <p style={{ color: "var(--muted)" }}>{he.noDonationsYet}</p>;
  }

  return (
    <div>
      <p className={styles.count}>{total.toLocaleString("he-IL")} תרומות</p>
      <ul className={styles.list}>
        {donations.map((d) => (
          <DonationCard key={d.id} donation={d} />
        ))}
      </ul>
      {nextPage && (
        <button
          type="button"
          className={styles.loadMore}
          disabled={loading}
          onClick={() => loadPage(nextPage)}
        >
          {he.loadMore}
        </button>
      )}
    </div>
  );
}
