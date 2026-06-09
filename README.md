# הגן הכתום — JGive campaign donation page

A reproduction of the live JGive campaign donation page
([donation-targets/159183](https://www.jgive.com/new/he/ils/donation-targets/159183),
campaign **"הגן הכתום"**) — what a donor sees and interacts with, up to (but not including)
payment. **Rails 8 + GraphQL backend serving a React 19 SPA**, RTL Hebrew throughout.

**Live:** **https://web-production-bdbd1.up.railway.app** ·
**Sidekiq dashboard:** https://web-production-bdbd1.up.railway.app/sidekiq ·
**Source:** https://github.com/natanr123/jgive-home-assigmnet

---

## Run it locally

**Prerequisites:** Ruby 3.4.7, Node 20+, Docker (for Postgres + Redis).

```bash
cp .env.example .env     # local DB + Redis config
docker compose up -d     # Postgres 17 + Redis 7
bin/setup                # bundle + npm install + build + db:prepare + db:seed, then bin/dev
```

`bin/setup` ends by launching **`bin/dev`** (Puma + esbuild watch + Sidekiq worker via
`Procfile.dev`). Open **http://localhost:3000** — `/` redirects to the seeded campaign.
Already set up? Just `bin/dev`.

```bash
bundle exec rspec     # models + GraphQL request specs
npm run typecheck     # TypeScript
npm run build         # build the SPA bundle (prereq for E2E)
npm run e2e           # Playwright end-to-end
```

---

## What's built

- **Campaign page** (RTL, tabs): hero cover, progress (raised / goal / % / donor count),
  donate CTA, and tabs mirroring the original — story + charity card, recent donations
  (load-more), about-the-charity.
- **Donation flow** (URL-routed modal): amount (presets + custom, one-time vs **recurring**
  with a months term), display preference (full name / first name / anonymous), optional
  dedication. Submitting **creates a `pending` donation and updates the campaign's progress**
  — no payment (see the [payment plan](docs/PAYMENT.md)).
- **Seeds:** the real campaign + donors, reconciled to the live totals (₪993,188 / 3,170);
  plus a second synthetic campaign.

---

## Key decisions & trade-offs

The short version — full reasoning in **[PLAN.md](docs/PLAN.md#key-decisions--trade-offs)**.

- **Same stack as JGive** — Rails + GraphQL + a React SPA — *plus* the React Router v5→v7
  modernization their shipped bundle hasn't made. ([why](docs/PLAN.md#architecture--the-modernization-story))
- **Money as integer cents**; **GraphQL kept tiny** (2 queries + 1 mutation).
- **Pending counts toward progress** (the brief wants submit to move it) — isolated in one
  scope, a one-word switch to paid-only.
- **Recurring = per-charge × term**; progress counts the installment, not the multi-year pledge.
- **No `donors` table** (no accounts in scope) — clean upgrade path (add `donors` + a nullable `donation.donor_id` later).
- **Images via Active Storage** (mirrors JGive) → local disk in dev, **GCS** in production.
- **Commission job** on each donation runs on **Active Job + Sidekiq/Redis** (off the request path).

---

## What I'd do with more time

- Real Stripe sandbox integration end-to-end (the [plan](docs/PAYMENT.md)).
- Accounts + a `donors` table (the upgrade path) for dedupe and donor history.
- A Vitest/React Testing Library component layer (currently covered by request + E2E specs).
- `GraphQL::Dataloader` + cursor pagination if the schema grows.
- An accessibility audit; Active Storage **variants** (`srcset`) once libvips is available.
- Bind the web server to Railway's `$PORT` (currently a fixed 3000 + `PORT=3000`) — see [deployment](docs/PLAN.md#deployment--infrastructure-as-code).

---

## Docs

| File | What |
|---|---|
| **[PLAN.md](docs/PLAN.md)** | Architecture & the modernization story, full decisions, and deployment / infrastructure-as-code |
| **[MODELS.md](docs/MODELS.md)** | The data model — `CharityOrganization → Campaign → Donation`, fields, enums, and relationships |
| **[PAYMENT.md](docs/PAYMENT.md)** | How I'd wire a real payment provider and move a donation `pending → paid` (Stripe, idempotency, webhook) |
| **[DEPLOY.md](docs/DEPLOY.md)** | Step-by-step Railway deploy runbook — requirements, first-time provision, routine deploys, gotchas |
| **[RAILWAY-CONFIGURATION.md](docs/RAILWAY-CONFIGURATION.md)** | Railway infrastructure-as-code reference — `railway.ts` and the `railway config` commands (with the project diagram) |
| **[railway-diagram.png](docs/railway-diagram.png)** | Railway project canvas — `web` + `worker` services wired to Postgres + Redis |
| **[REQUIREMENTS.md](docs/REQUIREMENTS.md)** | Functional & non-functional requirements, with status |
| **[jgive-backend-home-assignment.md](docs/jgive-backend-home-assignment.md)** | The original assignment brief |

---

## Setup & AI workflow

Built with **Claude Code** (Opus) + the **Playwright MCP**. I reverse-engineered the live
page first (GraphQL ops, router fingerprint, brand colors), had AI judge
panels critique the plan, then built in commit-sized milestones, verifying each in a real
browser. Deployment was driven through the Railway CLI and declared as code in
`.railway/railway.ts`. Full write-up in
**[PLAN.md → Setup, thought process & AI workflow](docs/PLAN.md#setup-thought-process--ai-workflow)**;
the complete LLM transcript ships with the submission (deliverable #4).
