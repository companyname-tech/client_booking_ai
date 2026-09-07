#!/usr/bin/env bash
# Guarded deploy for the client_booking_ai web build -> chatcoders.dev vhosts.
#
# SAFETY (owner rules: deploy only committed, never lose working code):
#   * REFUSES if the working tree is dirty (anything staged OR unstaged)
#   * REFUSES if HEAD != origin/main (local unpushed commits or a stale tree)
#   * builds with VITE_USE_MOCK_DATA=false VITE_API_URL=/api (same-origin /api)
#   * stamps the deployed commit into dist/deploy-commit.txt
#   * atomic-swap into the vhost webroot (previous build kept as <vhost>.prev)
#   * verifies the served bundle matches the freshly built one
#
# Usage:
#   scripts/deploy-web.sh [dev|prod|both]      (default: both)
#
# Environment overrides:
#   LEADS_VM          VM to deploy to              (default 160.250.225.89)
#   LEADS_SSH_USER    ssh user                     (default root)
#   LEADS_DEPLOY_ENV  KEY=VALUE file with the root password
#                     (default ~/.deploy/leads-prod.env; falls back to ssh keys)
#
# Run from anywhere; resolves the repo root from its own location.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

TARGET="${1:-both}"
case "$TARGET" in
  dev)  TARGETS=(dev-leads.chatcoders.dev) ;;
  prod) TARGETS=(leads.chatcoders.dev) ;;
  both) TARGETS=(dev-leads.chatcoders.dev leads.chatcoders.dev) ;;
  *) echo "usage: $0 [dev|prod|both]" >&2; exit 2 ;;
esac

# --- GUARD 1: clean working tree (staged changes are uncommitted too) ---------
if [ -n "$(git status --porcelain)" ]; then
  echo "REFUSING to deploy: the working tree is DIRTY. Commit or stash first." >&2
  echo "Uncommitted changes:" >&2
  git status --short >&2
  exit 1
fi

# --- GUARD 2: deploy only exactly origin/main ---------------------------------
git fetch origin main -q
HEAD_SHA="$(git rev-parse HEAD)"
ORIGIN_SHA="$(git rev-parse origin/main)"
if [ "$HEAD_SHA" != "$ORIGIN_SHA" ]; then
  echo "REFUSING to deploy: HEAD ($(git rev-parse --short HEAD)) != origin/main ($(git rev-parse --short origin/main))." >&2
  echo "Only a clean origin/main may be deployed. Pull or rebase first." >&2
  exit 1
fi
SHORT_SHA="$(git rev-parse --short HEAD)"
echo "Deploying origin/main $SHORT_SHA (clean tree) -> ${TARGETS[*]}"

# --- build ---------------------------------------------------------------------
VITE_USE_MOCK_DATA=false VITE_API_URL=/api npm run build
echo "$SHORT_SHA" > dist/deploy-commit.txt
BUNDLE_JS="$(grep -oE 'index-[A-Za-z0-9_-]+\.js' dist/index.html | head -1)"
echo "Built: $SHORT_SHA -> dist/index.html references $BUNDLE_JS"

# --- ssh/creds (root password from deploy env if present, else ssh keys) -------
VM="${LEADS_VM:-160.250.225.89}"
SSH_USER="${LEADS_SSH_USER:-root}"
DEPLOY_ENV="${LEADS_DEPLOY_ENV:-$HOME/.deploy/leads-prod.env}"
SSHPASS_BIN="$(command -v sshpass || true)"
PASS=""
if [ -f "$DEPLOY_ENV" ]; then
  PASS="$(grep -E '^LEADS_PROD_ROOT_PASSWORD=' "$DEPLOY_ENV" | head -1 | cut -d= -f2-)"
fi
if [ -n "$PASS" ] && [ -n "$SSHPASS_BIN" ]; then
  export SSHPASS="$PASS"
  SSH_BASE=(sshpass -e ssh -o StrictHostKeyChecking=no -o ConnectTimeout=20)
else
  echo "note: no password found in $DEPLOY_ENV (and no sshpass) — trying ssh keys." >&2
  SSH_BASE=(ssh -o StrictHostKeyChecking=no -o ConnectTimeout=20)
fi

remote() { "${SSH_BASE[@]}" "$SSH_USER@$VM" "$@"; }

# --- stage + atomic swap per target -------------------------------------------
for vhost in "${TARGETS[@]}"; do
  STAGE="/var/www/.leads-stage-$$-$RANDOM"
  echo "=== deploying $SHORT_SHA to $vhost ==="
  tar -C dist -cf - . | remote "mkdir -p '$STAGE' && tar -C '$STAGE' -xf - && chown -R user:user '$STAGE'"
  # swap: drop the stale .prev rollback, keep the current build as .prev, move stage in
  remote "rm -rf /var/www/$vhost.prev && mv /var/www/$vhost /var/www/$vhost.prev && mv '$STAGE' /var/www/$vhost && chown -R user:user /var/www/$vhost"
  SERVED_JS="$(remote "curl -sk -H 'Host: $vhost' https://127.0.0.1/ | grep -oE 'index-[A-Za-z0-9_-]+\\.js' | head -1")"
  if [ "$BUNDLE_JS" = "$SERVED_JS" ]; then
    echo "OK: $vhost serves $SERVED_JS (origin/main $SHORT_SHA)"
  else
    echo "WARNING: $vhost serves '$SERVED_JS' but built '$BUNDLE_JS' — check manually" >&2
    exit 1
  fi
done
echo "Deploy complete: origin/main $SHORT_SHA -> ${TARGETS[*]}"
