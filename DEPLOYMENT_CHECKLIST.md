# VoloLeads Deployment Checklist

## Credentials and values

- [ ] Production PostgreSQL database name
- [ ] Production PostgreSQL username
- [ ] Production PostgreSQL password
- [ ] `JWT_SECRET`
- [ ] `HASH_SALT`
- [ ] `TURNSTILE_SECRET_KEY`
- [ ] Stripe live secret key
- [ ] Stripe live webhook secret
- [ ] Stripe live price IDs
- [ ] SMTP username and password
- [ ] `CONTACT_EMAIL` set for contact form admin alerts (uses cPanel SMTP)
- [ ] `SUBSCRIPTION_NOTIFY_EMAIL=vololeads@gmail.com` for new subscription alerts

## cPanel database

- [ ] Create PostgreSQL database
- [ ] Create PostgreSQL database user
- [ ] Grant database user full privileges
- [ ] Confirm database host and port

## Files and app

- [ ] Upload frontend files to `public_html`
- [ ] Upload backend files to server
- [ ] Create Node.js app in cPanel
- [ ] Set startup file to `src/server.js`
- [ ] Run `npm install --production`

## Environment variables

- [ ] Add production environment variables from `backend/.env.production.example`
- [ ] Confirm `DATABASE_URL` points to production PostgreSQL
- [ ] Confirm `APP_BASE_URL=https://vololeads.com`
- [ ] Confirm `CORS_ORIGIN` includes both live domains
- [ ] Confirm Stripe values are live values, not test values

## Routing and billing

- [ ] Confirm `https://vololeads.com/api/health` reaches the backend
- [ ] Confirm `/api/*` routes to the Node.js app
- [ ] Create Stripe webhook endpoint at `https://vololeads.com/api/stripe/webhook`
- [ ] Restart the Node.js app after adding the webhook secret

## Cron and verification

- [ ] Add cron for `backend/scripts/sendRenewalReminders.js`
- [ ] Verify homepage loads
- [ ] Verify manage-subscription page loads
- [ ] Test contact form
- [ ] Test checkout flow
- [ ] Verify Stripe webhook delivery
- [ ] Verify subscription row appears in PostgreSQL
- [ ] Verify success email sends
