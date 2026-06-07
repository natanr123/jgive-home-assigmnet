# JGive Campaign Donation Page — Research & Build Plan (v2)

Reproduces https://www.jgive.com/new/he/ils/donation-targets/159183 (campaign "הגן הכתום")
per the home assignment in `tmp/prompots/jgive-backend-home-assignment.md.pdf`.

> **v2 premise change:** the assignment assumes LLM-assisted development — build-hours
> are not the constraint; *judgment, coherence, and review surface* are. v1's
> Hotwire-monolith plan optimized for a 4–6h hand-build; v2 instead **matches JGive's
> real architecture** (Rails serving a React SPA + GraphQL from one origin) and
> **modernizes it**: React 19 + React Router v7 — the v5→v7 migration they never did.
>
> v1 was reviewed by a 4-judge adversarial panel; carried-over sections keep those fixes.
> v2 gets its own panel pass after this rewrite.

---

## 1. Research findings (reverse-engineering the live page)

### 1.1 Their tech stack (evidence-based)

| Layer | Tech | Evidence |
|---|---|---|
| Frontend | **React 18+ SPA, client-side rendered** (webpack, CRA-style build, CSS modules) — *not* Next.js, *no* SSR | Shell HTML only: static `<title>Jgive</title>`, `<div id="root">`, campaign content absent from raw HTML; bundles `/client/static/js/runtime~main.[hash].js` + numbered chunks, `webpackChunk` global; CSS-module class names (`Tab-module__tab___olcXD`); no `__NEXT_DATA__` / `/_next/`; `#root` mounted via `createRoot` (`__reactContainer$` key) |
| Routing | **React Router v5 generation** (client-side, `history@4`) | After in-app navigation `history.state = { key: "qcjtxd" }` — bare 6-char key, no `usr`/`idx` (v6+ shape); no `window.__reactRouterVersion` stamp; `history.listen` in vendor chunk. Modal flow is URL-routed: `/donate/amount` → `/donate/personal-details`, server returns the identical shell for deep URLs (verified by diff — only New Relic timing differs) |
| API | **GraphQL** at `https://www.jgive.com/graphql` (same origin) | Operations captured: `GetDonationTarget`, `GetCampaignBannerDonationTarget`, `GetDonationTargetTabs`, `GetRecentDonations`, `CharityMetrics`, `CurrentEmployee`, `I18n` |
| Backend | **Ruby on Rails** + Active Storage | Image URLs: `/rails/active_storage/representations/redirect/...`; page response carries `x-runtime` (Rack/Rails middleware) |
| Hosting | **Heroku** behind **Cloudflare**; one origin serves shell + `/client/` static build + `/graphql` | `via: 2.0 heroku-router`, `server: cloudflare`, `heroku-nel` reporting |
| Payments | Stripe (`m.stripe.com`, `provider: stripe`) + Israeli **bit** (PayMe hosted fields: `cdn.payme.io/hf/v1/hostedfields.js`) | GraphQL `activeCharityOrganizationPaymentMethods`, script tags |
| Other | Segment, New Relic, Intercom, OneTrust, GTM/GA, nagich.co.il (accessibility) | network requests |

So the real product is a **Rails monolith serving a client-rendered React SPA + a GraphQL
endpoint from one origin**. React was upgraded over the years (modern `createRoot`) but
**their currently-shipped bundle still routes with the v5 generation** (we can only see
the deployed bundle, not their codebase or roadmap — the claim is bounded to what ships
today). **That v5→v7 jump is the modernization we demonstrate** (§2).
*(Correction history: an earlier draft claimed "Next.js, SSR" — disproved by direct
fetch: no Next.js markers, no server-rendered content.)*

### 1.2 The page structure (desktop, RTL Hebrew)

1. **Header/nav** — JGive logo, nav links, locale/currency switcher (`HE | ILS`), pink CTA.
2. **Hero** — full-width cover (video thumbnail with play button), campaign logos overlaid.
3. **Progress section** —
   - raised: **‏993,188 ₪** (green `#008043`, huge bold ~65px)
   - **20% גויסו** (percent raised)
   - progress bar (green fill, gray track) with an **orange heart marker** at the tip
   - **מספר תורמים: 3,170** · **יעד: 5,000,000 ₪**
4. **Title block** — `h3` **הגן הכתום**, subtitle **לזכר בני משפחת ביבס וילדי ה-7 באוקטובר**.
5. **CTA block** — teal **bit** button + magenta **לתרומה** button (radius 24px),
   tax-deduction row "תרומה מוכרת לזיכוי מס:" with **four flags (US/IL/UK/CA)** — matches
   GraphQL `acceptedCurrencies: [ILS, USD, CAD, GBP]` — and share buttons
   (copy-link "העתקת קישור", Facebook, WhatsApp, X).
