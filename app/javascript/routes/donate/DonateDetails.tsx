import { useEffect } from "react";
import {
  Form,
  redirect,
  useActionData,
  useNavigate,
  useNavigation,
  useOutletContext,
  useParams,
  useSearchParams,
  type ActionFunctionArgs,
} from "react-router";
import { gql } from "../../lib/gql";
import { CREATE_DONATION_MUTATION } from "../../lib/queries";
import { formatILS } from "../../lib/format";
import { he } from "../../locales/he";
import type { Campaign } from "../../lib/types";
import styles from "./donate.module.css";

interface CreateResult {
  createDonation: { donation: { id: string } | null; errors: string[] };
}

// Route action: posts the mutation, then redirects to the thanks route. A redirect
// from an action still triggers loader revalidation, so the campaign page behind the
// modal refreshes its progress/donor-count with zero manual refetching.
export async function donateAction({ request, params }: ActionFunctionArgs) {
  const form = await request.formData();
  const input = {
    campaignId: params.id,
    amountCents: Number(form.get("amountCents")),
    frequency: String(form.get("frequency") || "one_time"),
    displayPreference: String(form.get("displayPreference") || "full_name"),
    donorFirstName: (form.get("donorFirstName") as string) || null,
    donorLastName: (form.get("donorLastName") as string) || null,
    comment: (form.get("comment") as string) || null,
  };

  const data = await gql<CreateResult>(CREATE_DONATION_MUTATION, { input });
  const errors = data.createDonation.errors;
  if (errors.length) return { errors };

  return redirect(`/campaigns/${params.id}/donate/thanks`);
}

export default function DonateDetails() {
  const campaign = useOutletContext<Campaign>();
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const { id } = useParams();
  const actionData = useActionData() as { errors: string[] } | undefined;
  const navigation = useNavigation();

  const amountCents = Number(search.get("amountCents") || 0);
  const frequency = search.get("frequency") || "one_time";
  const pref = search.get("displayPreference") || "full_name";
  const comment = search.get("comment") || "";
  const anonymous = pref === "anonymous";
  const submitting = navigation.state === "submitting";

  // Defensive: a deep-link straight to details with no amount goes back to step 1.
  useEffect(() => {
    if (!amountCents) navigate(`/campaigns/${id}/donate/amount`, { replace: true });
  }, [amountCents, id, navigate]);

  return (
    <Form method="post">
      <h2 className={styles.stepTitle}>{he.personalDetails}</h2>

      <input type="hidden" name="amountCents" value={amountCents} />
      <input type="hidden" name="frequency" value={frequency} />
      <input type="hidden" name="displayPreference" value={pref} />
      <input type="hidden" name="comment" value={comment} />

      {!anonymous && (
        <>
          <div className={styles.field}>
            <label htmlFor="fn" className={styles.fieldLabel}>{he.firstName}</label>
            <input id="fn" name="donorFirstName" className={styles.input} required />
          </div>
          {pref === "full_name" && (
            <div className={styles.field}>
              <label htmlFor="ln" className={styles.fieldLabel}>{he.lastName}</label>
              <input id="ln" name="donorLastName" className={styles.input} required />
            </div>
          )}
        </>
      )}

      {actionData?.errors?.length ? (
        <ul className={styles.errors}>
          {actionData.errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      ) : null}

      <footer className={styles.footer}>
        <button
          type="button"
          className={styles.secondary}
          onClick={() => navigate(-1)}
        >
          {he.back}
        </button>
        <span>
          {he.yourDonation}: <strong>{formatILS(amountCents)}</strong>
        </span>
        <button type="submit" className={styles.primary} disabled={submitting}>
          {submitting ? "…" : he.submitDonation}
        </button>
      </footer>
    </Form>
  );
}
