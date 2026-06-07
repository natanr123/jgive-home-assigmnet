import { useLoaderData, type LoaderFunctionArgs } from "react-router";
import { gql } from "../lib/gql";
import { CAMPAIGN_QUERY } from "../lib/queries";
import { formatILS } from "../lib/format";
import type { Campaign } from "../lib/types";

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

// Minimal end-to-end render — real UI lands in step 5.
export default function CampaignPage() {
  const campaign = useLoaderData() as Campaign;
  const { stats } = campaign;

  return (
    <main style={{ maxWidth: 720, margin: "2rem auto", padding: "0 1rem" }}>
      <h1>{campaign.name}</h1>
      <p>{campaign.subtitle}</p>
      <p>
        <strong style={{ color: "var(--brand-green)" }}>{formatILS(stats.raisedCents)}</strong> נאספו ·
        יעד {formatILS(campaign.goalAmountCents)} · {stats.percent}% · {stats.donorsCount} תורמים
      </p>
      <p>עמותת {campaign.charityOrganization.name}</p>
    </main>
  );
}
