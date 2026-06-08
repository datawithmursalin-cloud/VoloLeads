# VoloLeads Backend API

Production-ready Node.js/Express backend for the VoloLeads application.

## Features

- Express.js REST API
- Stripe checkout and webhook handling
- PostgreSQL-backed subscription, contact, and visitor storage
- JWT authentication scaffolding
- CORS and security middleware
- cPanel-friendly deployment

## Tech Stack

- **Runtime**: Node.js 16+
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Billing**: Stripe
- **Security**: Helmet, CORS
- **Logging**: Morgan

## Quick Start

### Development

```bash
npm install
cp .env.example .env
npm run dev
```

### Production

```bash
npm install --production
npm start
```

## Core API Endpoints

```text
GET  /api/health
POST /api/create-checkout-session
POST /api/request-manage-link
POST /api/contact
POST /api/visitors/events
POST /api/stripe/webhook
```

## Configuration

Copy `.env.example` to `.env` and configure:

- `PORT`
- `NODE_ENV`
- `JWT_SECRET`
- `DATABASE_URL`
- `DATABASE_SSL`
- `APP_BASE_URL`
- `CORS_ORIGIN`
- Stripe environment variables
- SMTP environment variables

## Scripts

- `npm start`
- `npm run dev`
- `npm test`
- `npm run send:renewal-reminders`
- `npm run send:renewal-reminders:dry-run`

## Deployment

For live deployment, use:

- [LIVE_WEBSITE_DEPLOYMENT_STEPS.md](F:\Github\VoloLeads-current-site\LIVE_WEBSITE_DEPLOYMENT_STEPS.md)
- [CPANEL_DATABASE_INSTRUCTIONS.md](F:\Github\VoloLeads-current-site\CPANEL_DATABASE_INSTRUCTIONS.md)
- [POSTGRES_SCHEMA.sql](F:\Github\VoloLeads-current-site\POSTGRES_SCHEMA.sql)

## Notes

- This backend uses PostgreSQL, not MongoDB.
- Renewal reminders are driven by the cron script, not directly by webhook events.
- Customer success emails and admin new-subscription alerts send from `checkout.session.completed` (set `SUBSCRIPTION_NOTIFY_EMAIL` or `CONTACT_EMAIL`, plus SMTP).
- Renewal rollover is updated from `invoice.paid`.
- Failed payment handling runs from `invoice.payment_failed`.
