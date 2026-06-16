import { useState } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router";
import type { Campaign } from "../../lib/types";
import { useT, useFormat } from "../../lib/i18n";
import styles from "./donate.module.css";

const PREFS = [
  { value: "full_name", labelKey: "prefFullName", hintKey: "prefFullNameHint" },
  { value: "first_name_only", labelKey: "prefFirstName", hintKey: "prefFirstNameHint" },
  { value: "anonymous", labelKey: "prefAnonymous", hintKey: "prefAnonymousHint" },
] as const;

// JGive's maxRecurringMonths. Standing orders default to the full term, like the source.
const MAX_RECURRING_MONTHS = 36;
const MONTH_OPTIONS = Array.from({ length: MAX_RECURRING_MONTHS }, (_, i) => i + 1);

export default function DonateAmount() {
  const t = useT();
  const f = useFormat();
  const campaign = useOutletContext<Campaign>();
  const navigate = useNavigate();
  const { locale, currency, id } = useParams();

  const [presetCents, setPresetCents] = useState<number | null>(null);
  const [custom, setCustom] = useState("");
  const [frequency, setFrequency] = useState("one_time");
  const [months, setMonths] = useState(MAX_RECURRING_MONTHS);
  const [showComment, setShowComment] = useState(false);
  const [comment, setComment] = useState("");
  const [pref, setPref] = useState("full_name");

  const isRecurring = frequency === "monthly";
  // amountCents is the per-charge (monthly, for recurring) amount; totalCents is the
  // donor's full commitment shown to them = per-charge × term.
  const amountCents = presetCents ?? (custom ? Math.round(Number(custom) * 100) : 0);
  const totalCents = isRecurring ? amountCents * months : amountCents;
  const canContinue = amountCents > 0;

  // Render a preset's headline: "36 × ₪360" for recurring, "₪360" otherwise.
  const presetHeadline = (cents: number) =>
    isRecurring ? `${months} × ${f.money(cents)}` : f.money(cents);

  const onContinue = () => {
    const params = new URLSearchParams({
      amountCents: String(amountCents),
      frequency,
      displayPreference: pref,
    });
    if (isRecurring) params.set("recurringMonths", String(months));
    if (showComment && comment.trim()) params.set("comment", comment.trim());
    navigate(`/${locale}/${currency}/campaigns/${id}/donate/details?${params.toString()}`);
  };

  return (
    <div>
      <h2 className={styles.stepTitle}>{t("donationDetails")}</h2>

      <div className={styles.freq} role="radiogroup" aria-label={t("donationDetails")}>
        {[
          { v: "one_time", l: t("oneTime") },
          { v: "monthly", l: t("recurring") },
        ].map((o) => (
          <label key={o.v} className={frequency === o.v ? styles.freqOnActive : styles.freqOn}>
            <input
              type="radio"
              name="frequency"
              value={o.v}
              checked={frequency === o.v}
              onChange={() => setFrequency(o.v)}
            />
            {o.l}
          </label>
        ))}
      </div>

      <div className={styles.presets}>
        {campaign.presetAmounts.map((p) => (
          <button
            key={p.amountCents}
            type="button"
            className={presetCents === p.amountCents ? styles.presetActive : styles.preset}
            onClick={() => {
              setPresetCents(p.amountCents);
              setCustom("");
            }}
          >
            <span className={styles.presetAmount}>{presetHeadline(p.amountCents)}</span>
            <span className={styles.presetLabel}>{p.label}</span>
          </button>
        ))}
        <label className={presetCents === null && custom ? styles.presetActive : styles.preset}>
          <span className={styles.presetLabel}>{t("customAmount")}</span>
          <input
            className={styles.customInput}
            type="number"
            min="1"
            inputMode="numeric"
            aria-label={t("customAmount")}
            value={custom}
            onChange={(e) => {
              setCustom(e.target.value);
              setPresetCents(null);
            }}
          />
        </label>
      </div>

      {isRecurring && (
        <div className={styles.months}>
          <label htmlFor="months" className={styles.fieldLabel}>
            {t("numberOfMonths")}
          </label>
          <div className={styles.monthsRow}>
            <select
              id="months"
              className={styles.select}
              value={months}
              onChange={(e) => setMonths(Number(e.target.value))}
            >
              {MONTH_OPTIONS.map((m) => (
                <option key={m} value={m}>
                  {m} {t("months", { count: m })}
                </option>
              ))}
            </select>
            <span className={styles.monthsTotal}>
              {t("total")}: <strong>{f.money(totalCents)}</strong>
            </span>
          </div>
        </div>
      )}

      <label className={styles.checkRow}>
        <input
          type="checkbox"
          checked={showComment}
          onChange={(e) => setShowComment(e.target.checked)}
        />
        {t("addComment")}
      </label>
      {showComment && (
        <textarea
          className={styles.textarea}
          placeholder={t("commentPlaceholder")}
          maxLength={280}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      )}

      <div className={styles.field}>
        <label htmlFor="pref" className={styles.fieldLabel}>
          {t("displayPreferenceLabel")}
        </label>
        <select
          id="pref"
          className={styles.select}
          value={pref}
          onChange={(e) => setPref(e.target.value)}
        >
          {PREFS.map((p) => (
            <option key={p.value} value={p.value}>
              {t(p.labelKey)} — {t(p.hintKey)}
            </option>
          ))}
        </select>
      </div>

      <footer className={styles.footer}>
        <span>
          {t("yourDonation")}: <strong>{f.money(totalCents)}</strong>
          {isRecurring && amountCents > 0 && (
            <span className={styles.footerNote}>
              {" "}
              ({months} × {f.money(amountCents)})
            </span>
          )}
        </span>
        <button type="button" className={styles.primary} disabled={!canContinue} onClick={onContinue}>
          {t("continue")}
        </button>
      </footer>
    </div>
  );
}
