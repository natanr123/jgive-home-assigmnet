import { useLoaderData, Outlet, Link, type LoaderFunctionArgs } from "react-router";
import { gql } from "../lib/gql";
import { CAMPAIGN_QUERY } from "../lib/queries";
import type { Campaign } from "../lib/types";
import { he } from "../locales/he";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import Hero from "../components/Hero";
import ProgressBar from "../components/ProgressBar";
import CtaBlock from "../components/CtaBlock";
import Tabs, { type TabDef } from "../components/Tabs";
import AboutTab from "../components/AboutTab";
import OrganizationTab from "../components/OrganizationTab";
import RecentDonationsTab from "../components/RecentDonationsTab";
import styles from "./campaign.module.css";

export async function campaignLoader({ params }: LoaderFunctionArgs): Promise<Campaign> {
  try {
    const data = await gql<{ campaign: Campaign | null }>(CAMPAIGN_QUERY, { id: params.id });
    if (!data.campaign) throw new Response("Not Found", { status: 404 });
    return data.campaign;
  } catch (err) {
    if (err instanceof Response) throw err;
    throw new Response("Not Found", { status: 404 });
  }
}

export default function CampaignPage() {
  const campaign = useLoaderData() as Campaign;

  const tabs: TabDef[] = [
    { key: "about", label: he.tabs.about, render: () => <AboutTab campaign={campaign} /> },
    { key: "recent", label: he.tabs.recentDonations, render: () => <RecentDonationsTab campaign={campaign} /> },
    { key: "ambassadors", label: he.tabs.ambassadors, disabled: true },
    { key: "groups", label: he.tabs.groups, disabled: true },
    { key: "organization", label: he.tabs.organization, render: () => <OrganizationTab campaign={campaign} /> },
    { key: "updates", label: he.tabs.updates, disabled: true },
  ];

  return (
    <>
      <SiteHeader donateTo="donate/amount" />

      <main>
        {/* Full-bleed hero */}
        <Hero campaign={campaign} />

        <div className={styles.shell}>
          <ProgressBar stats={campaign.stats} />

          {/* Centered donate cluster + title, mirroring the original. */}
          <section className={styles.ctaRow}>
            <div className={styles.titleCol}>
              <h1 className={styles.headline}>{campaign.name}</h1>
              {campaign.subtitle && <p className={styles.subtitle}>{campaign.subtitle}</p>}
              <Link to="edit" className={styles.editLink}>✎ {he.edit}</Link>
            </div>
            <div className={styles.ctaCol}>
              <CtaBlock campaign={campaign} />
            </div>
          </section>

          <Tabs tabs={tabs} />

          {/* Donate modal (nested routes) mounts here. */}
          <Outlet context={campaign} />
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
