# VoloLeads

VoloLeads is a two-part web application:

- a static frontend in `frontend/`
- a Node/Express backend in `backend/`

The current live architecture is:

- PostgreSQL for persistent data
- Stripe Checkout + webhooks for subscription billing
- SMTP for transactional email
- a cron-driven renewal reminder script

## Project Structure

```text
VoloLeads-current-site/
  frontend/   static website files
  backend/    Node/Express API, Stripe webhook handling, PostgreSQL logic
```

## Current Backend Behavior

- checkout redirects customers to Stripe-hosted Checkout
- successful checkout emails are sent from `checkout.session.completed`
- subscription renewals are synchronized from `invoice.paid`
- failed renewal emails are sent from `invoice.payment_failed`
- renewal reminder emails are sent by `backend/scripts/sendRenewalReminders.js`

## Local Development

Frontend:

```bash
cd frontend
npm install
npm start
```

Backend:

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

Expected local URLs:

- frontend: `http://localhost:3000`
- backend: `http://localhost:5000`

For local Stripe webhook forwarding:

```bash
stripe listen --forward-to localhost:5000/api/stripe/webhook
```

## Live Website Deployment

For the real website deployment flow, start here:

- [LIVE_WEBSITE_DEPLOYMENT_STEPS.md](F:\Github\VoloLeads-current-site\LIVE_WEBSITE_DEPLOYMENT_STEPS.md)

That guide covers:

- cPanel PostgreSQL setup
- frontend publishing
- Node.js app setup in cPanel
- production environment variables
- Stripe live webhook setup
- renewal reminder cron setup
- live verification steps

## Database Reference

For manual database inspection and schema reference:

- [CPANEL_DATABASE_INSTRUCTIONS.md](F:\Github\VoloLeads-current-site\CPANEL_DATABASE_INSTRUCTIONS.md)
- [POSTGRES_SCHEMA.sql](F:\Github\VoloLeads-current-site\POSTGRES_SCHEMA.sql)

## Backend Reference

Backend-specific notes live here:

- [backend/DOCUMENTATION/14_MAIN_Backend_README.md](F:\Github\VoloLeads-current-site\backend\DOCUMENTATION\14_MAIN_Backend_README.md)

## Important Note

This repo now uses PostgreSQL. MongoDB/Mongoose is no longer part of the active application architecture.
