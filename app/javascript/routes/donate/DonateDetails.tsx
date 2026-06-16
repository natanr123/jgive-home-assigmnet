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
import { useT, useFormat } from "../../lib/i18n";
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
  const recurringMonths = form.get("recurringMonths");
  const input = {
    campaignId: params.id,
    amountCents: Number(form.get("amountCents")),
    frequency: String(form.get("frequency") || "one_time"),
    recurringMonths: recurringMonths ? Number(recurringMonths) : null,
    displayPreference: String(form.get("displayPreference") || "full_name"),
    donorFirstName: (form.get("donorFirstName") as string) || null,
    donorLastName: (form.get("donorLastName") as string) || null,
    comment: (form.get("comment") as string) || null,
  };

  const data = await gql<CreateResult>(CREATE_DONATION_MUTATION, { input });
  const errors = data.createDonation.errors;
  if (errors.length) return { errors };

  return redirect(`/${params.locale}/${params.currency}/campaigns/${params.id}/donate/thanks`);
}

export default function DonateDetails() {
  const campaign = useOutletContext<Campaign>();
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const { locale, currency, id } = useParams();
  const actionData = useActionData() as { errors: string[] } | undefined;
  const navigation = useNavigation();
  const t = useT();
  const f = useFormat();

  const amountCents = Number(search.get("amountCents") || 0);
  const frequency = search.get("frequency") || "one_time";
  const recurringMonths = Number(search.get("recurringMonths") || 0);
  const pref = search.get("displayPreference") || "full_name";
  const comment = search.get("comment") || "";
  const anonymous = pref === "anonymous";
  const isRecurring = frequency === "monthly";
  const totalCents = isRecurring && recurringMonths ? amountCents * recurringMonths : amountCents;
  const submitting = navigation.state === "submitting";

  // Defensive: a deep-link straight to details that is missing required wizard state
  // (no amount, or a monthly donation with no term) goes back to step 1, where those
  // are chosen — rather than letting the user submit something the backend will reject.
  useEffect(() => {
    if (!amountCents || (isRecurring && !recurringMonths)) {
      navigate(`/${locale}/${currency}/campaigns/${id}/donate/amount`, { replace: true });
    }
  }, [amountCents, isRecurring, recurringMonths, id, navigate]);

  return (
    <Form method="post">
      <h2 className={styles.stepTitle}>{t("personalDetails")}</h2>

      <input type="hidden" name="amountCents" value={amountCents} />
      <input type="hidden" name="frequency" value={frequency} />
      {isRecurring && <input type="hidden" name="recurringMonths" value={recurringMonths} />}
      <input type="hidden" name="displayPreference" value={pref} />
      <input type="hidden" name="comment" value={comment} />

      {!anonymous && (
        <>
          <div className={styles.field}>
            <label htmlFor="fn" className={styles.fieldLabel}>{t("firstName")}</label>
            <input id="fn" name="donorFirstName" className={styles.input} required />
          </div>
          {pref === "full_name" && (
            <div className={styles.field}>
              <label htmlFor="ln" className={styles.fieldLabel}>{t("lastName")}</label>
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
          {t("back")}
        </button>
        <span>
          {t("yourDonation")}: <strong>{f.money(totalCents)}</strong>
          {isRecurring && recurringMonths > 0 && (
            <span className={styles.footerNote}>
              {" "}
              ({recurringMonths} × {f.money(amountCents)})
            </span>
          )}
        </span>
        <button type="submit" className={styles.primary} disabled={submitting}>
          {submitting ? "…" : t("submitDonation")}
        </button>
      </footer>
    </Form>
  );
}
