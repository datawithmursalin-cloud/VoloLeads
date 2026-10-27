# VoloLeads cPanel deployment context

Read this file before build or deployment work for VoloLeads. It records the
server layout and the rules that keep the Next.js frontend separate from the
existing backend.

## Scope and safety

- Repository: `/home/vololead/repositories/VoloLeads`
- Deployment branch: `NEXTJS`
- cPanel account: `vololead`
- Domain: `vololeads.com`
- Frontend changes must not modify, replace, or redeploy the backend.
- Do not destroy and recreate cPanel applications for normal updates.
- Never print full CloudLinux selector JSON or environment-variable values.
  Treat database, Stripe, Google, SMTP, JWT, admin, and Turnstile values as
  secrets. Rotate any credentials exposed in logs or chat.

## Applications

There are two independent CloudLinux Passenger Node.js applications. Both use
Node.js `22.23.4` in Production mode, verified on October 23, 2026.

### Backend — preserve during frontend work

- Physical app root: `/home/vololead/vololeads/backend`
- cPanel application root: `vololeads/backend`
- URL: `https://vololeads.com/api`
- Passenger base URI: `/api`
- Startup file: `src/server.js`
- Virtual environment: `/home/vololead/nodevenv/vololeads/backend/22/bin/activate`
- Health check: `curl -sS https://vololeads.com/api/health`

The backend routing file is `/home/vololead/public_html/api/.htaccess`. Its
Passenger settings must continue to point to the backend above.

### Frontend — Next.js

- Registered Passenger app root: `/home/vololead/vololeads/frontend`
- Active release pointer: `/home/vololead/vololeads/frontend/current`
- Immutable releases: `/home/vololead/vololeads/frontend-releases/<release>`
- cPanel application root: `vololeads/frontend`
- URL: `https://vololeads.com/`
- Passenger base URI: `/` (blank path in the cPanel URL field)
- Startup file: `next-server.js`
- Virtual environment: `/home/vololead/nodevenv/vololeads/frontend/22/bin/activate`

The frontend is served by Passenger at the domain root. It must not be copied
over the backend or treated as a static `public_html/index.html` site.

## Resource limits and prebuilt releases

Verified in cPanel on October 28, 2026: 700 MB physical memory and 100
processes/threads for the whole account. Builds hit PMEM and NPROC faults.
Normal deployments MUST NOT compile on cPanel.

`.github/workflows/frontend-build.yml` builds every NEXTJS commit on Linux with
Node 22, runs regression and production checks, and publishes a prerelease
`frontend-<full commit SHA>` containing `.next` without its build cache and production `node_modules`. It uses
no production environment or application secrets. The API proxy reads its backend
URL at request time from the existing Passenger environment.

The cPanel shell wrapper always sets `VOLOLEADS_PREBUILT=1`. Deployment downloads
the archive for the exact checked-out commit, streams its SHA-256 verification,
checks archive paths and commit/lockfile/platform metadata, and extracts production dependencies built on Linux. It never invokes npm or `next build`.
Wait for the matching GitHub Actions run to succeed before deploying. Missing,
corrupt or incompatible artifacts fail before activation; there is no automatic
fallback to compiling on the host. Existing probe, promotion and rollback checks
still apply. No GitHub token is needed by cPanel because the repository and
compiled website releases are public. Downloaded archive files are removed after
successful extraction and validation.

Production runtime and archive extraction still consume resources. This removes compilation
and tracing from the account, but does not guarantee a resource ceiling under
arbitrary application traffic. Do not increase worker counts or run parallel
deployments.

## Next.js build rules

The shared host has limited memory, processes, and threads. Keep the existing
low-resource settings in `frontend/next.config.js`:

- `experimental.cpus: 1`
- `experimental.memoryBasedWorkersCount: false`
- `experimental.staticGenerationMaxConcurrency: 1`
- `experimental.webpackMemoryOptimizations: true`
- `enablePrerenderSourceMaps: false`
- `outputFileTracingRoot: __dirname`

The frontend build must use webpack:

```text
next build --webpack
```

