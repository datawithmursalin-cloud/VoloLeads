# VoloLeads

[VoloLeads](https://vololeads.com) is a lead-generation platform for US real estate wholesalers. The site pairs a static marketing frontend with a Node/Express API for contact forms, visitor tracking, and Stripe subscription billing.

## Repository layout

```text
VoloLeads-current-site/
  frontend/   Static HTML/CSS/JS site (served on vololeads.com)
  backend/    Express API, Stripe webhooks, PostgreSQL, SMTP email
```

## Stack

- **Frontend:** static files + Express static server for local dev (`frontend/server.js`)
- **Backend:** Node.js, Express, PostgreSQL
- **Billing:** Stripe Checkout + webhooks
- **Email:** SMTP (contact alerts, subscription notifications, renewal reminders)
- **Security:** Cloudflare Turnstile, rate limiting, honeypot on contact form

## Local development

### Frontend

```bash
cd frontend
npm install
npm start
```

Runs at `http://localhost:3000` and proxies `/api/*` to the backend.

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your local Postgres, Stripe test keys, and SMTP settings
npm run dev
```

Runs at `http://localhost:5000`.

### Stripe webhooks (local)

```bash
stripe listen --forward-to localhost:5000/api/stripe/webhook
```

Copy the webhook signing secret into `STRIPE_WEBHOOK_SECRET` in `backend/.env`.

## Environment variables

**Only `backend/.env.example` is committed to this repo.**

Do not commit real secrets. Copy the example file locally:

```bash
cp backend/.env.example backend/.env
```

Set production values on the server (cPanel Node.js app environment or a server-side `.env` that is never pushed). Files such as `.env`, `.env.production`, and `.env.*` are gitignored.

See `backend/.env.example` for the full variable list (database, Stripe prices, SMTP, Turnstile, CORS, etc.).

## Deployment

- [LIVE_WEBSITE_DEPLOYMENT_STEPS.md](LIVE_WEBSITE_DEPLOYMENT_STEPS.md) — end-to-end production setup
- [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) — pre-launch checklist
- [CPANEL_DATABASE_INSTRUCTIONS.md](CPANEL_DATABASE_INSTRUCTIONS.md) — PostgreSQL on cPanel
- [POSTGRES_SCHEMA.sql](POSTGRES_SCHEMA.sql) — database schema reference

## Backend documentation

Detailed API and operations docs live under `backend/DOCUMENTATION/`. Start with [backend/DOCUMENTATION/00_START_HERE_Navigation_Guide.md](backend/DOCUMENTATION/00_START_HERE_Navigation_Guide.md).

## Plans (Stripe)

| Plan       | Request key   | Billing        |
|-----------|---------------|----------------|
| Essential | `essential`   | Monthly + setup fee |
| Growth    | `premium`     | Monthly        |
| Scale     | `custom_plus` | Monthly        |

Price IDs and promo codes are configured in `backend/.env` and `backend/src/config/billing.js`.

## Notes

- This project uses **PostgreSQL**. MongoDB/Mongoose is no longer part of the active stack.
- Renewal reminder emails are sent by `backend/scripts/sendRenewalReminders.js` (configure as a cron job in production).
