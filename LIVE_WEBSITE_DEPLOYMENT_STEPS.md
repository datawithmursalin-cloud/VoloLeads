# VoloLeads Live Website Deployment Steps

This guide is for deploying the current VoloLeads stack to the live website on cPanel while keeping the existing architecture:

- static frontend in `frontend/`
- Node/Express backend in `backend/`
- PostgreSQL database
- Stripe checkout + webhook flow
- SMTP email sending

## 1. Prepare the PostgreSQL database in cPanel

1. Open cPanel.
2. Create a PostgreSQL database.
3. Create a PostgreSQL database user.
4. Assign the user to the database with full privileges.
5. Note the following values:
   - database host
   - database port
   - database name
   - database username
   - database password

Use those values to build `DATABASE_URL`, for example:

```env
DATABASE_URL=postgresql://DB_USER:DB_PASS@DB_HOST:5432/DB_NAME
```

If your host requires SSL for PostgreSQL, set:

```env
DATABASE_SSL=true
```

If not, use:

```env
DATABASE_SSL=false
```

The current backend creates the required tables automatically on startup. For manual inspection and SQL checks, see [CPANEL_DATABASE_INSTRUCTIONS.md](F:\Github\VoloLeads-current-site\CPANEL_DATABASE_INSTRUCTIONS.md) and [POSTGRES_SCHEMA.sql](F:\Github\VoloLeads-current-site\POSTGRES_SCHEMA.sql).

## 2. Upload the project

Upload the repo to your hosting account, for example into:

```text
/home/CPANEL_USERNAME/vololeads
```

Recommended layout:

- frontend files published from `frontend/`
- backend app kept in `backend/`

## 3. Deploy the frontend to the live domain

The frontend is static. Publish the contents of `frontend/` to your live web root, usually:

```text
/home/CPANEL_USERNAME/public_html
```

Important:

- keep `manage-subscription.html`, `success.html`, `cancel.html`, and your shared assets together
- if you use `www.vololeads.com`, make sure it resolves to the same document root or redirects consistently

## 4. Create the Node.js app in cPanel

In cPanel, open **Setup Node.js App** and create the app.

Recommended values:

- Node.js version: latest version cPanel supports for your plan
- Application mode: `production`
- Application root: `/home/CPANEL_USERNAME/vololeads/backend`
- Application URL: your site or subpath that will serve the backend
- Application startup file: `src/server.js`

Then install backend dependencies in the backend directory:

```bash
npm install --production
```

## 5. Set production environment variables

In the Node.js app environment section, set at least these variables:

```env
NODE_ENV=production
PORT=5000
JWT_SECRET=replace-with-a-long-random-secret

DATABASE_URL=postgresql://DB_USER:DB_PASS@DB_HOST:5432/DB_NAME
DATABASE_SSL=false

APP_BASE_URL=https://vololeads.com
API_BASE_URL=https://vololeads.com
CORS_ORIGIN=https://vololeads.com,https://www.vololeads.com

CONTACT_EMAIL=your real contact address
SUBSCRIPTION_NOTIFY_EMAIL=vololeads@gmail.com
THANK_YOU_PAGE=https://vololeads.com/thank-you.html

HASH_SALT=replace-with-a-long-random-value
RATE_LIMIT_WINDOW_MS=3600000
RATE_LIMIT_MAX_REQUESTS=3

TURNSTILE_SECRET_KEY=your_turnstile_secret

STRIPE_SECRET_KEY=your_live_or_test_secret_key
STRIPE_WEBHOOK_SECRET=your_live_or_test_webhook_secret
STRIPE_PRICE_ESSENTIAL_WEEKLY_RECURRING=price_xxx
STRIPE_PRICE_ESSENTIAL_WEEKLY_SETUP=price_xxx
STRIPE_PRICE_PREMIUM_MONTHLY=price_xxx
STRIPE_PRICE_CUSTOM_PLUS_MONTHLY=price_xxx

EMAIL_FROM=billing@vololeads.com
SMTP_HOST=your real SMTP host
SMTP_PORT=587
SMTP_USER=your smtp username
SMTP_PASS=your smtp password
SMTP_TLS_SERVERNAME=mail.vololeads.com
```

