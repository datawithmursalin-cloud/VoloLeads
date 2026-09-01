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
Node.js `22.23.2` in Production mode.

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

- Physical app root: `/home/vololead/vololeads/frontend`
- cPanel application root: `vololeads/frontend`
- URL: `https://vololeads.com/`
- Passenger base URI: `/` (blank path in the cPanel URL field)
- Startup file: `next-server.js`
- Virtual environment: `/home/vololead/nodevenv/vololeads/frontend/22/bin/activate`

The frontend is served by Passenger at the domain root. It must not be copied
over the backend or treated as a static `public_html/index.html` site.

## Next.js build rules

The shared host has limited memory, processes, and threads. Keep the existing
low-resource settings in `frontend/next.config.js`:

- `experimental.cpus: 1`
- `experimental.memoryBasedWorkersCount: false`
- `experimental.staticGenerationMaxConcurrency: 1`
- `experimental.webpackMemoryOptimizations: true`

The frontend build must use webpack:

```text
next build --webpack
```

`frontend/package.json` uses a path-safe postinstall command that resolves the
build script from `INIT_CWD`. `frontend/scripts/build-next.js` changes to the
frontend project root before invoking Next.js. Keep this arrangement; it avoids
cPanel running the build from the virtual environment's `lib` directory.

If cPanel still runs the lifecycle script from the wrong directory, use:

```bash
cd /home/vololead/vololeads/frontend
npm install --omit=dev --ignore-scripts
node /home/vololead/vololeads/frontend/scripts/build-next.js
```

Do not use the default build from an unexpected working directory. Errors such
as “couldn't find any pages or app directory”, missing `scripts/build-next.js`,
Wasm out-of-memory, `Resource temporarily unavailable`, or `SIGABRT` usually
indicate a wrong working directory or the host resource limit.

## Normal cPanel update workflow

### Git Version Control interface

1. Open Git Version Control for the VoloLeads repository.
2. Confirm the checked-out branch is `NEXTJS`.
3. Click **Update from Remote**. This only pulls the branch.
4. Click **Deploy HEAD Commit**. This runs `.cpanel.yml`.
5. Restart the frontend Node.js application if Passenger does not reload it.
6. Hard-refresh the browser and purge LiteSpeed cache if old CSS or assets remain.

Do not repeat the manual copy step when the deployment hook succeeds.

### Terminal workflow

```bash
cd /home/vololead/repositories/VoloLeads
git switch NEXTJS
git pull --ff-only origin NEXTJS
```

The repository's `.cpanel.yml` deploys the frontend to the Passenger app root
and syncs only the stylesheet to `public_html`:

```bash
cp -a frontend/. /home/vololead/vololeads/frontend/
cp -f frontend/styles.css /home/vololead/public_html/styles.css
```

After syncing files manually:

```bash
source /home/vololead/nodevenv/vololeads/frontend/22/bin/activate
cd /home/vololead/vololeads/frontend
npm install --omit=dev
touch tmp/restart.txt
```

If `npm install` fails during postinstall, use the `--ignore-scripts` and
explicit build commands in the build section, then touch `tmp/restart.txt`.

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
  webpack configuration and avoid parallel builds. Let a prior Passenger build
  finish before retrying.
- **Live site shows `Index of /`:** inspect the root `.htaccess` and confirm
  the frontend Passenger block above. Restore the legacy `index.html` only as a
  temporary rollback while repairing routing; it is not the Next.js deployment.
- **Live site still shows old CSS:** restart the frontend app, hard-refresh, and
  purge LiteSpeed cache. Confirm the response contains current `__next` markup.

## Last-known deployment state

At the last verification, `https://vololeads.com/` returned Next.js markup and
`https://vololeads.com/api/health` returned HTTP 200 with a healthy response.
The frontend and backend were both running as separate Passenger apps.
