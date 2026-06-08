import { useState } from "react";
import {
  Link,
  redirect,
  useActionData,
  useLoaderData,
  useNavigation,
  useSubmit,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "react-router";
import { gql } from "../lib/gql";
import { directUpload } from "../lib/directUpload";
import { CAMPAIGN_EDIT_QUERY, UPDATE_CAMPAIGN_MUTATION } from "../lib/queries";
import type { Campaign } from "../lib/types";
import { he } from "../locales/he";
import styles from "./CampaignEdit.module.css";

export async function editLoader({ params }: LoaderFunctionArgs): Promise<Campaign> {
  try {
    const data = await gql<{ campaign: Campaign | null }>(CAMPAIGN_EDIT_QUERY, { id: params.id });
    if (!data.campaign) throw new Response("Not Found", { status: 404 });
    return data.campaign;
  } catch (err) {
    if (err instanceof Response) throw err;
    throw new Response("Not Found", { status: 404 });
  }
}

export async function editAction({ request, params }: ActionFunctionArgs) {
  const form = await request.formData();
  const payload = JSON.parse(String(form.get("payload")));
  const data = await gql<{ updateCampaign: { campaign: { id: string } | null; errors: string[] } }>(
    UPDATE_CAMPAIGN_MUTATION,
    { input: { id: params.id, ...payload } }
  );
  if (data.updateCampaign.errors.length) return { errors: data.updateCampaign.errors };
  return redirect(`/campaigns/${params.id}`);
}

interface PresetRow {
  amount: string; // shekels, as text for the input
  label: string;
}

export default function CampaignEdit() {
  const campaign = useLoaderData() as Campaign;
  const submit = useSubmit();
  const navigation = useNavigation();
  const actionData = useActionData() as { errors: string[] } | undefined;
  const org = campaign.charityOrganization;

  const [name, setName] = useState(campaign.name);
  const [subtitle, setSubtitle] = useState(campaign.subtitle ?? "");
  const [goal, setGoal] = useState(String(Math.round(campaign.goalAmountCents / 100)));
  const [currency, setCurrency] = useState(campaign.currency);
  const [story, setStory] = useState(campaign.storyHtmlRaw ?? "");
  const [presets, setPresets] = useState<PresetRow[]>(
    campaign.presetAmounts.map((p) => ({ amount: String(Math.round(p.amountCents / 100)), label: p.label }))
  );
  const [orgName, setOrgName] = useState(org.name);
  const [email, setEmail] = useState(org.email ?? "");
  const [phone, setPhone] = useState(org.phoneNumber ?? "");
  const [website, setWebsite] = useState(org.websiteUrl ?? "");
  const [charityNumber, setCharityNumber] = useState(org.charityNumber ?? "");
  const [about, setAbout] = useState(org.aboutRaw ?? "");

  // Image uploads (Active Storage direct upload → signed_id passed to the mutation).
  const [bannerPreview, setBannerPreview] = useState(campaign.coverImageUrl ?? "");
  const [bannerSignedId, setBannerSignedId] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState(org.avatarUrl ?? "");
  const [avatarSignedId, setAvatarSignedId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const saving = navigation.state !== "idle";

  async function handleUpload(
    file: File,
    setPreview: (url: string) => void,
    setSignedId: (id: string) => void
  ) {
    setUploadError(null);
    setPreview(URL.createObjectURL(file)); // optimistic local preview
    try {
      setSignedId(await directUpload(file));
    } catch {
      setUploadError("ההעלאה נכשלה, נסו שוב");
    }
  }

  const onPickFile =
    (setPreview: (u: string) => void, setSignedId: (id: string) => void) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleUpload(file, setPreview, setSignedId);
    };

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      name,
      subtitle,
      goalAmountCents: Math.round(Number(goal) * 100),
      currency,
      storyHtml: story,
      presetAmounts: presets
        .filter((p) => p.amount && p.label)
        .map((p) => ({ amountCents: Math.round(Number(p.amount) * 100), label: p.label })),
      charityOrganization: {
        name: orgName,
        email,
        phoneNumber: phone,
        websiteUrl: website,
        charityNumber,
        about,
      },
      ...(bannerSignedId ? { bannerSignedId } : {}),
      ...(avatarSignedId ? { avatarSignedId } : {}),
    };
    submit({ payload: JSON.stringify(payload) }, { method: "post" });
  }

  const updatePreset = (i: number, patch: Partial<PresetRow>) =>
    setPresets((rows) => rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  return (
    <main className={styles.shell}>
      <div className={styles.head}>
        <h1>{he.editTitle}</h1>
        <Link to={`/campaigns/${campaign.id}`} className={styles.back}>← {campaign.name}</Link>
      </div>
      <p className={styles.intro}>{he.editIntro}</p>

      {actionData?.errors?.length ? (
        <ul className={styles.errors}>
          {actionData.errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      ) : null}

      <form onSubmit={onSubmit} className={styles.form}>
        <label className={styles.field}>
          <span>{he.fieldName}</span>
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </label>

        <label className={styles.field}>
          <span>{he.fieldSubtitle}</span>
          <input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
        </label>

        <div className={styles.row}>
          <label className={styles.field}>
            <span>{he.fieldGoal}</span>
            <input type="number" min="1" value={goal} onChange={(e) => setGoal(e.target.value)} required />
          </label>
          <label className={styles.field}>
            <span>{he.fieldCurrency}</span>
            <input value={currency} onChange={(e) => setCurrency(e.target.value)} />
          </label>
        </div>

        <label className={styles.field}>
          <span>{he.fieldStory}</span>
          <textarea className={styles.code} rows={10} value={story} onChange={(e) => setStory(e.target.value)} />
        </label>

        <fieldset className={styles.fieldset}>
          <legend>{he.imagesHeading}</legend>
          {uploadError && <p className={styles.uploadError}>{uploadError}</p>}
          <div className={styles.uploads}>
            <div className={styles.upload}>
              <span className={styles.uploadLabel}>{he.bannerLabel}</span>
              {bannerPreview && <img className={styles.bannerPreview} src={bannerPreview} alt="" />}
              <input type="file" accept="image/*" onChange={onPickFile(setBannerPreview, setBannerSignedId)} />
            </div>
            <div className={styles.upload}>
              <span className={styles.uploadLabel}>{he.avatarLabel}</span>
              {avatarPreview && <img className={styles.avatarPreview} src={avatarPreview} alt="" />}
              <input type="file" accept="image/*" onChange={onPickFile(setAvatarPreview, setAvatarSignedId)} />
            </div>
          </div>
        </fieldset>

        <fieldset className={styles.fieldset}>
          <legend>{he.presetsHeading}</legend>
          {presets.map((p, i) => (
            <div className={styles.presetRow} key={i}>
              <input
                type="number"
                min="1"
                aria-label={he.presetAmountLabel}
                placeholder={he.presetAmountLabel}
                value={p.amount}
                onChange={(e) => updatePreset(i, { amount: e.target.value })}
              />
              <input
                aria-label={he.presetLabelLabel}
                placeholder={he.presetLabelLabel}
                value={p.label}
                onChange={(e) => updatePreset(i, { label: e.target.value })}
              />
              <button type="button" className={styles.remove} onClick={() => setPresets((r) => r.filter((_, idx) => idx !== i))}>
                {he.removePreset}
              </button>
            </div>
          ))}
          <button type="button" className={styles.add} onClick={() => setPresets((r) => [...r, { amount: "", label: "" }])}>
            + {he.addPreset}
          </button>
        </fieldset>

        <fieldset className={styles.fieldset}>
          <legend>{he.orgHeading}</legend>
          <label className={styles.field}>
            <span>{he.fieldOrgName}</span>
            <input value={orgName} onChange={(e) => setOrgName(e.target.value)} />
          </label>
          <div className={styles.row}>
            <label className={styles.field}>
              <span>{he.email}</span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            <label className={styles.field}>
              <span>{he.phone}</span>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </label>
          </div>
          <div className={styles.row}>
            <label className={styles.field}>
              <span>{he.website}</span>
              <input value={website} onChange={(e) => setWebsite(e.target.value)} />
            </label>
            <label className={styles.field}>
              <span>{he.charityNumber}</span>
              <input value={charityNumber} onChange={(e) => setCharityNumber(e.target.value)} />
            </label>
          </div>
          <label className={styles.field}>
            <span>{he.fieldOrgAbout}</span>
            <textarea className={styles.code} rows={5} value={about} onChange={(e) => setAbout(e.target.value)} />
          </label>
        </fieldset>

        <div className={styles.actions}>
          <Link to={`/campaigns/${campaign.id}`} className={styles.cancel}>{he.cancel}</Link>
          <button type="submit" className={styles.save} disabled={saving}>
            {saving ? he.saving : he.save}
          </button>
        </div>
      </form>
    </main>
  );
}
