import { useState } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router";
import type { Campaign } from "../../lib/types";
import { formatILS } from "../../lib/format";
import { he } from "../../locales/he";
import styles from "./donate.module.css";

const PREFS = [
  { value: "full_name", label: he.prefFullName, hint: he.prefFullNameHint },
  { value: "first_name_only", label: he.prefFirstName, hint: he.prefFirstNameHint },
  { value: "anonymous", label: he.prefAnonymous, hint: he.prefAnonymousHint },
] as const;

// JGive's maxRecurringMonths. Standing orders default to the full term, like the source.
const MAX_RECURRING_MONTHS = 36;
const MONTH_OPTIONS = Array.from({ length: MAX_RECURRING_MONTHS }, (_, i) => i + 1);

export default function DonateAmount() {
  const campaign = useOutletContext<Campaign>();
  const navigate = useNavigate();
  const { id } = useParams();

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
    isRecurring ? `${months} × ${formatILS(cents)}` : formatILS(cents);

  const onContinue = () => {
    const params = new URLSearchParams({
      amountCents: String(amountCents),
      frequency,
      displayPreference: pref,
    });
    if (isRecurring) params.set("recurringMonths", String(months));
    if (showComment && comment.trim()) params.set("comment", comment.trim());
    navigate(`/campaigns/${id}/donate/details?${params.toString()}`);
  };

  return (
    <div>
      <h2 className={styles.stepTitle}>{he.donationDetails}</h2>

      <div className={styles.freq} role="radiogroup" aria-label={he.donationDetails}>
        {[
          { v: "one_time", l: he.oneTime },
          { v: "monthly", l: he.recurring },
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
          <span className={styles.presetLabel}>{he.customAmount}</span>
          <input
            className={styles.customInput}
            type="number"
            min="1"
            inputMode="numeric"
            aria-label={he.customAmount}
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
            {he.numberOfMonths}
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
                  {m} {he.monthsUnit}
                </option>
              ))}
            </select>
            <span className={styles.monthsTotal}>
              {he.total}: <strong>{formatILS(totalCents)}</strong>
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
        {he.addComment}
      </label>
      {showComment && (
        <textarea
          className={styles.textarea}
          placeholder={he.commentPlaceholder}
          maxLength={280}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      )}

      <div className={styles.field}>
        <label htmlFor="pref" className={styles.fieldLabel}>
          {he.displayPreferenceLabel}
        </label>
        <select
          id="pref"
          className={styles.select}
          value={pref}
          onChange={(e) => setPref(e.target.value)}
        >
          {PREFS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label} — {p.hint}
            </option>
          ))}
        </select>
      </div>

      <footer className={styles.footer}>
        <span>
          {he.yourDonation}: <strong>{formatILS(totalCents)}</strong>
          {isRecurring && amountCents > 0 && (
            <span className={styles.footerNote}>
              {" "}
              ({months} × {formatILS(amountCents)})
            </span>
          )}
        </span>
        <button type="button" className={styles.primary} disabled={!canContinue} onClick={onContinue}>
          {he.continue}
        </button>
      </footer>
    </div>
  );
}
