# Data model

Three domain models — **CharityOrganization → Campaign → Donation** — plus Active Storage for
images. One Rails app owns the whole schema (Postgres). Money is stored as **integer cents**
with a `currency` string throughout (no floats, no money gem at this size).

```
┌──────────────────────┐  1      ∞  ┌──────────────────────┐  1      ∞  ┌──────────────────────┐
│  CharityOrganization │───────────<│       Campaign       │───────────<│       Donation       │
│──────────────────────│  has_many  │──────────────────────│  has_many  │──────────────────────│
│ name, about,         │            │ name, subtitle,      │            │ amount_cents,        │
│ charity_number,      │            │ goal_amount_cents,   │            │ frequency, status,   │
│ email, phone, url    │            │ currency, preset_*,  │            │ recurring_months,    │
│                      │            │ additional_*, story  │            │ display_preference,  │
│ avatar (1 image)     │            │ banner, story_images │            │ donor_*, comment,    │
└──────────────────────┘            └──────────────────────┘            │ commission_cents     │
   has_one_attached                    has_one / has_many_attached       └──────────────────────┘
```

- `CharityOrganization has_many :campaigns` · `Campaign belongs_to :charity_organization`
  (FK `campaigns.charity_organization_id`, not null; `dependent: :destroy`).
- `Campaign has_many :donations` · `Donation belongs_to :campaign`
  (FK `donations.campaign_id`, not null; `dependent: :destroy`).
