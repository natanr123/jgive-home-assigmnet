import {
  defineRailway,
  github,
  postgres,
  preserve,
  project,
  redis,
  service,
} from "railway/iac";

// Single source of truth for the Railway project (services, databases, variables).
// Preview with `railway config plan`, apply with `railway config apply`.
//
// Dedup is achieved here, IaC-style: each value is declared ONCE and referenced —
//   • DATABASE_URL / REDIS_URL  → from the postgres()/redis() resources
//   • GCS_PROJECT / GCS_BUCKET  → shared consts below
//   • secrets (RAILS_MASTER_KEY, GCS_KEYFILE_JSON) → held on `web` via preserve()
//     (kept out of source), and the worker references web's copy.
export default defineRailway(() => {
  // Names must match the existing resources ("Postgres"/"Redis") or the plan would
  // delete-and-recreate them (wiping the seeded DB).
  const db = postgres("Postgres");
  const cache = redis("Redis");

  const repo = github("natanr123/jgive-home-assigmnet", {
    branch: "main",
    checkSuites: true, // deploy only after GitHub CI (ci.yml) passes
  });

  const GCS_PROJECT = "npcisland";
  const GCS_BUCKET = "npcisland-jgive-storage";

  const web = service("web", {
    source: repo,
    build: { builder: "DOCKERFILE" },
    preDeployCommand: "bin/rails db:prepare",
    healthcheckPath: "/up",
    env: {
      DATABASE_URL: db.env.DATABASE_URL,
      REDIS_URL: cache.env.REDIS_URL,
      GCS_PROJECT,
      GCS_BUCKET,
      // The app binds a fixed 3000; PORT tells Railway which port to route + healthcheck,
      // so the /up healthcheck probes 3000 (where Puma is) and the deploy promotes.
      PORT: "3000",
      RAILS_MASTER_KEY: preserve(),
      GCS_KEYFILE_JSON: preserve(),
    },
  });

  const worker = service("worker", {
    source: repo,
    build: { builder: "DOCKERFILE" },
    start: "bundle exec sidekiq", // role is explicit here (no PROCESS_TYPE/bin-boot needed)
    preDeployCommand: "bin/rails db:prepare",
    env: {
      DATABASE_URL: db.env.DATABASE_URL,
      REDIS_URL: cache.env.REDIS_URL,
      GCS_PROJECT,
      GCS_BUCKET,
      RAILS_MASTER_KEY: web.env.RAILS_MASTER_KEY,
      GCS_KEYFILE_JSON: web.env.GCS_KEYFILE_JSON,
    },
  });

  return project("jgive-orange-garden", {
    resources: [db, cache, web, worker],
  });
});