`npm run build` and the path-safe postinstall command both use
`frontend/scripts/build-next.js`. The script resolves the project from its own
location, not an inherited `INIT_CWD`, and always uses webpack. It starts the
Next CLI with `UV_THREADPOOL_SIZE=1`, `RAYON_NUM_THREADS=1`, and
`NODE_OPTIONS` extended with `--v8-pool-size=1`. Build children inherit these
limits. Existing heap limits or other `NODE_OPTIONS` are preserved.

Next's one-worker configuration alone does not limit Node's internal thread
pools. A host can still refuse a build if the account has exhausted its PMEM or
NPROC allowance; do not claim that any build flag guarantees otherwise.

## Normal cPanel update workflow

For frontend, footer, Compliance, and other website updates, use the frontend
release script. Do not run the pricing/backend deployment script for these.

### Git Version Control interface

1. Confirm the repository is on `NEXTJS`.
2. Click **Update from Remote**.
3. Click **Deploy HEAD Commit**. `.cpanel.yml` invokes
   `bash scripts/deploy-frontend-cpanel.sh`.
4. Wait for the matching GitHub build, then deploy. The script downloads, checks,
   activates, restarts, and verifies the frontend.
   Do not run a second copy/install/build step in the live app directory.

### Terminal workflow

```bash
cd /home/vololead/repositories/VoloLeads
git switch NEXTJS
git pull --ff-only origin NEXTJS
bash scripts/deploy-frontend-cpanel.sh
```

The existing `vololead` account, Node 22 virtual environment, Passenger app root,
and startup filename `next-server.js` stay in place. `flock` prevents two
frontend deployments from running at once.

### Release and failure behavior

1. Copy source into a new directory under `frontend-releases`. Exclude
   `.next`, `node_modules`, `tmp`, `current`, and repository `.env` files.
2. Download and verify the prebuilt `.next` for this exact commit, extract production dependencies from the same archive, matched to the committed lockfile.
   Existing live dependencies and `.next` are not modified.
3. Load the existing app's environment for the candidate process without
   copying or printing environment files. No compilation runs on cPanel.
4. Start the candidate on an ephemeral **127.0.0.1-only** port and check the
   homepage, Compliance, and Terms routes. Stop the candidate test process.
5. Save the previous startup file, release pointer, and public stylesheet under
   `deployment-backups/frontend-<release>`. Atomically replace `current`, install
   the release-aware startup file, sync the public stylesheet, and request a
   managed frontend restart with `cloudlinux-selector restart --json --interpreter nodejs
   --user vololead --app-root vololeads/frontend`. Selector output is suppressed
   to avoid exposing app environment data. The restart.txt marker alone did not
   replace the LiteSpeed worker on this host.
6. Verify those same public routes return Next.js markup and the expected
   `X-VoloLeads-Build` header. If activation verification fails, restore the
   previous pointer, startup file, and stylesheet and request another restart.

A dependency-install, build, or candidate-start failure leaves the live app
untouched. No normal frontend deployment writes to or restarts the backend.
The active pointer is resolved once per worker; old workers remain pinned to
their own release rather than reading a half-rebuilt `.next` directory.

On first use, `next-server.js` supports the existing flat application as a
fallback when there is no release pointer. Do not delete the old root `.next`,
old release directories, or backups while they may be needed for rollback or
by running Passenger workers. Logs are retained; candidates that fail before activation are removed automatically; monitor
disk usage and prune only releases known to be unused.

Legacy HTML and runtime scripts use literal file read paths. Asset reads are
anchored to the literal `png` and `audio` directories. Do not replace these
with `fs.readFile(path.join(process.cwd(), arbitraryName))`: file tracing can
expand that read across the entire release, including dependencies and `.next`,
and exhaust shared-host memory during "Collecting build traces". Prerender
source maps are disabled to reduce memory use after static generation.

Pricing deployment backups contain only the bootstrap, stylesheet, and billing
files replaced by the deployment. They exclude full builds, dependencies and
uploads. A pre-activation failure removes only the new candidate created by
that run. Existing releases and older backups require an explicit review before
cleanup because workers or rollback may still need them. Log write failures
stop subprocesses cleanly and report a disk quota error.

### Build failures

