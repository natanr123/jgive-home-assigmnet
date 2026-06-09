# Plan & deep-dive — הגן הכתום / JGive donation page

The detailed reasoning behind the build. The [README](README.md) is the quick start and
summary; this file holds the architecture, full decisions, payment plan, and deployment.

- [Architecture & the modernization story](#architecture--the-modernization-story)
- [GraphQL surface](#graphql-surface)
- [Key decisions & trade-offs](#key-decisions--trade-offs)
- [Wiring a real payment provider (pending → paid)](#wiring-a-real-payment-provider-pending--paid)
- [Deployment & infrastructure-as-code](#deployment--infrastructure-as-code)
- [Deliberate scope cuts](#deliberate-scope-cuts)
- [Setup, thought process & AI workflow](#setup-thought-process--ai-workflow)

---

## Architecture & the modernization story

JGive's live page (reverse-engineered — evidence in `docs/research/`):

| Layer | Theirs (verified) |
|---|---|
| Frontend | React **18+ SPA, client-side rendered** (CRA/webpack, CSS modules) — not Next.js, no SSR |
| Routing | **React Router v5-era** (`history@4`; `history.state` is `{key}`, no v6 `usr/idx`) |
| API | **GraphQL** at same-origin `/graphql` |
| Backend | **Ruby on Rails** + Active Storage, on Heroku behind Cloudflare |

We reproduce that **Rails-serves-React-SPA-+-GraphQL** shape and **modernize the router**
(the v5→v7 jump their shipped bundle hasn't made — a claim bounded to the deployed bundle,
not their codebase):

| Theirs (v5-era) | Ours (React Router v7 data router) |
|---|---|
| `BrowserRouter` + `<Switch>` | `createBrowserRouter` + `RouterProvider` (from `react-router/dom`) |
| Data fetching in components | **Route loaders** (`campaign` loads before render) |
| Imperative submit + manual progress re-query | **Route action** → `redirect` → **automatic loader revalidation** updates progress |
| URL-routed modal steps, re-wired per step | **Nested routes** in a native `<dialog>`; wizard state in **URL search params** (survives refresh/deep-link) |
| Apollo client cache | **None** — loaders/actions + router revalidation is the cache-invalidation strategy; a ~20-line `gqlFetch` replaces a client library |

**Is this over-built for a take-home?** The brief says "small Rails app" and "judgment over
completeness". It is one Rails app — it owns the domain, data, API, and serves everything;
React only replaces the view layer, exactly as in JGive's production app. Deliberately
**not** added: Apollo, Redux, an i18n framework, Vite, SSR. A Hotwire monolith was the
considered alternative (simpler, but it showcases less of the real architecture and the
modernization story). The pivot was made because the brief explicitly values *how* I work
with AI and *judgment* over raw build speed.

## GraphQL surface

The GraphQL surface is deliberately tiny — **2 queries + 1 mutation** — converging the
**~7 operations** JGive fires for this one page:

| Theirs | Ours |
|---|---|
| `GetDonationTarget` + `GetCampaignBannerDonationTarget` + `GetDonationTargetTabs` | `campaign(id)` |
| `GetRecentDonations` | `recentDonations(campaignId, page, perPage)` |
| `CharityMetrics`, `CurrentEmployee`, `I18n` | cut (no metrics / accounts / server i18n) |
| donation/payment mutations | `createDonation` → `pending` |

(graphql-ruby itself is *inferred* — a Rails backend makes it the overwhelmingly likely
gem; server-side gems aren't observable from outside.)

---

## Key decisions & trade-offs

- **Money is integer cents** (`amount_cents`, `goal_amount_cents`) with a `currency`
  string — JGive's own convention; no float money, no money gem at this size.
- **Pending counts toward progress.** The brief says submitting must update progress, so
  `Donation.countable` = `pending + paid`. It's isolated in one scope — paid-only is a
  one-word change. Pending donations also appear in the public list, **labeled**
  "ממתין לאישור" (the `pending` boolean is the only status the API exposes; the raw enum
  never leaks). In production you'd count paid only, hide pending from the feed, and
  rate-limit `createDonation` behind the payment intent.
- **Recurring (standing order) = per-charge amount × term.** `amount_cents` is the
  *monthly* charge; a nullable `recurring_months` (1–36, JGive's `maxRecurringMonths`)
  holds the term, and `Donation#total_cents` is the donor-facing commitment shown in the
  modal (`"N × ₪amount"`, total `"סה"כ"`). **Progress counts the per-charge installment**
  (the money moving now), not the multi-year pledge — isolated as a one-line switch in
  `Campaign#stats`, the same way `countable` is. The term is required+bounded for monthly
  and normalized to `nil` for one-time; the wizard guards a deep-link that arrives monthly
  without a term by bouncing back to the amount step.
- **Donor display name resolved server-side** from the display preference
  (full name / first name only / anonymous → `null`), mirroring JGive's `name: null`.
  The DB column is `comment` (matches their field + the UI label "הערה"); it implements
  the brief's "dedication message".
- **No `donors` table.** Without accounts (out of scope) there's no identity key to dedupe
  on, and the card data is a per-donation snapshot. Clean upgrade path: add `donors` +
  nullable `donation.donor_id` later. (Full rationale in `docs/erd.md`.)
- **Realistic seeds without 3,170 rows:** `additional_amount_cents` /
  `additional_donors_count` (JGive's own "additional donations" idea) absorb the offline
  remainder so totals match the live page exactly.
- **Background jobs via Active Job on Sidekiq** (Redis-backed): creating a donation
  enqueues `CalcCommissionJob` (an Active Job; `queue_adapter = :sidekiq`) via
  `after_create_commit` — after-commit so the worker, in its own process, sees the
  committed row — which sets `commission_cents` to 10% of the amount. Redis is in
  docker-compose; `bin/dev` runs a `worker` (Sidekiq) process alongside web + esbuild;
  the Sidekiq dashboard is mounted at **`/sidekiq`** (no auth — protect behind admin in
  production). Tests use Active Job's `:test` adapter (no Redis); the enqueue spec runs
  non-transactionally so `after_commit` actually fires. *(Not in the brief — a
  background-processing demo.)*
- **Images via Active Storage** (mirrors JGive): campaign `banner` + `story_images` and
  charity `avatar` are attachments; GraphQL resolves them to relative
  `/rails/active_storage/blobs/redirect/...` URLs (`only_path: true`, so no host config) —
  the same URL shape JGive serves. Story HTML stores stable `campaigns/story/N.jpg` tokens
  rewritten to blob URLs by attachment order at read time. Seeds attach committed source
  images from `db/seeds/data/images/` (idempotently). No image variants (libvips isn't
  installed here) — originals are served; variants are a drop-in upgrade.
- **HTML sanitized at read time** (GraphQL resolver, allowlisted tags) so stored content
  stays raw and the allowlist can evolve without re-seeding.
- **CSRF:** token model (`protect_from_forgery :exception` + `csrf_meta_tags`); `gqlFetch`
  sends `X-CSRF-Token`. No `null_session`.
- **Conventional Rails routes** (`/campaigns/:id`) over JGive's custom `/donation-targets`.
- **npm over the scaffold's yarn** (corepack needs root here; npm ships with Node — less
  reviewer friction).

---

## Wiring a real payment provider (pending → paid)

Out of scope per the brief — submitting only creates a `pending` donation. Here's how I'd
take it to `paid`. I'll use **Stripe** for concreteness, but keep it behind a
provider-agnostic seam so the backend isn't Stripe-specific.

- [ ] **Provider port.** A `Payments::Provider` (`create_intent`,
  `verify_webhook`) with a `Payments::StripeProvider` adapter, so nothing outside the
  adapter depends on Stripe and a second method (e.g. Israeli **bit** via PayMe, which
  JGive also uses) can be added later. **Where it lives:** `app/services/payments/`
  (`provider.rb`, `stripe_provider.rb`, `handle_webhook.rb` → the `Payments::` namespace;
  `app/services` is the Zeitwerk root) + a thin `StripeWebhooksController`. The GraphQL
  mutation and the webhook controller talk to `Payments::Provider`, never to Stripe
  directly.

- [ ] **Start payment on submit (outbound, with an idempotency key).** `createDonation`
  still creates the `pending` donation, then creates a **PaymentIntent** for its
  `amount_cents` (amount set server-side, never trusted from the client) and returns the
  `client_secret`. The create call passes a deterministic **`Idempotency-Key`**
  (e.g. `intent:donation:<id>`) so a retried request can't create a second intent →
  no double charge.

- [ ] **Collect payment in the modal (best UX).** Render Stripe's **Payment Element**
  inside the existing donate modal (`<Elements clientSecret>` → `<PaymentElement>` →
  `stripe.confirmPayment({ return_url })`). Card stays in-flow (no redirect); 3-D Secure
  and redirect-based methods like bit still hand off as needed. Card fields live in
  Stripe's iframes → PCI SAQ A (card data never touches our server).

- [ ] **Webhook endpoint = source of truth.** `POST /webhooks/stripe`
  (`StripeWebhooksController`, CSRF-skipped — Stripe authenticates via signature):
  - read the **raw body**, **verify the `Stripe-Signature`** with the endpoint secret;
  - **dedupe inbound by `event.id`** (unique index) — Stripe may redeliver the same event;
  - on `payment_intent.succeeded` → `donation.update!(status: :paid, completed_at: Time.current)`
    (event-id record + update in one transaction); on `payment_intent.payment_failed` /
    `checkout.session.expired` → `:failed`;
  - return **2xx fast**; run side effects (receipt email, re-run `CalcCommissionJob`) async.

  The browser redirect/return is only UX — the **webhook** is authoritative, since the tab
  can close before returning.

- [ ] **Two idempotency guards, different directions:** the outbound `Idempotency-Key`
  prevents a duplicate **charge**; the inbound `event.id` store prevents applying the same
  confirmation twice (double `paid`, double email/commission).

- [ ] **Recurring** → Stripe subscription mode, capped by a `max_recurring_months`-style
  setting (JGive exposes `maxRecurringMonths: 36`).

- [ ] **Tighten the demo policy:** switch `Donation.countable` to **paid-only** (one-line
  change already isolated in the model) so pending donations stop counting publicly, and
  rate-limit `createDonation` (Rack::Attack).

**Why this needs almost no new modeling:** the `Donation` `status` enum
(`pending/paid/failed`) + `completed_at` already exist, and progress is **computed** from
`countable` — so flipping a donation to `paid` is reflected automatically, nothing else to
update. Local testing: the Stripe CLI (`stripe listen --forward-to localhost:3000/webhooks/stripe`,
`stripe trigger payment_intent.succeeded`).

---

## Deployment & infrastructure-as-code

**Live on Railway: https://web-production-bdbd1.up.railway.app** (managed Postgres + Redis
+ a separate Sidekiq worker, warm instances so the link responds immediately). Deploys from
the production `Dockerfile`; assets precompile via esbuild + propshaft. Production runs jobs
on **Sidekiq/Redis** (matching dev) and stores uploads on **Google Cloud Storage**.

**Continuous deployment.** Both services are connected to the GitHub repo
(`natanr123/jgive-home-assigmnet`, branch `main`) with **"Wait for CI" enabled**. So a push
to `main` → GitHub Actions runs `ci.yml` (scan / lint / RSpec / E2E) → Railway **auto-deploys
web + worker only when CI is green**. No manual `railway up` in the normal flow; rollbacks are
one click. Platform-native, CI-gated CD — no bespoke deploy script or deploy-from-Actions
token to maintain. (Turning Wait-for-CI on immediately surfaced a latent red `test` job — it
never built the SPA bundle, so `stylesheet_link_tag "application"` failed — which manual
deploys had been bypassing; fixed in `ci.yml`.)

**Infrastructure as code.** The whole project — services, databases, and variables — is
declared in **`.railway/railway.ts`** (Railway's native IaC; needs the `railway` SDK + a TS
loader, run via `NODE_OPTIONS=--import tsx`). Preview with `railway config plan`, apply with
`railway config apply`. It's the source of truth — it replaced the per-service `railway.toml`
(a service can't be managed by both). `railway config plan` is what makes changes safe: it
showed the exact diff (and caught a DB name-case mismatch that would have wiped the seeded
data) before any apply.

**Two services from one image:**
- **web** — Puma (via `bin/boot`) on a fixed port **3000**, with a **`/up` healthcheck**.
  The app doesn't read Railway's `$PORT`, so `PORT=3000` is set explicitly — that tells Railway
  which port to route *and* healthcheck, so `/up` is probed on 3000 (where Puma is) and the
  deploy promotes. (Getting this wrong was a whole saga: a healthcheck on the wrong port fails
  every deploy. The cleaner long-term form is to bind the server to `$PORT` directly.)
- **worker** — explicit `start: "bundle exec sidekiq"` declared in `railway.ts`; no port, no
  healthcheck. (Its service-level "config file" had to be cleared off `/railway.toml` before
  `railway.ts` could manage it.)

Both build the production `Dockerfile`, run `bin/rails db:prepare` as the pre-deploy command,
and gate on CI (`checkSuites: true` = wait-for-CI). `bin/boot` still dispatches web/worker by
`RAILWAY_SERVICE_NAME` (or `PROCESS_TYPE`) for the local / non-IaC path.

**Variables — deduped in `railway.ts`, not duplicated per service:**
- `DATABASE_URL` / `REDIS_URL` → referenced from the `Postgres` / `Redis` resources.
- `GCS_PROJECT` / `GCS_BUCKET` → shared consts.
- `RAILS_MASTER_KEY` / `GCS_KEYFILE_JSON` → secrets kept **out of source** via `preserve()` on
  `web` (so `railway.ts` declares them but never stores the values); the **worker references
  web's copy** (`web.env.RAILS_MASTER_KEY`), so each value lives in exactly one place. Set the
  two secret *values* once, directly on the `web` service (piped from their canonical sources,
  never echoed):
  ```bash
  railway variables --service web --set-from-stdin RAILS_MASTER_KEY < config/master.key
  railway variables --service web --set-from-stdin GCS_KEYFILE_JSON < ~/.config/gcloud-keys/<key>.json
  ```
- Redis: set **`maxmemory-policy noeviction`** (Sidekiq requirement — eviction drops jobs).

Active Storage → GCS is wired in `config/storage.yml` (`:google`) +
`config/initializers/gcs_credentials.rb`, which materialises `GCS_KEYFILE_JSON` into a keyfile
for Application Default Credentials.

**Alternatives:** the retained `Dockerfile` + **Kamal** config deploy to any container host
/ VPS; a Heroku-like PaaS mirrors JGive's real hosting. Solid Queue/Cache/Cable remain
available as a Redis-free fallback (swap the adapters in `config/environments/production.rb`).

---

## Deliberate scope cuts

Per brief: no payment/checkout, no accounts/login/admin, no production hardening. Also cut
(and why): ambassadors/groups/updates tabs (whole product features — disabled stubs),
multi-currency & locale switcher (ILS/he only; the tax-flags row is visual), the
site's "amount-hidden" privacy axis (the brief defines its own three options), donations
search/sort (load-more only), עיגול לטובה, video hero, heart counts. SSR is not attempted
(their page is CSR too); our shell at least serves a real title/meta.

Beyond the brief (built anyway, flagged): a **campaign edit page** (`/campaigns/:id/edit`)
with image upload, the **commission background job**, and the **Sidekiq dashboard**.

---

## Setup, thought process & AI workflow

Tools: **Claude Code** (Opus) with the **Playwright MCP** for reverse-engineering, plus
adversarial multi-agent review passes over the plan.

Approach: I reverse-engineered the live page first — captured its GraphQL operations and
responses, fingerprinted the router from `history.state`, and pixel-sampled the brand
colors (artifacts in `docs/research/`). I wrote a plan, had AI judge panels critique it
(assignment-fit / Rails / React / feasibility) and folded the findings back in, then built
in commit-sized milestones, verifying each in a real browser before committing.

Where AI helped: the broad reverse-engineering sweep, catching real bugs in the plan before
coding (e.g. `RouterProvider` must import from `react-router/dom`; `location.state` would
break a mid-flow refresh → switched to URL search params; the `.gitignore` would have
swallowed `.env.example`). Where it needed steering: it initially mislabeled the stack as
"Next.js SSR" from the URL shape — I had it verify against the actual bundle, which
disproved it (plain React + webpack, CSR).

Process docs (git-ignored under `tmp/`, copied to `docs/` for review):
`docs/plan.md`, `docs/erd.md` (+ `docs/erd.png`), `docs/research/`. The full LLM transcript
is included with the submission per deliverable #4.
