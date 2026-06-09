# VoloLeads — Developer Guide

Instructions for anyone setting up, developing, or deploying [VoloLeads](https://vololeads.com).

## What this project is

VoloLeads is a marketing site and subscription backend for US real estate wholesalers. It includes:

- a **static frontend** (HTML, CSS, vanilla JS) in `frontend/`
- a **Node/Express API** in `backend/` for contact forms, visitor tracking, Stripe billing, and email

Production site: **https://vololeads.com**

## Prerequisites

- **Node.js** 16+ and npm 8+
- **PostgreSQL** (local Docker, local install, or remote)
- **Stripe** account (test mode for local dev)
- **SMTP** credentials (for contact/subscription emails)
- **Stripe CLI** (optional, for local webhook testing)

## Repository layout

```text
VoloLeads-current-site/
  README.md                      ← you are here
  LIVE_WEBSITE_DEPLOYMENT_STEPS.md
  DEPLOYMENT_CHECKLIST.md
  CPANEL_DATABASE_INSTRUCTIONS.md
  POSTGRES_SCHEMA.sql
  frontend/
    index.html                     main landing page
    app.js                         shared frontend logic
    styles.css                     custom styles
    tailwind.css                   compiled Tailwind output
    server.js                      local static server + API proxy
  backend/
    .env.example                   committed env template (no secrets)
    src/server.js                  Express entry point
    src/config/                    db, billing, stripe
    src/controllers/               route handlers
    src/routes/                    API routes
    scripts/                       cron-style jobs (renewal reminders, etc.)
    DOCUMENTATION/                 detailed backend docs
```

## First-time setup

### 1. Clone and install

```bash
git clone <repo-url>
cd VoloLeads-current-site

cd frontend && npm install && cd ..
cd backend && npm install && cd ..
```

### 2. Database

Create a PostgreSQL database, then apply the schema:

```bash
psql "$DATABASE_URL" -f POSTGRES_SCHEMA.sql
```

Or use Docker via `backend/docker-compose.yml` if you prefer a local Postgres container.

### 3. Environment variables

**Only `backend/.env.example` is committed.** Never commit `.env`, `.env.production`, or any file with real secrets.

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` for local development. Minimum variables to configure:

| Variable | Purpose |
|----------|---------|
| `PORT` | Backend port (default `5000`) |
| `DATABASE_URL` | PostgreSQL connection string |
| `DATABASE_SSL` | `false` locally; `true` on most hosted Postgres |
| `JWT_SECRET` | Auth token signing (generate a long random string) |
| `HASH_SALT` | IP hashing for visitor tracking |
| `CORS_ORIGIN` | e.g. `http://localhost:3000` |
| `CONTACT_EMAIL` | Where contact form alerts are sent |
| `SUBSCRIPTION_NOTIFY_EMAIL` | New subscription alerts |
| `SMTP_*` | Outbound email (host, port, user, pass) |
| `EMAIL_FROM` | From address for transactional email |
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile server secret |
| `STRIPE_SECRET_KEY` | Stripe API key (use test key locally) |
| `STRIPE_WEBHOOK_SECRET` | From Stripe CLI or dashboard webhook |
| `STRIPE_PRICE_*` | Stripe Price IDs for each plan |
| `APP_BASE_URL` | Frontend URL for checkout redirects (e.g. `http://localhost:3000`) |
| `SHEETS_SYNC_API_KEY` | Protects `/api/export/*` endpoints |

Production (cPanel) uses the same variable names. Set them in the Node.js app environment panel — do not upload `.env` to the repo.

### 4. Run locally

**Terminal 1 — backend:**

```bash
cd backend
npm run dev
```

API: `http://localhost:5000`  
Health check: `http://localhost:5000/api/health`

**Terminal 2 — frontend:**

```bash
cd frontend
npm start
```

Site: `http://localhost:3000`  
The frontend dev server proxies `/api/*` to the backend.

### 5. Stripe webhooks (local)

```bash
stripe listen --forward-to localhost:5000/api/stripe/webhook
```

Copy the signing secret into `STRIPE_WEBHOOK_SECRET` in `backend/.env`.

## Architecture notes

### Frontend

- Multi-page static site (not a SPA framework).
- `frontend/app.js` handles navigation, dark mode, pricing cards, contact form, Stripe checkout buttons, cookie consent, etc.
- `frontend/server.js` is for **local dev only**; production serves static files from the web root (cPanel `public_html`).
- Plan pricing UI lives in `frontend/index.html` (flip cards in the `#plans` section).
- Card heights are equalized at runtime via `equalizePlanCardHeights()` in `app.js`.

### Backend

- **PostgreSQL** via `pg` (`backend/src/config/db.js`). MongoDB is legacy — do not reintroduce it.
- **Stripe Checkout** creates sessions; webhooks at `POST /api/stripe/webhook` sync subscription state and trigger emails.
- **Contact form** → validation, Turnstile, rate limit → SMTP alert.
- **Visitor tracking** → hashed IP + user agent stored in Postgres.

### Subscription plans

| UI name   | `data-plan` / request key | Config in `billing.js` |
|-----------|----------------------------|-------------------------|
| Essential | `essential`                | `ESSENTIAL_WEEKLY`      |
| Growth    | `premium`                  | `PREMIUM_MONTHLY`       |
| Scale     | `custom_plus`              | `CUSTOM_PLUS_MONTHLY`   |

Display prices and promo codes: `backend/src/config/billing.js`  
Stripe Price IDs: `backend/.env` (`STRIPE_PRICE_*`)

When you change plan copy or prices on the site, update **both** `frontend/index.html` and `backend/src/config/billing.js` if billing metadata is affected.

## Common development tasks

### Edit plan cards

1. Open `frontend/index.html` → `#plans` section.
2. Update front/back copy for each flip card.
3. Refresh locally; card heights recalculate on load.

### Cache bust after CSS/JS changes

HTML files reference assets with a version query string, e.g. `styles.css?v=20260610-02`. Bump the `?v=` value on all `frontend/*.html` files when deploying so browsers fetch fresh assets.

### Backend scripts

```bash
cd backend
npm run send:renewal-reminders:dry-run   # preview renewal emails
npm run lint                             # ESLint
npm test                                 # Jest
```

### Lint backend

```bash
cd backend
npm run lint
npm run lint:fix
```

## API routes (overview)

| Route | Purpose |
|-------|---------|
| `GET /api/health` | Health check |
| `POST /api/contact` | Contact form submission |
| `POST /api/visitors` | Visitor event tracking |
| `POST /api/billing/checkout` | Create Stripe Checkout session |
| `POST /api/billing/portal` | Customer billing portal |
| `POST /api/stripe/webhook` | Stripe webhook handler |
| `GET /api/export/*` | Google Sheets sync (requires `X-Sync-Api-Key`) |

Full API reference: `backend/DOCUMENTATION/02_API_Reference_All_Endpoints.md`

## Deployment

For production on vololeads.com (cPanel + Node.js + PostgreSQL):

1. [LIVE_WEBSITE_DEPLOYMENT_STEPS.md](LIVE_WEBSITE_DEPLOYMENT_STEPS.md)
2. [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)
3. [CPANEL_DATABASE_INSTRUCTIONS.md](CPANEL_DATABASE_INSTRUCTIONS.md)

**Frontend:** upload contents of `frontend/` to the web root.  
**Backend:** deploy `backend/` as a Node.js app; startup file `src/server.js`.  
**Database:** run `POSTGRES_SCHEMA.sql` once on production Postgres.

## Git and secrets

- **Commit:** code, `backend/.env.example`, docs, schema SQL.
- **Never commit:** `backend/.env`, `backend/.env.production`, API keys, Stripe secrets, SMTP passwords.
- Current branch for active work: check `git branch` (often `feature/stripe-turnstile` or `main`).

## Further reading

| Doc | Contents |
|-----|----------|
| [backend/DOCUMENTATION/00_START_HERE_Navigation_Guide.md](backend/DOCUMENTATION/00_START_HERE_Navigation_Guide.md) | Backend doc index |
| [backend/DOCUMENTATION/03_Getting_Started_Local_Setup.md](backend/DOCUMENTATION/03_Getting_Started_Local_Setup.md) | Extended local setup |
| [backend/DOCUMENTATION/18_STRIPE_Webhook_Setup.md](backend/DOCUMENTATION/18_STRIPE_Webhook_Setup.md) | Stripe webhook configuration |
| [POSTGRES_SCHEMA.sql](POSTGRES_SCHEMA.sql) | Database tables |

## Troubleshooting

| Problem | Check |
|---------|--------|
| Contact form fails | `CONTACT_EMAIL`, SMTP vars, Turnstile keys, backend running |
| Checkout fails | Stripe test/live keys, `STRIPE_PRICE_*` IDs, `APP_BASE_URL` |
| Webhook not firing | `STRIPE_WEBHOOK_SECRET`, Stripe CLI or dashboard endpoint URL |
| CORS errors | `CORS_ORIGIN` includes your frontend origin |
| DB connection fails | `DATABASE_URL`, `DATABASE_SSL`, Postgres running |
| Stale CSS/JS on live site | Bump `?v=` cache-bust strings in HTML files |

## Stack summary

- Frontend: HTML, Tailwind (compiled CSS), vanilla JS, Express static server (dev)
- Backend: Node.js, Express, PostgreSQL (`pg`), Stripe, Nodemailer
- Security: Helmet, CORS, rate limiting, Turnstile, honeypot on contact form
