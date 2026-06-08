# הגן הכתום — JGive campaign donation page

A reproduction of the live JGive campaign donation page
([donation-targets/159183](https://www.jgive.com/new/he/ils/donation-targets/159183),
campaign **"הגן הכתום"**) — the part a donor sees and interacts with, up to (but not
including) payment.

Built as a **Rails 8 + GraphQL backend serving a React 19 + React Router v7 SPA** — the
same shape as JGive's real production app, with the Router v5→v7 modernization they have
not shipped. RTL Hebrew throughout.

> **Live URL:** _deferred — see [Deployment](#deployment)._ Deploy is mandatory per the
> brief but the app is built local-first at the reviewer's request; it is deploy-ready.

---

## Run it locally

**Prerequisites:** Ruby 3.4.7, Node 20+, Docker (for Postgres + Redis).

```bash
cp .env.example .env          # local DB + Redis config (consumed by compose AND Rails)
docker compose up -d          # Postgres 17 (:5432) + Redis 7 (:6379), healthchecked
bin/setup                     # bundle + npm install + build + db:prepare + db:seed, then bin/dev
```

`bin/setup` ends by launching `bin/dev`, which runs **all three** processes from
`Procfile.dev` — Puma (web), esbuild (`js`, `--watch`), and **Sidekiq (`worker`)**.
Then open **http://localhost:3000** — `/` redirects to the seeded campaign.

Already set up? Just `bin/dev`.

### The background queue (Sidekiq)

`bin/dev` already starts the Sidekiq worker, so the commission job runs automatically.
To run (or restart) the worker on its own:

```bash
bundle exec sidekiq           # needs Redis up (docker compose up -d) and a .env
```

The Sidekiq dashboard — queues, processed/failed counts, retries — is at
**http://localhost:3000/sidekiq** (unauthenticated; protect behind admin in production).
Without a running worker, donations are still created and jobs just sit in Redis until a
worker drains them.

### Tests

```bash
bundle exec rspec     # Ruby: models + GraphQL request specs
npm run typecheck     # TypeScript (esbuild strips types; this is the real check)
npm run build         # build the SPA bundle (prereq for E2E)
npm run e2e           # Playwright end-to-end (starts/​reuses the server, waits on /up)
```

---

## What's here

- **Campaign page** (RTL, tabs): hero cover, progress (raised / goal / % / donor count
  with the orange-heart marker), donate CTA, and tabs mirroring the original —
  **על הפרויקט** (story + charity card), **תרומות אחרונות** (donor cards, load-more),
  **על העמותה**; ambassadors/groups/updates are disabled stubs (see [cuts](#deliberate-scope-cuts)).
- **Donation flow** (URL-routed modal): amount step (presets + custom, one-time vs
  recurring, optional comment, display preference) → details step → submit. Submitting
  **creates a `pending` donation and updates the campaign's progress**. No payment.
- **Seeds:** the real campaign with real story/charity copy and donor entries, reconciled
  to the live totals (₪993,188 / 3,170 donors); plus a second synthetic campaign.

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
- **Solid Queue/Cache/Cable** stay (Rails 8 defaults) but are unused; deploy would
  provision their DBs or switch adapters.

---

## How I'd wire payment (pending → paid)

Out of scope here, but the design is ready for it:

1. A provider-agnostic `PaymentProvider` port; first adapter **Stripe** (JGive uses Stripe
   + Israeli **bit** via PayMe hosted fields).
2. On `createDonation`, create a Stripe **Checkout Session** for the pending donation and
   return its URL; the SPA redirects the donor there (this replaces the deferred
   `details → payment` step).
3. A **webhook** (`checkout.session.completed`), **idempotent by event id**, runs
   `donation.update!(status: :paid, completed_at: Time.current)`.
4. Progress flips automatically — it's computed from `countable`, nothing else to touch.
5. Recurring donations → Stripe subscription mode, capped by a `max_recurring_months`-style
   setting (JGive exposes `maxRecurringMonths: 36`).

---

## Deliberate scope cuts

Per brief: no payment/checkout, no accounts/login/admin, no production hardening. Also cut
(and why): ambassadors/groups/updates tabs (whole product features — disabled stubs),
multi-currency & locale switcher (ILS/he only; the tax-flags row is visual), recurring
**billing mechanics** (the one-time/recurring *choice* is a working stored field), the
site's "amount-hidden" privacy axis (the brief defines its own three options), donations
search/sort (load-more only), עיגול לטובה, video hero, heart counts. SSR is not attempted
(their page is CSR too); our shell at least serves a real title/meta.

---

## What I'd do with more time

- Real Stripe sandbox integration end-to-end (the wiring above).
- Accounts + a `donors` table (the ERD upgrade path), enabling dedupe and donor history.
- A Vitest/React Testing Library component layer (currently covered by request + E2E specs).
- `GraphQL::Dataloader` if the schema grows; cursor pagination for donations.
- The site's amount-hidden privacy mode; donations search/sort/filter.
- An accessibility audit pass; Active Storage **variants** (resize/`srcset`) once libvips
  is available, and **image upload** on the edit page (multipart) so cover/story images
  are editable — matching JGive's upload-backed media; Action Text for the story.
- SSR via Inertia or RR framework-mode (trade-offs vs the Rails backend).

---

## Deployment

Mandatory per the brief, deferred at the reviewer's request until local was solid. The app
is deploy-ready: production `Dockerfile` + Kamal config are retained; assets precompile via
esbuild + propshaft. Before submission: pick a platform (Heroku-like PaaS mirrors JGive's
real hosting; the Kamal/Dockerfile path fits any container host), provision Postgres,
set `RAILS_MASTER_KEY`/`DATABASE_URL`, and decide the Solid Queue/Cache/Cable adapters.
See `tmp/plans/step-10.md` for the checklist.

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
