import { useState } from "react";
import {
  Link,
  redirect,
  useActionData,
  useLoaderData,
  useNavigation,
  useParams,
  useSubmit,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "react-router";
import { gql } from "../lib/gql";
import { directUpload } from "../lib/directUpload";
import { CAMPAIGN_EDIT_QUERY, UPDATE_CAMPAIGN_MUTATION } from "../lib/queries";
import type { Campaign } from "../lib/types";
import { useT } from "../lib/i18n";
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
  return redirect(`/${params.locale}/${params.currency}/campaigns/${params.id}`);
}

interface PresetRow {
  amount: string; // shekels, as text for the input
  label: string;
}

// Story images are referenced in the HTML by positional token (campaigns/story/N.jpg)
// and resolved to the Nth attached blob. A newly-added image gets the next index.
function nextStoryIndex(html: string): number {
  const nums = [...html.matchAll(/campaigns\/story\/(\d+)\.jpg/g)].map((m) => Number(m[1]));
  return (nums.length ? Math.max(...nums) : 0) + 1;
}

export default function CampaignEdit() {
  const t = useT();
  const { locale, currency: routeCurrency } = useParams();
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
  const [storyThumbs, setStoryThumbs] = useState<string[]>(campaign.storyImageUrls ?? []);
  const [storyImageSignedIds, setStoryImageSignedIds] = useState<string[]>([]);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Copy the full embed snippet for story image N so it can be pasted into the story HTML.
  function copyEmbed(index: number) {
    const snippet = `<figure><img src="campaigns/story/${index + 1}.jpg"></figure>`;
    navigator.clipboard?.writeText(snippet);
    setCopiedIdx(index);
    setTimeout(() => setCopiedIdx((c) => (c === index ? null : c)), 1500);
  }

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
      setUploadError(t("uploadFailed"));
    }
  }

  const onPickFile =
    (setPreview: (u: string) => void, setSignedId: (id: string) => void) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleUpload(file, setPreview, setSignedId);
    };

  async function onAddStoryImages(files: FileList) {
    setUploadError(null);
    let html = story;
    const ids: string[] = [];
    const thumbs: string[] = [];
    for (const file of Array.from(files)) {
      try {
        const sid = await directUpload(file);
        const idx = nextStoryIndex(html);
        html += `\n<figure><img src="campaigns/story/${idx}.jpg"></figure>`;
        ids.push(sid);
        thumbs.push(URL.createObjectURL(file));
      } catch {
        setUploadError(t("uploadFailed"));
      }
    }
    setStory(html);
    setStoryImageSignedIds((prev) => [...prev, ...ids]);
    setStoryThumbs((prev) => [...prev, ...thumbs]);
  }

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
      ...(storyImageSignedIds.length ? { storyImageSignedIds } : {}),
    };
    submit({ payload: JSON.stringify(payload) }, { method: "post" });
  }

  const updatePreset = (i: number, patch: Partial<PresetRow>) =>
    setPresets((rows) => rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  return (
    <main className={styles.shell}>
      <div className={styles.head}>
        <h1>{t("editTitle")}</h1>
        <Link to={`/${locale}/${routeCurrency}/campaigns/${campaign.id}`} className={styles.back}>← {campaign.name}</Link>
      </div>
      <p className={styles.intro}>{t("editIntro")}</p>

      {actionData?.errors?.length ? (
        <ul className={styles.errors}>
          {actionData.errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      ) : null}

      <form onSubmit={onSubmit} className={styles.form}>
        <label className={styles.field}>
          <span>{t("fieldName")}</span>
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </label>

        <label className={styles.field}>
          <span>{t("fieldSubtitle")}</span>
          <input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
        </label>

        <div className={styles.row}>
          <label className={styles.field}>
            <span>{t("fieldGoal")}</span>
            <input type="number" min="1" value={goal} onChange={(e) => setGoal(e.target.value)} required />
          </label>
          <label className={styles.field}>
            <span>{t("fieldCurrency")}</span>
            <input value={currency} onChange={(e) => setCurrency(e.target.value)} />
          </label>
        </div>

        <label className={styles.field}>
          <span>{t("fieldStory")}</span>
          <textarea className={styles.code} rows={10} value={story} onChange={(e) => setStory(e.target.value)} />
        </label>

        <fieldset className={styles.fieldset}>
          <legend>{t("imagesHeading")}</legend>
          {uploadError && <p className={styles.uploadError}>{uploadError}</p>}
          <div className={styles.uploads}>
            <div className={styles.upload}>
              <span className={styles.uploadLabel}>{t("bannerLabel")}</span>
              {bannerPreview && <img className={styles.bannerPreview} src={bannerPreview} alt="" />}
              <input type="file" accept="image/*" onChange={onPickFile(setBannerPreview, setBannerSignedId)} />
            </div>
            <div className={styles.upload}>
              <span className={styles.uploadLabel}>{t("avatarLabel")}</span>
              {avatarPreview && <img className={styles.avatarPreview} src={avatarPreview} alt="" />}
              <input type="file" accept="image/*" onChange={onPickFile(setAvatarPreview, setAvatarSignedId)} />
            </div>
          </div>

          <div className={styles.upload}>
            <span className={styles.uploadLabel}>{t("storyImagesLabel")}</span>
            {storyThumbs.length > 0 && (
              <div className={styles.storyThumbs}>
                {storyThumbs.map((u, i) => (
                  <figure key={i} className={styles.storyThumbItem}>
                    <img className={styles.storyThumb} src={u} alt="" />
                    <figcaption>
                      <button
                        type="button"
                        className={styles.storyToken}
                        onClick={() => copyEmbed(i)}
                        title={t("copyEmbedTitle")}
                      >
                        {copiedIdx === i ? t("copied") : `campaigns/story/${i + 1}.jpg`}
                      </button>
                    </figcaption>
                  </figure>
                ))}
              </div>
            )}
            <p className={styles.storyHint}>{t("storyEmbedHint")}</p>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => e.target.files && onAddStoryImages(e.target.files)}
            />
          </div>
        </fieldset>

        <fieldset className={styles.fieldset}>
          <legend>{t("presetsHeading")}</legend>
          {presets.map((p, i) => (
            <div className={styles.presetRow} key={i}>
              <input
                type="number"
                min="1"
                aria-label={t("presetAmountLabel")}
                placeholder={t("presetAmountLabel")}
                value={p.amount}
                onChange={(e) => updatePreset(i, { amount: e.target.value })}
              />
              <input
                aria-label={t("presetLabelLabel")}
                placeholder={t("presetLabelLabel")}
                value={p.label}
                onChange={(e) => updatePreset(i, { label: e.target.value })}
              />
              <button type="button" className={styles.remove} onClick={() => setPresets((r) => r.filter((_, idx) => idx !== i))}>
                {t("removePreset")}
              </button>
            </div>
          ))}
          <button type="button" className={styles.add} onClick={() => setPresets((r) => [...r, { amount: "", label: "" }])}>
            + {t("addPreset")}
          </button>
        </fieldset>

        <fieldset className={styles.fieldset}>
          <legend>{t("orgHeading")}</legend>
          <label className={styles.field}>
            <span>{t("fieldOrgName")}</span>
            <input value={orgName} onChange={(e) => setOrgName(e.target.value)} />
          </label>
          <div className={styles.row}>
            <label className={styles.field}>
              <span>{t("email")}</span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            <label className={styles.field}>
              <span>{t("phone")}</span>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </label>
          </div>
          <div className={styles.row}>
            <label className={styles.field}>
              <span>{t("website")}</span>
              <input value={website} onChange={(e) => setWebsite(e.target.value)} />
            </label>
            <label className={styles.field}>
              <span>{t("charityNumber")}</span>
              <input value={charityNumber} onChange={(e) => setCharityNumber(e.target.value)} />
            </label>
          </div>
          <label className={styles.field}>
            <span>{t("fieldOrgAbout")}</span>
            <textarea className={styles.code} rows={5} value={about} onChange={(e) => setAbout(e.target.value)} />
          </label>
        </fieldset>

        <div className={styles.actions}>
          <Link to={`/${locale}/${routeCurrency}/campaigns/${campaign.id}`} className={styles.cancel}>{t("cancel")}</Link>
          <button type="submit" className={styles.save} disabled={saving}>
            {saving ? t("saving") : t("save")}
          </button>
        </div>
      </form>
    </main>
  );
}
