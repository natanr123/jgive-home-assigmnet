# Requirements

Requirements for the JGive campaign donation page reproduction. Derived from the brief
(`tmp/prompots/jgive-backend-home-assignment.md`) and the live reference
([donation-targets/159183](https://www.jgive.com/new/he/ils/donation-targets/159183)).

**Legend:** ✅ done · 🟡 partial / demo-level · ⛔ out of scope (per brief) · ➕ beyond the
brief (built anyway).

---

## Functional requirements

### Campaign page (core)

| # | Requirement | Status |
|---|---|---|
| FR-1 | Show a page for the campaign that **clearly resembles** the original (not pixel-perfect). | ✅ |
| FR-2 | Campaign details **organized into tabs**, mirroring the reference tabs. | ✅ (על הפרויקט / תרומות אחרונות / על העמותה live; ambassadors / groups / updates as disabled stubs) |
| FR-3 | Show: **title**, **description / story**, **cover image**. | ✅ |
| FR-4 | Show **goal amount**, **amount raised**, and **progress toward the goal** (bar + percent + donor count). | ✅ |
| FR-5 | Show **recent donations** (donor name or anonymous, amount, relative time, optional comment). | ✅ (+ load-more) |
| FR-6 | RTL Hebrew layout matching the source. | ✅ |

### Donation form & flow (core)

| # | Requirement | Status |
|---|---|---|
| FR-7 | Amount: **a few preset options + a custom amount**. | ✅ |
| FR-8 | **One-time vs. recurring** choice. | ✅ (choice stored; billing mechanics ⛔) |
| FR-9 | **Donor display preference**: full name / first name only / anonymous. | ✅ |
| FR-10 | **Optional dedication message**. | ✅ (stored as `comment`) |
| FR-11 | Submitting **creates a donation record in `pending` state**. | ✅ |
| FR-12 | Submitting **updates the campaign's progress**. | ✅ (computed; pending counts — see NFR-Sec / decisions) |
| FR-13 | **No payment / checkout** implemented. | ⛔ (by design) |
| FR-14 | README **describes how to wire a real payment provider** and move `pending → paid`. | ✅ (README "TODO: wire a real payment provider") |

### Data & seeds (core)

| # | Requirement | Status |
|---|---|---|
| FR-15 | Seed **one or two campaigns**. | ✅ (2 — real "הגן הכתום" + a synthetic one) |
| FR-16 | Seed **a handful of donations** so the page isn't empty. | ✅ (~14, mirroring real entries) |
| FR-17 | Progress reflects realistic totals (₪993,188 / 3,170 donors). | ✅ (via `additional_*` reconciliation) |

### Beyond the brief (built anyway)

| # | Requirement | Status |
|---|---|---|
| FR-18 | **Edit page** (`/campaigns/:id/edit`) to update campaign + charity content. | ➕ |
| FR-19 | **Image upload** (banner / avatar / story images) via Active Storage direct upload. | ➕ |
| FR-20 | **Background job** on donation create: `CalcCommissionJob` sets `commission_cents` to 10% of the amount. | ➕ |
| FR-21 | **Sidekiq dashboard** at `/sidekiq`. | ➕ (no auth — demo) |

### Out of scope (explicit in the brief)

- ⛔ Payment processing / checkout
- ⛔ User accounts, login, or admin
- ⛔ Production hardening

---

## Non-functional requirements

### Architecture

| # | Requirement |
|---|---|
| NFR-A1 | Reproduce the source's **shape**: one Rails app serving a React SPA + a same-origin **GraphQL** endpoint. |
| NFR-A2 | **Rails 8** backend, **React 19 + React Router v7** SPA (data router: loaders/actions), **esbuild** + propshaft. |
| NFR-A3 | Provider/adapter seam for future payments (`Payments::Provider`); GraphQL surface kept deliberately small (2 queries + 1 mutation). |
| NFR-A4 | Conventional Rails routes/naming where clearer than the source's custom names. |

### Quality & correctness

| # | Requirement |
|---|---|
| NFR-Q1 | **Automated tests**: RSpec (models + GraphQL request specs), Playwright E2E, TypeScript typecheck. |
| NFR-Q2 | **Lint clean**: RuboCop (omakase). |
| NFR-Q3 | **CI** runs scan (brakeman, bundler-audit), lint, RSpec, and Playwright E2E. |
| NFR-Q4 | **Real commit history** (one reviewable commit per milestone), not a single squash. |
| NFR-Q5 | **Money as integer cents**; enum-validated statuses; model validations; **idempotent seeds**. |

### Security

| # | Requirement |
|---|---|
| NFR-S1 | **CSRF** protection (token model); SPA sends `X-CSRF-Token`. |
| NFR-S2 | Campaign/charity **HTML sanitized** at render (allowlist). |
| NFR-S3 | **No internal leakage**: raw donation `status` enum not exposed (only a `pending` boolean); GraphQL introspection disabled in production. |
| NFR-S4 | (Future payment) webhook **signature verification** + **dual idempotency** (outbound `Idempotency-Key`, inbound `event.id`). |

### UX / accessibility / i18n

| # | Requirement |
|---|---|
| NFR-U1 | **RTL Hebrew** throughout (`dir="rtl"`, `lang="he"`); all UI strings in one locale module. |
| NFR-U2 | Accessible semantics: `role=tab`/`aria-selected`, `aria-valuenow` progress bar, native `<dialog>` focus management. |
| NFR-U3 | Progress updates **without a manual refetch** (router revalidation after the mutation). |
| NFR-U4 | Responsive layout. |

### Performance

| # | Requirement |
|---|---|
| NFR-P1 | Campaign stats computed in **one SQL round-trip** (`SUM`+`COUNT`), memoized per request. |
| NFR-P2 | Avoid N+1 (eager-load charity org); donations paginated (load-more). |
| NFR-P3 | Commission computed **off the request path** (background job). |

### Operability & deployment

| # | Requirement |
|---|---|
| NFR-O1 | **Dockerized Postgres + Redis** for dev via `docker compose`, configured from a local `.env`. |
| NFR-O2 | One-command dev startup (`bin/dev` → web + esbuild + Sidekiq worker). |
| NFR-O3 | **Background processing** on Active Job + Sidekiq (Redis); dashboard for visibility. |
| NFR-O4 | **Deploy-ready**: production Dockerfile + Kamal retained; Ruby pinned (`.ruby-version`). Deploy itself is mandatory per the brief (deferred at the reviewer's request); Active Storage would move to S3 for production. |
| NFR-O5 | A **deployed live URL** is a mandatory deliverable. 🟡 deferred-then-due. |

### Maintainability / process

| # | Requirement |
|---|---|
| NFR-M1 | README covers: run locally, key decisions/trade-offs, what you'd do with more time. |
| NFR-M2 | LLM transcript + setup/thought-process notes included (deliverables #4/#5). |
| NFR-M3 | Deliberate scope cuts documented, not hidden. |