6. **Tabs** (buttons, active = underline): על הפרויקט · תרומות אחרונות · לוח שגרירים · קבוצות · על העמותה · עדכונים
7. **Tab content**:
   - **על הפרויקט** — rich-HTML story (headings, paragraphs, emoji bullets, images) +
     sidebar card, heading **"ליצירת קשר עם העמותה:"** with exact labels
     **אי-מייל / מספר טלפון / כתובת אתר / מספר עמותה** (580689537), a **"הידעת?"**
     tax note, and link **עברו לדף העמותה**.
   - **תרומות אחרונות** — search box (placeholder **חיפוש**), filter dropdown (label
     **סנן לפי**, selected value **הכי עדכני**), grid/list toggle; donation cards:
     amount (₪180), donor name (or none = anonymous), relative time (לפני כשעתיים),
     optional comment.
8. **Footer** — site-wide links.

Brand tokens (pixel-sampled from screenshots): magenta CTA `#D426FF` (sampled #D427FF,
within JPEG tolerance), raised-green `#008043` (exact), bit-teal `#004952`.
Font: **Simona** (proprietary). RTL is per-component (html `dir` stays ltr; we'll do it
properly with `dir="rtl"`).

### 1.3 The donation flow (modal over the page, URL-routed by their client router)

- `…/donate/amount` — step 1 "פרטי התרומה שלי":
  - frequency radios: **תרומה חד-פעמית** (default) / **הוראת קבע** (recurring)
  - currency selector (ILS)
  - preset amount cards (radio), each with an impact label:
    - ‏180 ₪ — נטיעת עץ
    - ‏360 ₪ — נטיעת 2 עצים 🧡 הכי נבחר
    - ‏720 ₪ — נטיעת 3 עצים - לזכרם
    - ‏1,800 ₪ — בונים מרחב לילדים
    - ‏5,000 ₪ — בוני הגן הכתום
    - **סכום אחר** (custom amount)
  - checkbox **רוצה להוסיף הערה?** → reveals textarea, placeholder
    "הערה זאת תוצג בקמפיין..." (source: `.playwright-mcp/page-…17-26-44….yml`)
  - dropdown **אני רוצה שבעמוד הפרויקט יופיע:** with options + explainer lines
    (source: `.playwright-mcp/page-…17-26-16….yml`, dropdown captured open):
    1. השם שלי וסכום התרומה — "עודדו את כולם לתרום כמוכם"
    2. רק השם שלי — "שתפו שהתחברתם ליעד והחלטתם לתרום"
    3. רק סכום התרומה — "הישארו אנונימיים"
  - עיגול לטובה opt-in (out of our scope)
  - footer: **סכום התרומה שלך** + total + **המשך** (disabled until amount chosen)
- `…/donate/personal-details` — step 2 "פרטים אישיים": מייל\*, שם פרטי\*, שם משפחה\*,
  מספר טלפון\*, payment-method radios (כרטיס אשראי / תשלום עם bit / הצג עוד), consent
  checkboxes, המשך → payment (out of scope).
  *(Source: `tmp/screenshots/jgive-personal-details-step2.yml` — persisted accessibility
  snapshot, re-captured after the panel flagged the original capture as unpersisted.)*

