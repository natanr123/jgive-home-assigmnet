#!/usr/bin/env bash
#
# Reproduce this project's Railway variable config from .env.railway — imperative
# "infra as code". Sets every KEY from .env.railway on each service (web + worker),
# reading values straight from the git-ignored .env.railway and piping via stdin so
# secrets never appear on the command line. Idempotent — re-run any time to re-sync.
#
# WHY per-service and not Shared Variables: Railway does NOT auto-inject environment
# "Shared Variables" into services, and wiring `KEY=${{shared.KEY}}` references via the
# CLI did not resolve in testing (service refs like ${{Postgres.DATABASE_URL}} DO). So to
# dedupe into Shared Variables, create them in the dashboard (Project → Shared Variables)
# and use its "add to services" — Railway wires the reference correctly there — then drop
# the per-service copies. This script keeps the reliable, verifiable per-service path.
#
# Usage:   bin/railway-setup.sh [env-file]              # default env-file: .env.railway
# Env overrides:
#   RAILWAY_SERVICES     (default: "web worker")
#   RAILWAY_ENVIRONMENT  (default: production)
# Requires: authenticated Railway CLI + a linked project (railway login / railway link).

set -euo pipefail

ENV_FILE="${1:-.env.railway}"
RAILWAY_SERVICES="${RAILWAY_SERVICES:-web worker}"
RAILWAY_ENVIRONMENT="${RAILWAY_ENVIRONMENT:-production}"
RAILWAY="npx -y @railway/cli"

[ -f "$ENV_FILE" ] || { echo "✗ env file '$ENV_FILE' not found" >&2; exit 1; }

count=0
for svc in $RAILWAY_SERVICES; do
  while IFS= read -r line || [ -n "$line" ]; do
    line="${line#"${line%%[![:space:]]*}"}"   # left-trim
    [ -z "$line" ] && continue                # blank
    [ "${line:0:1}" = "#" ] && continue       # comment
    case "$line" in *=*) ;; *) continue ;; esac
    key="${line%%=*}"
    val="${line#*=}"
    printf '%s' "$val" | $RAILWAY variables --service "$svc" \
      --environment "$RAILWAY_ENVIRONMENT" --skip-deploys --set-from-stdin "$key" >/dev/null
    echo "   $svc ← $key"
    count=$((count + 1))
  done < "$ENV_FILE"
done

echo "✓ Synced $count variable assignment(s) from $ENV_FILE onto: ${RAILWAY_SERVICES// /, } (staged; --skip-deploys)."
echo "  Trigger a deploy (push to main, or 'railway up') to apply."