The command prints the candidate path and a private log file under
`/home/vololead/deployment-logs`. If a worker still aborts, inspect that log and
cPanel **Metrics → Resource Usage** at the failure time, particularly physical
memory (PMEM) and process/thread counts (NPROC). Do not rerun builds in parallel,
blindly increase heap size beyond the account allowance, or rebuild in the live
app directory. A failed build should now leave the current release serving.

### Regression checks

```bash
node --test scripts/__tests__/frontendDeployment.test.js scripts/__tests__/frontendTracing.test.js
bash -n scripts/deploy-frontend-cpanel.sh scripts/deploy-pricing-cpanel.sh
```

The tests cover install/build/startup failures, successful promotion, rollback
to flat and release-based apps, preserving environment and existing build files,
thread-setting inheritance, stale `INIT_CWD`, and worker release isolation.

## Passenger routing invariants

The frontend block belongs in `/home/vololead/public_html/.htaccess`:

```apache
# DO NOT REMOVE. CLOUDLINUX PASSENGER CONFIGURATION BEGIN
PassengerAppRoot "/home/vololead/vololeads/frontend"
PassengerBaseURI "/"
PassengerNodejs "/home/vololead/nodevenv/vololeads/frontend/22/bin/node"
PassengerAppType node
PassengerStartupFile next-server.js
# DO NOT REMOVE. CLOUDLINUX PASSENGER CONFIGURATION END
```

The backend block belongs in `/home/vololead/public_html/api/.htaccess`:

```apache
# DO NOT REMOVE. CLOUDLINUX PASSENGER CONFIGURATION BEGIN
PassengerAppRoot "/home/vololead/vololeads/backend"
PassengerBaseURI "/api"
PassengerNodejs "/home/vololead/nodevenv/vololeads/backend/22/bin/node"
PassengerAppType node
PassengerStartupFile src/server.js
# DO NOT REMOVE. CLOUDLINUX PASSENGER CONFIGURATION END
```

Do not replace the root `.htaccess` with a cache-only file. Doing so causes
LiteSpeed to show a directory listing or legacy static HTML instead of Next.js.
Do not remove `/api/.htaccess` while changing the frontend.

## Verification

Run these after deployment:

```bash
curl -sS -o /dev/null -w "HTTP %{http_code}\n" https://vololeads.com/
curl -sS https://vololeads.com/ | grep -o '__next' | head
curl -sS https://vololeads.com/api/health
```

Expected results:

- Root returns HTTP `200` and contains `__next`.
- `/api/health` returns JSON with `success: true` and `status: "OK"`.
- The root response must not be the LiteSpeed `Index of /` page.

For cache testing, append a temporary query string such as
`https://vololeads.com/?v=<commit>`. Query strings do not replace fixing the
Passenger mapping or purging stale LiteSpeed cache.

## Troubleshooting map

- **`package.json` missing / Run NPM Install disabled:** the frontend files did
  not reach `/home/vololead/vololeads/frontend`; run Deploy HEAD or inspect the
  app root in File Manager.
- **Destination file already exists:** do not relocate the app through the
  Node.js UI. Use the existing frontend app root and deploy into it.
- **No such application / broken virtual environment:** the cPanel app root,
  Node version, or virtual environment path is inconsistent. Confirm the
  frontend app uses `vololeads/frontend` and Node 22.
- **No pages or app directory:** Next.js was launched outside the frontend
  root. Run the build from `/home/vololead/vololeads/frontend`.
- **Wasm OOM, thread resource errors, or SIGABRT:** preserve the one-worker
  webpack configuration and low-thread build wrapper. Inspect the saved build
  log and PMEM/NPROC faults. Only retry using the isolated release script.
- **Live site shows `Index of /`:** inspect the root `.htaccess` and confirm
  the frontend Passenger block above. Restore the legacy `index.html` only as a
  temporary rollback while repairing routing; it is not the Next.js deployment.
- **Live site still shows old CSS:** restart the frontend app, hard-refresh, and
  purge LiteSpeed cache. Confirm the response contains current `__next` markup.

## Last-known deployment state

At the last verification, `https://vololeads.com/` returned Next.js markup and
`https://vololeads.com/api/health` returned HTTP 200 with a healthy response.
The frontend and backend were both running as separate Passenger apps.