**Layout vs. assignment wording (flagged):** the PDF lists title/cover/goal/raised/progress
as "organized into tabs", but on the real page those live in the **header** (hero,
progress, title blocks) and only story/donations/org content sits in tabs. We follow the
real page (the assignment's own reference and its "clearly resemble the original" bar) —
a deliberate, documented reading, covered by the "improvements allowed if explained" clause.

### 1.4 Their data model (from GraphQL responses — raw JSON saved in repo)

`DonationTarget` (campaign): `name`, `descriptionTitle`, `descriptionContent` (HTML),
`goalProperty { goalType: amount, amount: 5_000_000 }`,
`donationTargetSummary { totalAmount: 993187.72, donationsPlusAdditionalDonationsCount: 3170, recurringDonationsCount: 8 }`,
`featureSet { purposes, customAmount, donationOccurrence: oneTimeAndRecurring, maxRecurringMonths: 36, igulLetova }`,
`visualPropertySet { showGoal, showTotal, showPercentage, showComment, showRecentDonationsTab, preselectRecurring }`,
`charityOrganization { name: ונטעת, email, phoneNumber, url, charityNumber: 580689537, about (HTML), avatar, featureCollection { dedicationEnabled: true, igulLetovaEnabled } }`,
`bitEnabled`, `acceptedCurrencies`, `donatable`.

**Accuracy note (panel-corrected):** `featureSet.dedication` is **false** on this
campaign. The note shown on donation cards is the `comment` field, displayed because
`visualPropertySet.showComment: true` (+ org-level `dedicationEnabled: true`). We build
the optional message because **the assignment requires it**.

`RecentDonation`: `name` (**null = anonymous**), `amountCents`/`humanizedAmount`
(**also nullable — second privacy axis: name shown, amount hidden**: 7 of 20 captured
rows), `amountCurrency`, `recurring`, `comment`, `completedAt`, `heartCount` —
sorted `completed_at_DESC`, paginated (`page/perPage`, `totalCount`).

Note `donationsPlusAdditionalDonationsCount`: they track **additional/offline donations**
besides on-platform ones — used for realistic seeding (§7).

Saved artifacts (in `tmp/screenshots/`, git-ignored): `gql-donationTarget.json`,
`jgive-recent-donations.json`, `jgive-graphql-*-req.json`, screenshots `jgive-*.jpeg`;
accessibility snapshots in `.playwright-mcp/`. Anything seeds need (story HTML, cover
image) gets copied into `db/seeds/data/` during milestone 2. ERD: `tmp/erd.md` (+ png/svg).

---

## 2. Architecture: their shape, modernized

**Decision (user-directed):** reproduce JGive's actual production architecture —
**one Rails app serving a React SPA shell, its static build, and a GraphQL endpoint** —
and perform the modernization they never did. With LLM-assisted development, the v1
time-based argument for Hotwire no longer binds; what remains is the interview story:
*"we rebuilt your page on your real architecture, with the Router v5→v7 migration and
the data-layer cleanup it unlocks."*

**Assignment-fit note (kept honest):** the PDF says "small Rails app" and warns that "a
focused, well-reasoned submission beats a sprawling one". This still is one Rails app —
it owns the domain, the data, the API, and serves everything; React replaces the view
layer exactly as in JGive's production app. The README pre-empts the "over-built for a
take-home?" question head-on: every added layer is tied to a concrete reproduction or
modernization payoff (and the deliberately-NOT-added list — Apollo, Redux, i18n
framework, Vite, SSR — is named), and v1 (Hotwire) is documented as the considered
alternative. Judgment shown, not skipped.

### 2.1 The modernization ledger — "the migration they never did"

| Theirs (verified, v5-era) | Ours (v7 idiom) |
|---|---|
| `BrowserRouter` + `<Switch>`/`<Route>` (history@4, `{key}` state) | `createBrowserRouter` + `<RouterProvider>` — **imported from `react-router/dom`** (the v7 package split: DOM-wired provider lives in the `/dom` subpath; everything else — `createBrowserRouter`, `Form`, `useLoaderData`, `useFetcher`, `redirect` — from `react-router`). The classic v7 migration footgun, called out deliberately |
| Data fetching in components (effects / client wrappers around `POST /graphql`) | **Route loaders** — `loader` fetches `GetCampaign` before render; no spinner-cascade |
| Form submit → imperative fetch + manual state sync (their progress header updates via re-query) | **Route action** — `<Form method="post">` to the donate route; on success the action `return redirect(...)`s to the thank-you **route**, and the router **auto-revalidates** the campaign loader → progress/donor-count update with zero manual plumbing |
| URL-routed modal steps (`/donate/amount`, `/donate/personal-details`) reimplemented per-step | **Nested routes** render the modal inside the page route's `<Outlet>` — deep-linking, back-button between steps, refresh-keeps-modal, for free. **Wizard state lives in URL search params** (not `location.state`, which dies on refresh/deep-link) |
| CRA-style webpack build (`/client/static/js/runtime~main…`) | **esbuild** via the already-scaffolded jsbundling-rails (Rails 8 core convention; no second dev server — deliberately *not* Vite). `.tsx` needs no loader flag (auto by extension); entry pointed explicitly at `application.tsx` |
| webpack CSS modules (`Tab-module__tab___olcXD`) | **CSS modules via esbuild** — the `local-css` loader is built-in and auto-applies to `*.module.css`; esbuild emits `application.css` to `app/assets/builds`, linked via `stylesheet_link_tag` in the shell |
| React 18 `createRoot` (already modern) | React 19 `createRoot` (kept) |
| Apollo-style client cache (implied) | **None** — Router v7 loaders/actions own fetching; **router revalidation is our cache-invalidation strategy**. Right for a one-data-rich-route app (a multi-view app with shared entities would justify a normalized cache); a 20-line `gqlFetch` wrapper replaces a client library |

### 2.2 What we copy vs. diverge (carried from v1, still true)

| Their pattern | Our adoption |
|---|---|
| Domain naming: DonationTarget, RecentDonation, CharityOrganization | Models: `Campaign`, `Donation`, `CharityOrganization`. SPA routes **Rails-conventional**: `/campaigns/:id` (user rule: convention over their custom `/donation-targets` path) |
| Money as integer cents + currency | `amount_cents` integer + `currency` string |
| `name: null` ⇒ anonymous donor display | `displayName` resolved server-side at the GraphQL layer from preference + names |
| Donation card note = `comment` field | column named `comment` (implements the assignment's "dedication message") |
| Offline/"additional" donations in totals | `additional_amount_cents` / `additional_donors_count` on `Campaign` |
| GraphQL API, same origin | **graphql-ruby** (gem inferred — Rails backend), deliberately small: **2 queries + 1 mutation**, converging their 7 page operations (§4) |
| Two-step URL-routed donate modal | **In scope in v2** (nested routes make it natural): `/donate/amount` → `/donate/details` |
| Donations pagination (`page/perPage`) | "Load more" on the recent-donations tab |

**Deliberate divergences (flagged):**

- **Display preference**: assignment's options (full name / first-name-only / anonymous)
  win over the site's (name+amount / name-only / amount-only). The site's amount-hidden
  axis stays a cut.
- **Payment step**: modal ends after details ⇒ donation created `pending` (assignment).
- **No Apollo/urql, no Redux, no i18n framework**: loaders + component state + a typed
  Hebrew strings module (`he.ts`). One locale, RTL-first — `Intl.RelativeTimeFormat('he')`
  does the "לפני כשעתיים" relative times natively (drops v1's rails-i18n need).

---

## 3. Data model

**Unchanged from v1** — the ERD survives the frontend pivot untouched (see `tmp/erd.md`
+ rendered `tmp/erd.png`): `charity_organizations 1—∞ campaigns 1—∞ donations`,
integer-cents money, three string enums on donations (`frequency`, `status`,
`display_preference`), derived (never stored) `raised_cents / donors_count / percent`
via one `pick(SUM, COUNT)` round-trip, `additional_*` columns absorbing the real
₪993,188 / 3,170 totals, no donors table (rationale in erd.md — snapshot semantics,
no identity key without accounts, clean upgrade path).

The only v2-visible change: aggregates are exposed through GraphQL types instead of
ERB partials.

---

## 4. Backend behavior (Rails + graphql-ruby)

```ruby
# routes.rb — conventional; specific routes first, catch-all LAST (ordering is the
# real guard; the constraint is belt-and-braces with segment boundaries, not prefixes)
post "/graphql", to: "graphql#execute"
get  "up" => "rails/health#show", as: :rails_health_check
root "shell#show"
get "*path", to: "shell#show", format: false,
    constraints: ->(req) { req.path !~ %r{\A/(rails|assets|graphql|up|cable)(/|\z)} }
```

The `/assets` exclusion is **load-bearing**: propshaft serves the esbuild output
(`app/assets/builds` → digested `/assets/...`); if the catch-all swallowed it, the shell
would render but the JS/CSS would 404. A request spec proves `/up`,
`/rails/active_storage/*`, and `/assets/*` are not captured.

### How our schema converges their operations

For this *one page*, JGive's client fires **seven** distinct GraphQL operations (captured
in the network log). We deliberately collapse those into **2 queries + 1 mutation** —
folding their three campaign-shaped reads into one `campaign` query, keeping the
donations read ~1:1, and cutting what's out of scope. This is a *divergence* (a
"judgment over completeness" simplification), not a copy: their endpoint shape is theirs,
the small schema is ours. (graphql-ruby itself is *inferred* — their backend is Rails, so
it's the overwhelmingly likely gem, but server-side gems aren't observable from outside.)

| Their operation (verified) | What it loads | Converges to (ours) |
|---|---|---|
| `GetDonationTarget` | core campaign object | **`campaign(id)`** query |
| `GetCampaignBannerDonationTarget` | hero/banner variant | folded into `campaign(id)` |
| `GetDonationTargetTabs` | tab contents (story, etc.) | folded into `campaign(id)` (`storyHtml` + `charityOrganization`) |
| `GetRecentDonations` | paginated donor list | **`recentDonations(campaignId, page, perPage)`** query (kept ~1:1) |
| `CharityMetrics` | org financial stats | **cut** — no metrics in scope |
| `CurrentEmployee` | logged-in user / matching | **cut** — no accounts/matching |
| `I18n` | server-sent translations | **cut** — one locale, client-side `he.ts` |
| *(donation/payment mutations — not reached, pre-payment)* | submit a donation | **`createDonation(input)`** mutation → `pending` |

- `ShellController#show` — renders the minimal layout: real `<title>`/meta (improvement
  over their static "Jgive" title), `dir="rtl" lang="he"`, `<div id="root">`,
  `javascript_include_tag "application", type: "module"` **and**
  `stylesheet_link_tag "application"` (the esbuild-emitted CSS bundle — without the link,
  CSS modules produce no styles at all).
- **GraphQL schema (deliberately small, mirrors their ops):**
  - `query campaign(id: ID!): Campaign` ≈ their `GetDonationTarget` — **nullable**:
    unknown id ⇒ `null` + top-level error (the cleaner GraphQL "404"; both shapes
    request-spec'd). `CampaignType`: name, subtitle, storyHtml, coverImageUrl,
    goalAmountCents, currency, `presetAmounts: [PresetAmount!]!`,
    `stats { raisedCents donorsCount percent }`, `charityOrganization { … }`.
  - `query recentDonations(campaignId: ID!, page: Int, perPage: Int)` ≈ their
    `GetRecentDonations` — returns `{ donations: [DonationType], totalCount, nextPage }`;
    `DonationType`: displayName (server-resolved; null ⇒ anonymous), amountCents,
    currency, recurring (**derived: `frequency == "monthly"`** — enum→bool at the API
    boundary, matching their schema), comment, createdAt, **pending (Boolean — exposed
    deliberately**, see policy below; the raw status enum stays internal).
  - `mutation createDonation(input: { campaignId, amountCents, frequency,
    donorFirstName, donorLastName, displayPreference, comment })` → `{ donation, errors }`
    — creates `pending`; validation errors returned as user-facing messages
    (mutation-level errors, not raised).
- **N+1s handled explicitly** (graphql-ruby does nothing by default): the campaign query
  eager-loads (`includes(:charity_organization)`); `recentDonations` selects only
  donation columns (displayName/pending are derived, no associations). If Active Storage
  ever serves the cover, `with_attached_*` joins the blob. `GraphQL::Dataloader` is the
  named upgrade path if the schema grows — README notes it.
- **Story HTML sanitized at READ time** (resolver-level, via `Rails::HTML5::SafeListSanitizer`),
  allowlist widened to what the real story actually contains:
  `h2 h3 h4 p br strong b em i ul ol li a[href]` (+ `rel="noopener" target` hardening).
  Read-time means stored content is preserved and the allowlist can evolve without
  re-seeding.
- **Pending-donation policy (refined per panel):** pending counts toward displayed
  progress (assignment: submit must update progress — isolated in `Donation.countable`,
  paid-only is a one-word flip) **and** pending donations appear in the public list
  **labeled** with a small "ממתין לאישור" badge (driven by the deliberate
  `pending: Boolean` field). Honest demo: the reviewer sees the state machine working,
  nothing is silently inflated. README states the production posture: count paid only,
  hide pending from the feed, rate-limit `createDonation` (Rack::Attack) behind a
  payment intent.
- **CSRF — one coherent model (panel fix):** keep Rails' default
  `protect_from_forgery with: :exception` + `csrf_meta_tags` in the shell;
  `gqlFetch` reads the meta token and sends `X-CSRF-Token` on every POST. Token-based,
  no `null_session` caveats — the most defensible setup for a same-origin SPA.
- Introspection enabled in dev/test only (request-spec'd as disabled for production env).
- `stats.percent`: `goal.zero? ? 0 : [floor(raised*100.0/goal), 100].min` for display;
  raw raised/goal exposed too. Zero-goal and over-goal model specs.

## 5. Frontend behavior (React 19 + Router v7 + TypeScript)

```
app/javascript/
├── application.tsx          # createRoot + RouterProvider (from "react-router/dom")
├── router.tsx               # createBrowserRouter — the v7 data router
├── css-modules.d.ts         # ambient type for *.module.css imports
├── lib/gql.ts               # 20-line fetch wrapper for POST /graphql (+ X-CSRF-Token from meta)
├── lib/format.ts            # ₪ (Intl.NumberFormat); relative time = pickUnit() + Intl.RelativeTimeFormat('he')
├── locales/he.ts             # typed Hebrew UI strings (exact labels from §1)
├── routes/
│   ├── campaign.tsx          # loader: GetCampaign; page layout + <Outlet/> for modal
│   ├── donate-amount.tsx     # nested: step 1 (presets/custom/frequency/comment/preference)
│   ├── donate-details.tsx    # nested: step 2 (names) + action: CreateDonation mutation
│   └── donate-thanks.tsx     # nested: thank-you ROUTE (refresh/deep-link safe)
└── components/
    ├── Hero.tsx  ProgressBar.tsx  CtaBlock.tsx  Tabs.tsx
    ├── AboutTab.tsx  CharityTab.tsx  RecentDonationsTab.tsx  DonationCard.tsx
    └── DonateModal.tsx       # native <dialog> chrome shared by the steps
*.module.css per component    # esbuild CSS modules — same pattern as theirs
```

- **TypeScript setup stated up front** (esbuild *strips* types, it never checks them):
  `tsconfig.json` (`jsx: react-jsx`, `strict`, `moduleResolution: bundler`, `noEmit`),
  the `css-modules.d.ts` shim, and a separate `yarn typecheck` (`tsc --noEmit`) script —
  type-checking is a CI/dev step, not part of the esbuild build.
- **Router map** (conventional paths per user rule):
  - `/` → redirect to the featured campaign
  - `/campaigns/:id` — loader runs `GetCampaign` (+ first page of `recentDonations`)
  - `/campaigns/:id/donate/amount` — modal step 1. **Wizard state lives in URL search
    params** (`?amount=18000&frequency=one_time&pref=full_name&comment=…`) — survives
    refresh, deep-link, and back/forward; `location.state` explicitly rejected (null on
    fresh document loads, would strand step 2)
  - `/campaigns/:id/donate/details` — step 2 reads the params; **route action** posts
    `CreateDonation`; on success the action **`return redirect("../thanks")`** —
    a redirect from an action still triggers loader revalidation, so
    progress/donor-count/cards refresh automatically — the v7 replacement for their
    manual re-query
  - `/campaigns/:id/donate/thanks` — real route: refreshable, deep-linkable, back-button
    correct (a component-state "thank you" would be the v5-era pattern we're migrating away from)
- Tabs = component state (matches original behavior — their tabs don't change the URL).
- **Load-more (recent donations) via `useFetcher` — with the merge stated, not hand-waved:**
  `fetcher.data` *replaces* on each load, so the tab keeps
  `const [pages, setPages] = useState([loaderPage1])`, appends `fetcher.data.donations`
  per load, dedupes by id. After a donation is created (loader revalidation), accumulated
  pages **reset to page 1** — simplest honest behavior, documented.
- Validation UX mirrors original: continue disabled until amount chosen; server errors
  from the mutation rendered inline.
- **Modal = native `<dialog>`** (focus trap + ESC for near-free): a small effect syncs
  `dialog.showModal()/close()` to the nested route's mount/unmount and maps `cancel`
  to `navigate(-1)`. Focus-return on close handled explicitly — a11y is a scoped task,
  not assumed free.
- Relative times: `Intl.RelativeTimeFormat('he')` + a tiny `pickUnit(diffMs)` helper.
  Output is exact ("לפני שעתיים"), not the site's fuzzy "לפני כשעתיים" — accepted,
  slightly-cleaner divergence (noted).
- Accessibility: `role=tab`/`aria-selected`, labeled inputs, `aria-valuenow` progress bar.
- Visual fidelity restored from v1 cuts (time no longer binds): orange-heart progress
  marker, flags row, bit button (disabled, "לא פעיל בדמו"), share row with copy-link.
  Font: **Heebo** (closest free Hebrew sans to their proprietary Simona — noted change).

## 6. Dev environment (per instructions; unchanged from v1 where possible)

- **docker-compose.yml** — single `db` service, `postgres:17-alpine`, variables from
  **`.env`** (compose reads it natively): `POSTGRES_USER/PASSWORD/DB`, `DB_PORT`,
  named volume, `pg_isready` healthcheck. App runs on host (`bin/dev`: Puma + esbuild
  `--watch`); only the DB is containerized, as instructed.
- **`.env`** (git-ignored) + **`.env.example`** committed. **⚠ Blocker caught by panel:**
  the scaffold's `.gitignore` has `/.env*` with **no negation** — `.env.example` would be
  silently swallowed. Milestone 1 adds `!/.env.example` right after that line and
  verifies with `git check-ignore -v .env.example` (must report no match).
- `config/database.yml` dev/test — inlined (panel fix: no dangling cross-references):
  ```yaml
  development:
    <<: *default
    host: <%= ENV.fetch("DB_HOST", "localhost") %>
    port: <%= ENV.fetch("DB_PORT", 5432) %>
    username: <%= ENV["POSTGRES_USER"] %>
    password: <%= ENV["POSTGRES_PASSWORD"] %>
    database: <%= ENV.fetch("POSTGRES_DB", "jgive_home_assigment_development") %>
  test:
    <<: *default
    host: <%= ENV.fetch("DB_HOST", "localhost") %>
    port: <%= ENV.fetch("DB_PORT", 5432) %>
    username: <%= ENV["POSTGRES_USER"] %>
    password: <%= ENV["POSTGRES_PASSWORD"] %>
    database: jgive_home_assigment_test   # fixed literal — never POSTGRES_DB
  ```
- **Scaffold-leftover cleanup (milestone 1, explicit — or the first build checkpoint fails):**
  delete `app/javascript/application.js` + `app/javascript/controllers/` (Turbo/Stimulus
  imports that would break the bundle once the gems go); point the esbuild script at the
  **single explicit entry** `app/javascript/application.tsx` (not the `*.*` glob); strip
  `data-turbo-track` attributes when repurposing `application.html.erb` into the shell
  layout; **one CSS path**: esbuild emits `application.css` (CSS-modules output) into
  `app/assets/builds`, the shell links exactly that — the scaffold's separate
  propshaft stylesheet entry goes away (a thin reset can live in a `base.css` imported
  into the bundle).
- **Gemfile deltas:** add `graphql`, `dotenv-rails`, `rspec-rails`, `factory_bot_rails`;
  **remove** `turbo-rails`, `stimulus-rails`, `jbuilder`, `capybara`,
  `selenium-webdriver` (dead weight in an SPA + Playwright app; honest Gemfile beats
  scaffold leftovers). `solid_queue/cache/cable` stay but README notes they're unused
  here and that deploy either provisions their extra DBs or flips the adapters —
  not "purely harmless", just deferred with deployment.
- **package.json:** `react`, `react-dom`, `react-router` (v7 — `RouterProvider` imported
  from `react-router/dom`), `typescript` + `@types/react{,-dom}`, `@playwright/test`;
  esbuild already present via jsbundling. **No loader flags needed** — `.tsx` and
  `*.module.css` (local-css) are handled natively by extension; scripts gain `typecheck`
  (`tsc --noEmit`) and `e2e`.
- Ruby pinned consistently: `.ruby-version` (3.2.2) = Dockerfile = README (noted; a bump
  to 3.3.x is optional longevity, not required).
- **Deployment:** mandatory deliverable, deferred at user's request until local is done;
  app stays deploy-ready (Dockerfile/Kamal retained; precompile = esbuild + propshaft).
  Tracked as its own milestone (§9 #10) with a real acceptance check — not a parenthetical.

## 7. Seeds (realistic, from the real campaign — unchanged from v1)

- **Campaign 1 — הגן הכתום**: real name/subtitle/story HTML (from
  `tmp/screenshots/gql-donationTarget.json`, `<figure>/<img>` stripped — no hotlinking),
  goal ₪5,000,000, the five real presets + labels, cover image committed to
  `app/assets/images/`, charity ונטעת with real contact details.
- ~12 named donations mirroring real entries (₪50 נילי שאשא + comment
  "לעולם לא נשכח ולא נסלח.", ₪180 רחל ביבי, ₪230 יאיר קרסו, anonymous ₪360, …),
  mostly `paid`, a couple `pending`, one recurring.
- **Reconciliation (no double-count):** `additional_amount_cents = 99_318_800 −
  seeded countable SUM`; `additional_donors_count = 3_170 − seeded countable COUNT`.
  We round the live `993187.72` to the displayed whole-shekel **993,188** (the site shows
  whole shekels; the 72 agorot is a real-balance artifact we deliberately don't reproduce —
  noted so the captured JSON vs. seeds difference reads as intent, not error).
- **Campaign 2** — small synthetic campaign (different goal/progress/presets) proving
  nothing is hard-coded.
- Idempotent (`find_or_create_by!` on natural keys); story HTML in `db/seeds/data/`.

## 8. Testing

- **RSpec + FactoryBot** (user instruction):
  - model specs: validations, `display_name` matrix, `stats` math (incl. zero-goal and
    over-goal percent capping), `countable` policy, preset-shape validator, seeds
    reconciliation.
  - **GraphQL request specs** (replace v1's controller specs): `campaign` query shape,
    unknown id ⇒ `null` + top-level error (both error contracts), `recentDonations`
    pagination + anonymous/display-name resolution + raw-status-not-exposed
    (only the deliberate `pending` boolean), `createDonation` happy path (pending
    created, stats move), validation errors, introspection disabled under production env,
    catch-all route spec (`/up`, `/assets/*`, `/rails/active_storage/*` not swallowed).
- **Playwright** (user instruction) — now the natural E2E layer for an SPA:
  1. page renders title/raised/goal/percent/tabs from seeded data;
  2. full donate flow: open modal (URL becomes `/donate/amount`) → preset → details →
     submit → redirected to `/donate/thanks`; progress + donor count updated (assert
     **deltas**), card appears with "ממתין לאישור" badge;
  3. deep-link: load `/campaigns/:id/donate/amount` directly → page renders with modal
     open (the router-shell behavior we verified on their site);
  4. **mid-flow refresh** (panel fix): refresh on `/donate/details?amount=…` → chosen
     amount survives (proves the search-params wizard state);
  5. anonymous donation → card shows anonymous label, no name.
  - Hardening (carried from v1 panel): `webServer` with `url: /up` readiness gate,
    `reuseExistingServer`, `workers: 1`, assets pre-built once (`yarn build`), seed
    before suite.
- Component-test layer (Vitest/RTL): skipped — Playwright + request specs cover the
  behavior; noted in README under "with more time".

## 9. Work plan — commit-sized milestones

Hour-estimates are no longer the constraint (LLM-assisted); milestones are
**review checkpoints** — each leaves the app working, each is one reviewable commit.
**Each milestone has a self-contained work order: `tmp/plans/step-<N>.md`**
(index: `tmp/plans/README.md`).

| # | Commit | Review checkpoint |
|---|---|---|
| 1 | `chore: dev env` — docker-compose + .env(.example) + Gemfile/package.json deltas + db.yml ENV wiring + rspec install + tsconfig + **scaffold cleanup** (delete application.js/controllers/, explicit `application.tsx` entry, de-Turbo the layout) + `!/.env.example` gitignore fix | `bin/rails db:prepare` works against dockerized PG; `yarn build` compiles the TSX entry; `git check-ignore -v .env.example` reports nothing |
| 2 | `feat: domain` — models, migrations, validations, factories, seeds | model specs green; `db:seed` idempotent; totals reconcile to ₪993,188/3,170 |
| 3 | `feat: graphql api` — schema, campaign/recentDonations queries, createDonation mutation, CSRF token wiring, sanitizer | request specs green incl. error contracts + introspection gating; raw status not exposed |
| 4 | `feat: spa shell + router` — ShellController, catch-all route (+route spec), React entry, router skeleton, gqlFetch (w/ X-CSRF-Token), loader wiring | `/campaigns/1` renders live data end-to-end **with the bundled JS+CSS actually loading** (not just shell HTML) |
| 5 | `feat: campaign page UI` — hero, progress, CTA, tabs, about + charity tabs, he.ts, CSS modules, RTL | visually resembles the original (screenshot side-by-side in commit message) |
| 6 | `feat: donate flow` — nested modal routes (amount → details → thanks), search-params wizard state, action + redirect + revalidation, `<dialog>` a11y | donation lands `pending`, progress updates without manual refetch; deep-link AND mid-flow refresh work |
| 7 | `feat: recent donations tab` — cards, anonymous handling, pending badge, relative times (he), load-more (stated page-merge) | matches card layout incl. comment display; pages reset cleanly after donating |
| 8 | `test: e2e` — Playwright config + 5 specs | suite green from cold start (`docker compose up -d && bin/setup && yarn e2e`) |
| 9 | `docs: README` — run locally, architecture & the v5→v7 modernization ledger, decisions/trade-offs, payment-provider wiring (pending→paid), cuts, **what I'd do with more time**, setup & AI-workflow notes; AI transcripts in `docs/transcripts/` | all 5 PDF deliverables addressed |
| 10 | `deploy` (deferred by user, due before submission) | **live URL reachable and donate flow works on it** — platform chosen with user (Kamal/Dockerfile ready; Heroku-like PaaS or a VPS both fit) |

Stretch (only if desired): donations search/sort, grid/list toggle, heartCount,
campaign-2 visual polish, Vitest layer.

## 10. Explicit scope cuts (told, not hidden)

Per assignment: no payment/checkout (README describes wiring: provider-agnostic
`PaymentProvider` port, Stripe Checkout session per donation, webhook →
`donation.update!(status: :paid, completed_at:)` idempotent by event id; progress flips
automatically since it's computed), no accounts/admin, no production hardening.

Additional deliberate cuts: ambassadors/groups/updates tabs (disabled stubs),
multi-currency & locale switcher (ILS/he only; flags row visual), recurring **billing**
(the one-time/recurring choice is a working, stored field), amount-hidden display mode,
donations search/sort (load-more only), עיגול לטובה, video hero, heartCount.

SSR: **not** attempted — their production page is CSR too (verified); our shell at least
serves a real title/meta. RR v7 framework-mode SSR doesn't fit a Rails backend; noted
in README under "with more time" (alternative: Inertia.js or keep v1's Hotwire).

## 11. Improvements over the original (flagged)

- **The Router v5→v7 migration** with loaders/actions/revalidation replacing manual
  data plumbing — the headline improvement (§2.1 ledger goes in the README).
- Real `<title>` + meta from the server (theirs is a static "Jgive" shell title).
- Real `dir="rtl"` on `<html>` instead of per-component direction hacks.
- Semantic tabs + aria + dialog focus management (original uses bare buttons/divs).
- Server-side validation with friendly inline errors (original relies on JS gating).
- bit button clearly disabled instead of dead-looking.