- Images are **Active Storage** attachments (mirrors JGive's blob-backed media): the charity
  has one `avatar`; a campaign has one `banner` and many `story_images`.

There is deliberately **no `donors` table** — see [Design notes](#design-notes).

---

## CharityOrganization

The nonprofit that runs campaigns (`charity_organizations`).

| Column | Type | Notes |
|---|---|---|
| `name` | string | required (`validates :name, presence: true`) |
| `about` | text | "about the charity" copy |
| `charity_number` | string | registration number |
| `email`, `phone_number`, `website_url` | string | contact details |
| `created_at` / `updated_at` | datetime | |

- `has_many :campaigns, dependent: :destroy`
- `has_one_attached :avatar`

---

## Campaign

A fundraising campaign — the page a donor lands on (`campaigns`).

| Column | Type | Notes |
|---|---|---|
| `charity_organization_id` | bigint, FK | `belongs_to :charity_organization` (not null) |
| `name` | string | required |
| `subtitle` | string | tagline under the title |
| `goal_amount_cents` | integer | required, `> 0` |
| `currency` | string | default `"ILS"` |
| `additional_amount_cents` | integer | default `0`, `>= 0` — offline/imported donations total |
| `additional_donors_count` | integer | default `0`, `>= 0` — offline/imported donor count |
| `preset_amounts` | jsonb | default `[]` — array of `{ amount_cents:, label: }` (shape validated) |
| `story_html` | text | campaign story; sanitized at read time in the GraphQL resolver |
| `created_at` / `updated_at` | datetime | |

- `has_one_attached :banner` · `has_many_attached :story_images`
- **`#stats` → `{ raised_cents, donors_count, percent }`** — the progress header. One DB
  round-trip (`SUM(amount_cents)` + `COUNT(*)` over `donations.countable`), memoized per
  instance. `additional_*` are added in so seeds can match the live page's real totals
  (₪993,188 / 3,170 donors) without inserting thousands of rows. `percent` is floored and
  capped at 100. **Recurring donations contribute their per-charge `amount_cents`** (the money
  moving now), not the full multi-year pledge.

---

## Donation

A single donation against a campaign (`donations`). Created in `pending`; payment is out of
scope (see [PLAN.md → payment plan](PLAN.md#wiring-a-real-payment-provider-pending--paid)).

| Column | Type | Notes |
|---|---|---|
| `campaign_id` | bigint, FK | `belongs_to :campaign` (not null) |
| `amount_cents` | integer | required, `> 0` and `< 100,000,000`. **Per-charge** amount |
| `currency` | string | default `"ILS"` |
| `frequency` | string (enum) | `one_time` (default) / `monthly` |
| `recurring_months` | integer, nullable | term for `monthly` (1–36); forced to `nil` for `one_time` |
| `status` | string (enum) | `pending` (default) / `paid` / `failed` |
| `display_preference` | string (enum) | `full_name` (default) / `first_name_only` / `anonymous` |
| `donor_first_name` | string | required unless `anonymous` |
| `donor_last_name` | string | required only if `full_name` |
| `comment` | text | dedication message; max 280 chars |
| `commission_cents` | integer, nullable | set asynchronously by `CalcCommissionJob` (10%) |
| `completed_at` | datetime, nullable | set when a donation becomes `paid` (future payment wiring) |
| `created_at` / `updated_at` | datetime | |

**Indexes:** `[campaign_id, status]` (the `countable` aggregate), `[campaign_id]`, `[created_at]`
(the recent-donations feed).

**Enums** (string-backed, validated): `frequency`, `status`, `display_preference`.

**Scopes**
- `countable` → `status IN (pending, paid)` — what counts toward displayed progress. The brief
  wants submit to move the bar, so `pending` counts; switching to paid-only is a one-line change.
- `recent_first` → `order(created_at: :desc)` — the donations feed.

**Callbacks**
- `before_validation` normalizes `recurring_months = nil` unless `monthly?` (a stray term on a
  one-time donation can't sneak in).
- `after_create_commit` enqueues `CalcCommissionJob` (after **commit**, so the Sidekiq worker —
  a separate process — sees the committed row).

**Methods**
- `display_name` — the public donor name resolved from `display_preference`
  (`full_name` → "First Last", `first_name_only` → "First", `anonymous` → `nil`). Mirrors
  JGive's `name: null ⇒ anonymous`.
- `recurring?` — alias for `monthly?`; exposed at the API as `recurring: Boolean`.
- `total_cents` — the donor's full commitment: `amount_cents × (recurring_months || 1)`. This is
  the donor-facing total shown in the modal; it is **not** what counts toward progress.

---

## Active Storage

Standard Rails tables back the image attachments: `active_storage_blobs` (one row per uploaded
file), `active_storage_attachments` (polymorphic join: record ↔ blob, by `name`), and
`active_storage_variant_records`. In production blobs live on **Google Cloud Storage**; GraphQL
resolves attachments to relative `/rails/active_storage/blobs/redirect/...` URLs.

---

## Design notes

- **Money = integer cents + `currency`.** JGive's own convention; no float money.
- **No `donors` table.** Donor identity is denormalized onto each `Donation`
  (`donor_first_name`, `donor_last_name`, `display_preference`, `comment`) because there are no
  accounts in scope — there's no identity key to dedupe on, and each card is a per-donation
  snapshot. Clean upgrade path: add a `donors` table + a nullable `donation.donor_id` later.
- **`pending` counts toward progress** (the `countable` scope) — isolated so paid-only is a
  one-word change. The API exposes only a `pending` boolean, never the raw `status` enum.
- **Recurring = per-charge × term.** `amount_cents` is the monthly charge, `recurring_months`
  the term; `Donation#total_cents` is the donor-facing commitment, while `Campaign#stats` counts
  the per-charge installment (the money moving now). Each is a one-line switch in its own model.
- **`additional_amount_cents` / `additional_donors_count`** absorb the offline/imported
  remainder (JGive's own "additional donations" idea) so seeded totals match the live page
  exactly without thousands of donation rows.
- **Commission** is 10% of `amount_cents` (`CalcCommissionJob`, `COMMISSION_RATE = 0.10`),
  computed off the request path on Sidekiq.

Full rationale for the trade-offs is in [PLAN.md → Key decisions](PLAN.md#key-decisions--trade-offs).
