#!/usr/bin/env bash
# Run inside this repository on the VPS. Does not edit Nginx or DNS.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."
test -f .env.production || { echo 'Copy deploy/production.env.example to .env.production first.' >&2; exit 1; }
compose() { docker compose --env-file .env.production "$@"; }
compose config --quiet
mkdir -p .deploy-state
case "${1:-deploy}" in
  deploy)
    test -z "$(git status --porcelain --untracked-files=no)" || { echo 'Commit or stash tracked changes before deployment.' >&2; exit 1; }
    export APP_IMAGE="netflix-audience-ratings:$(git rev-parse --short=12 HEAD)-$(date -u +%Y%m%dT%H%M%SZ)"
    container=$(compose ps -q app)
    previous=''
    if test -n "$container"; then previous=$(docker inspect --format '{{.Config.Image}}' "$container"); fi
    # Build before stopping the currently running container.
    compose build app
    if ! compose up -d --no-build --wait --wait-timeout 180 app; then
      if test -n "$previous" && test "$previous" != "$APP_IMAGE"; then
        echo "New image unhealthy; restoring $previous" >&2
        APP_IMAGE="$previous" compose up -d --no-build --wait --wait-timeout 180 app
      fi
      exit 1
    fi
    if test -n "$previous" && test "$previous" != "$APP_IMAGE"; then printf '%s\n' "$previous" > .deploy-state/previous-image; fi
    printf '%s\n' "$APP_IMAGE" > .deploy-state/current-image
    ;;
  rollback)
    test -s .deploy-state/previous-image || { echo 'No saved previous image.' >&2; exit 1; }
    export APP_IMAGE="$(cat .deploy-state/previous-image)"
    compose up -d --no-build --wait --wait-timeout 180 app
    printf '%s\n' "$APP_IMAGE" > .deploy-state/current-image
    ;;
  status) compose ps; compose logs --tail 50 app ;;
  *) echo 'Usage: bash scripts/deploy.sh [deploy|rollback|status]' >&2; exit 2 ;;
esac
