# Deploying to Railway

This app runs on **Railway** as **two services from one Docker image** — `web` (Rails/Puma)
and `worker` (Sidekiq) — plus managed **Postgres** and **Redis**, with uploads on **Google
Cloud Storage**. Infrastructure is declared as code in **`.railway/railway.ts`**, and deploys
are **CI-gated** (GitHub Actions must pass first).

For the *why* behind the design and the gotchas, see
[PLAN.md → Deployment & infrastructure-as-code](PLAN.md#deployment--infrastructure-as-code).

---

## Requirements

**Accounts & tools**
- A **Railway** account.
- A **GitHub** repo for the app — Railway deploys from it and CI gates the deploy. Point
  `railway.ts` at your repo (see step 2).
- **Node 20+** with project deps installed (`npm install`) — this brings the Railway IaC
  tooling (`railway` SDK + `tsx`) used to run `railway config`.
- The **Railway CLI**, used here via `npx -y @railway/cli` (no global install needed).

**Credentials / secrets**
- **`RAILS_MASTER_KEY`** — the contents of `config/master.key`.
- **Google Cloud Storage** — a GCP project, a **bucket**, and a **service-account key JSON**
  with object admin on that bucket (`GCS_PROJECT`, `GCS_BUCKET`, `GCS_KEYFILE_JSON`).

> **IaC tooling note:** Node 20 can't execute a `.ts` config natively, so every
> `railway config …` command below is run with a TypeScript loader:
> ```bash
> NODE_OPTIONS="--import tsx" npx -y @railway/cli config plan
> ```

---

## First-time deploy (provision)

**1. Log in and create/link the project**
```bash
npx -y @railway/cli login        # device-code pairing in the browser
npx -y @railway/cli init         # new project   (or: railway link  for an existing one)
```

**2. Point the IaC at your repo** — edit `.railway/railway.ts`:
- `github("<owner>/<repo>", { branch: "main" })` → your repo
- `GCS_PROJECT` / `GCS_BUCKET` consts → your bucket
- `project("<name>", …)` → your project name

**3. Preview and apply the infrastructure** (creates Postgres, Redis, web, worker; sets the
variables and references):
```bash
NODE_OPTIONS="--import tsx" npx -y @railway/cli config plan     # review the diff first
NODE_OPTIONS="--import tsx" npx -y @railway/cli config apply
```

**4. Authorize GitHub** (one-time, in the Railway dashboard) so Railway can pull the repo:
each service → **Settings → Source** → connect the GitHub repo if it isn't already.

**5. Set the two secret values** once, on the `web` service. `railway.ts` declares these with
`preserve()` so it never stores the values; the worker references web's copy.
```bash
npx -y @railway/cli variables --service web --set-from-stdin RAILS_MASTER_KEY < config/master.key
npx -y @railway/cli variables --service web --set-from-stdin GCS_KEYFILE_JSON < ~/.config/gcloud-keys/<key>.json
```

**6. Give `web` a public domain**
```bash
npx -y @railway/cli domain --service web
```
The app binds a fixed **3000**, and `railway.ts` sets **`PORT=3000`** so Railway routes *and*
healthchecks port 3000 — required for the `/up` healthcheck (and thus the deploy) to pass.

**7. CI-gated auto-deploy** is already declared (`checkSuites: true` = Wait-for-CI in
`railway.ts`). Just ensure the repo has `.github/workflows/ci.yml` and the services are
connected to it (step 4).

**8. Redis eviction policy** — Sidekiq requires `maxmemory-policy noeviction`. Railway's Redis
defaults to that; only revisit if you set a `maxmemory` with an eviction policy.

---

## Routine deploys

- **Normal flow:** push to `main` → GitHub Actions `ci.yml` (scan / lint / RSpec / E2E) runs →
  Railway **auto-deploys `web` + `worker` only when CI is green**. Rollback is one click in the
  Railway dashboard.
- **Change config or a variable:** edit `.railway/railway.ts`, then:
  ```bash
  NODE_OPTIONS="--import tsx" npx -y @railway/cli config plan     # preview the exact change
  NODE_OPTIONS="--import tsx" npx -y @railway/cli config apply
  ```
- **Manual deploy** (bypasses the CI gate, rarely needed):
  `npx -y @railway/cli up --service web`

---

## Verify

```bash
BASE=https://<your-web-domain>
curl -s -o /dev/null -w "/up=%{http_code}\n"          "$BASE/up"           # 200
curl -s -o /dev/null -w "/campaigns/1=%{http_code}\n" "$BASE/campaigns/1"  # 200
npx -y @railway/cli logs --service worker | grep -i "sidekiq.*connecting"  # Sidekiq ↔ Redis
npx -y @railway/cli status                                                  # both ● Online
```

---

## Gotchas (learned the hard way — fuller story in PLAN.md)

- **`PORT=3000` is mandatory for `web`.** The app binds a fixed 3000, not Railway's `$PORT`. If
  Railway healthchecks a different port, every deploy fails with **"Healthcheck failure."**
  Setting `PORT=3000` makes Railway route *and* healthcheck 3000. (Cleaner long-term: bind the
  server to `$PORT`.)
- **Run `railway config` with `NODE_OPTIONS="--import tsx"`** on Node 20 — it can't run `.ts`
  natively (you'll see `Unknown file extension ".ts"` otherwise).
- **One config system per service.** A service can't be managed by both `railway.ts` and
  `railway.toml`. If a service's **Settings → Config-as-code → Railway Config File** points at a
  (removed) `railway.toml`, its deploys fail "config not found" *and* IaC refuses to manage it —
  clear that field.
- **IaC `unset` doesn't clear a backend value.** Removing a `healthcheckPath` (or a variable)
  from `railway.ts` reports `→ unset`, but Railway keeps the last value. Clear it in the
  dashboard if it must actually go away.
- **Secrets use `preserve()`** — `railway.ts` never stores their values; set them directly on
  the `web` service (step 5). `RAILS_MASTER_KEY` comes from `config/master.key`,
  `GCS_KEYFILE_JSON` from the GCS service-account key file.
