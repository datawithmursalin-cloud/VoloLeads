# VoloLeads cPanel Database Instructions

This project uses PostgreSQL for production data storage.

The main application tables are:

- `subscriptions`
- `contact_forms`
- `visitor_events`

## Where to check data manually on cPanel

Depending on the hosting setup, you will usually have one or more of these options:

1. `phpPgAdmin` or another PostgreSQL browser in cPanel
2. A PostgreSQL query tool in cPanel
3. SSH access with `psql`

If your host exposes a PostgreSQL UI, open the database used by the Node app and inspect the tables listed above.

## Most useful manual queries

### 1. Recent subscriptions

```sql
SELECT
  email,
  plan_code,
  status,
  stripe_customer_id,
  stripe_subscription_id,
  current_period_start,
  current_period_end,
  cancel_at_period_end,
  reminder_week3_sent_at,
  reminder_day3_sent_at,
  reminder_day1_sent_at,
  updated_at
FROM subscriptions
ORDER BY updated_at DESC;
```

### 2. Recent contact form submissions

```sql
SELECT
  name,
  email,
  phone,
  service,
  referral_source,
  status,
  created_at
FROM contact_forms
ORDER BY created_at DESC;
```

### 3. Recent visitor events

```sql
SELECT
  event_type,
  visitor_hash,
  page_url,
  page_referrer,
  timestamp
FROM visitor_events
ORDER BY timestamp DESC;
```

### 4. Subscriptions needing reminder review

```sql
SELECT
  email,
  plan_code,
  status,
  current_period_start,
  current_period_end,
  reminder_week3_sent_at,
  reminder_day3_sent_at,
  reminder_day1_sent_at
FROM subscriptions
WHERE status IN ('active', 'trialing')
ORDER BY current_period_end ASC;
```

### 5. Past-due subscriptions

```sql
SELECT
  email,
  plan_code,
  status,
  stripe_subscription_id,
  current_period_start,
  current_period_end,
  updated_at
FROM subscriptions
WHERE status = 'past_due'
ORDER BY updated_at DESC;
```

## What to verify after production deployment

### Stripe checkout

After a successful purchase, confirm that:

- a row exists in `subscriptions`
- `status` is `active`
- `stripe_customer_id` is populated
- `stripe_subscription_id` is populated
- `current_period_start` is populated
- `current_period_end` is populated

### Renewal reminders

If reminders are triggered by cron:

- confirm the subscription row has valid period dates
- confirm the appropriate reminder marker is set after a reminder is sent:
  - `reminder_week3_sent_at`
  - `reminder_day3_sent_at`
  - `reminder_day1_sent_at`

### Failed renewal

After a failed renewal, confirm:

- `status` becomes `past_due`
- the subscription row still has the correct Stripe IDs

## Notes for this project

- The current architecture uses PostgreSQL and should remain PostgreSQL-based.
- Stripe subscription lifecycle data is stored in `subscriptions`.
- Renewal reminders are based on database timing fields, not directly on `invoice.paid`.
- SMTP production values may differ from local testing values.

## Related files

- [backend/src/config/db.js](F:\Github\VoloLeads-current-site\backend\src\config\db.js)
- [backend/src/repositories/subscriptions.js](F:\Github\VoloLeads-current-site\backend\src\repositories\subscriptions.js)
- [backend/src/controllers/billingController.js](F:\Github\VoloLeads-current-site\backend\src\controllers\billingController.js)
- [POSTGRES_SCHEMA.sql](F:\Github\VoloLeads-current-site\POSTGRES_SCHEMA.sql)
