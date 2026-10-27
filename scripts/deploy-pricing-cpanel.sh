#!/usr/bin/env bash
set -euo pipefail

# Run as the existing vololead cPanel account after pulling NEXTJS.
repo=/home/vololead/repositories/VoloLeads
frontend=/home/vololead/vololeads/frontend
backend=/home/vololead/vololeads/backend
backend_activate=/home/vololead/nodevenv/vololeads/backend/22/bin/activate

[[ "$(id -un)" == vololead ]] || { echo 'Run this as the vololead cPanel account.' >&2; exit 1; }
for target in "$repo/frontend/package.json" "$frontend/package.json" "$backend/package.json" "$backend_activate"; do
  [[ -f "$target" ]] || { echo "Missing required application file: $target" >&2; exit 1; }
done
[[ "$(git -C "$repo" branch --show-current)" == NEXTJS ]] || { echo 'The repository must be on NEXTJS.' >&2; exit 1; }
[[ -z "$(git -C "$repo" status --porcelain --untracked-files=no)" ]] || { echo 'Commit or preserve server repository changes before deployment.' >&2; exit 1; }

echo 'Verifying the configured Stripe prices before deployment...'
(
  set +u
  source "$backend_activate"
  set -u
  cd "$backend"
  # Resolve dependencies from the existing backend while testing the new config.
  # dotenv reads the backend app's .env; no credentials are printed or copied.
  NODE_PATH="$backend/node_modules${NODE_PATH:+:$NODE_PATH}" node "$repo/backend/scripts/verifyCheckoutPrices.js"
)

backup="/home/vololead/deployment-backups/vololeads-$(date -u +%Y%m%dT%H%M%SZ)-$$"
mkdir -p "$backup"
tar --exclude='./node_modules' --exclude='./.env' --exclude='./.env.*' \
  -czf "$backup/frontend.tar.gz" -C "$frontend" .
tar --exclude='./node_modules' --exclude='./.env' --exclude='./.env.*' --exclude='./public/uploads' \
  -czf "$backup/backend.tar.gz" -C "$backend" .
cp -p /home/vololead/public_html/styles.css "$backup/public-styles.css"
printf 'Application backup: %s\n' "$backup"
trap 'echo "Deployment stopped. Keep the backup above for recovery." >&2' ERR

echo 'Building and checking an isolated frontend release...'
bash "$repo/scripts/deploy-frontend-cpanel.sh"

echo 'Updating the billing files in the existing backend app...'
for relative in \
  src/config/billing.js \
  src/controllers/billingController.js \
  src/controllers/subscriberMeetingController.js \
  src/emails/subscriptionConfirmationEmail.js \
  src/utils/checkoutPricing.js \
  scripts/verifyCheckoutPrices.js; do
  install -D -m 644 "$repo/backend/$relative" "$backend/$relative"
done
mkdir -p "$backend/tmp"
touch "$backend/tmp/restart.txt"

echo 'Checking the public website and backend...'
page=$(curl --fail --silent --show-error --retry 5 --retry-delay 3 --retry-connrefused https://vololeads.com/)
[[ "$page" == *'__next'* ]] || { echo 'The root page did not return Next.js markup.' >&2; exit 1; }
health=$(curl --fail --silent --show-error --retry 5 --retry-delay 3 --retry-connrefused https://vololeads.com/api/health)
printf '%s\n' "$health" | /home/vololead/nodevenv/vololeads/backend/22/bin/node -e '
let input = "";
process.stdin.on("data", chunk => input += chunk);
process.stdin.on("end", () => {
  const health = JSON.parse(input);
  if (health.success !== true || health.status !== "OK") process.exit(1);
  console.log("Backend health: OK");
});'
printf 'Website responded with Next.js markup. Release: %s\n' "$(git -C "$repo" rev-parse --short HEAD)"
echo 'Verify the visible pricing and a Stripe test-mode checkout before accepting new subscriptions.'
