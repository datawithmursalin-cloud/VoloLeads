#!/usr/bin/env bash
set -euo pipefail

[[ "$(id -un)" == vololead ]] || { echo 'Run this as the vololead cPanel account.' >&2; exit 1; }
repo=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
[[ "$(git -C "$repo" branch --show-current)" == NEXTJS ]] || { echo 'The repository must be on NEXTJS.' >&2; exit 1; }
[[ -z "$(git -C "$repo" status --porcelain --untracked-files=no)" ]] || { echo 'Preserve server repository changes before deployment.' >&2; exit 1; }

# One deployment for this Passenger app at a time, including cPanel hook runs.
mkdir -p /home/vololead/deployment-locks
exec 9>/home/vololead/deployment-locks/frontend.lock
flock -n 9 || { echo 'Another frontend deployment is already running.' >&2; exit 1; }

set +u
source /home/vololead/nodevenv/vololeads/frontend/22/bin/activate
set -u
export UV_THREADPOOL_SIZE=1
export RAYON_NUM_THREADS=1
export NODE_OPTIONS="${NODE_OPTIONS:+$NODE_OPTIONS }--v8-pool-size=1"
# Shared account has 700 MB PMEM and 100 processes. Never compile here.
export VOLOLEADS_PREBUILT=1
export VOLOLEADS_CPANEL_RESTART=1
node "$repo/scripts/deploy-frontend-cpanel.js"