Notes:

- `APP_BASE_URL` should be the live website origin, not localhost.
- `CORS_ORIGIN` should include every real frontend origin you intend to use.
- For production SMTP, prefer the real hostname if it works correctly on cPanel. The current local IP + TLS override workaround can stay local-only if production hostname auth behaves properly.

## 6. Make `/api/*` reach the backend on the live site

Your live frontend must send `/api/*` requests to the backend app.

There are two common cPanel setups:

1. The Node app is mounted directly behind the same domain and `/api/*` already reaches it.
2. The Node app runs separately and Apache needs a proxy rule for `/api/*`.

On the live site, the goal is:

- `https://vololeads.com/api/health`
- `https://vololeads.com/api/create-checkout-session`
- `https://vololeads.com/api/request-manage-link`
- `https://vololeads.com/api/stripe/webhook`

all reach the Express app in `backend/src/server.js`.

If your cPanel host requires rewrite or proxy configuration, apply that at the domain level before Stripe testing.

## 7. Configure the Stripe webhook for the live site

In Stripe Dashboard:

1. Open **Developers** -> **Webhooks**
2. Add a live endpoint
3. Use this URL:

```text
https://vololeads.com/api/stripe/webhook
```

4. Subscribe at minimum to:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `invoice.paid`
   - `invoice.payment_failed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`

5. Copy the webhook signing secret into:

```env
STRIPE_WEBHOOK_SECRET=whsec_...
```

Make sure your Stripe price IDs in the environment match the same mode you are using:

- test prices with test secret/webhook
- live prices with live secret/webhook

Do not mix them.

## 8. Restart the Node app

After env vars are set, restart the Node.js app from cPanel so the backend reloads:

- PostgreSQL connection settings
- Stripe keys
- SMTP settings
- CORS settings

## 9. Set up the renewal reminder cron job

The renewal reminder system is not sent directly from the webhook. It runs from the script:

```text
backend/scripts/sendRenewalReminders.js
```

Create a cPanel cron job to run it regularly, for example once per day:

```bash
cd /home/CPANEL_USERNAME/vololeads/backend && /usr/bin/node scripts/sendRenewalReminders.js
```

If your host uses a different Node binary, use the path cPanel provides for your Node app.

Recommended schedule:

```cron
0 9 * * *
```

Use the server timezone intentionally. If you want reminders to align with a specific business timezone, we should explicitly document that before production scheduling.

## 10. Run a live verification checklist

After deployment:

1. Open the live site.
2. Confirm the homepage loads correctly.
3. Confirm `manage-subscription.html` loads correctly.
4. Test:
   - contact form
   - checkout button
   - return to success page
5. Confirm the webhook receives Stripe events.
6. Confirm the subscription row appears in PostgreSQL.
7. Confirm the manage-subscription email link works.
8. Confirm SMTP sends from the production host.

Useful checks:

- [https://vololeads.com/api/health](https://vololeads.com/api/health)
- recent rows in the `subscriptions` table
- Stripe webhook delivery logs
- backend app error logs in cPanel

## 11. Manual database checks after deployment

Use the queries in [CPANEL_DATABASE_INSTRUCTIONS.md](F:\Github\VoloLeads-current-site\CPANEL_DATABASE_INSTRUCTIONS.md) to inspect:

- latest subscriptions
- reminder markers
- failed renewals
- contact submissions
- visitor events

## 12. Things you do not need to change

You do not need to switch back to MongoDB.

You do not need to remove the PostgreSQL repository layer.

You do not need to redesign the Stripe architecture. The tested flow is already:

- checkout success email from `checkout.session.completed`
- renewal rollover from `invoice.paid`
- failure email from `invoice.payment_failed`
- reminder emails from the cron script

That is the architecture this deployment guide assumes.
