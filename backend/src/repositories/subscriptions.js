const { query } = require('../config/db');
const { normalizePlanCode } = require('../config/billing');

function canonicalizePlanCode(planCode) {
  if (planCode === 'unknown_plan') return planCode;

  const normalized = normalizePlanCode(planCode);
  if (!normalized) {
    throw new Error(`Invalid subscription plan code: ${planCode}`);
  }

  return normalized;
}

function mapSubscription(row) {
  if (!row) return null;

  return {
    id: String(row.id),
    email: row.email,
    stripeCustomerId: row.stripe_customer_id,
    stripeSubscriptionId: row.stripe_subscription_id,
    stripeCheckoutSessionId: row.stripe_checkout_session_id,
    planCode: normalizePlanCode(row.plan_code) || row.plan_code,
    status: row.status,
    cancelAtPeriodEnd: row.cancel_at_period_end,
    currentPeriodStart: row.current_period_start,
    currentPeriodEnd: row.current_period_end,
    serviceAccessEndsAt: row.service_access_ends_at,
    canceledAt: row.canceled_at,
    reminderWeek3SentAt: row.reminder_week3_sent_at,
    reminderDay3SentAt: row.reminder_day3_sent_at,
    reminderDay1SentAt: row.reminder_day1_sent_at,
    onboardingMeetLink: row.onboarding_meet_link,
    onboardingCalendarEventId: row.onboarding_calendar_event_id,
    onboardingMeetingScheduledAt: row.onboarding_meeting_scheduled_at,
    metadata: row.metadata || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

async function findById(id) {
  const result = await query(
    `SELECT *
     FROM subscriptions
     WHERE id = $1
     LIMIT 1`,
    [id]
  );

  return mapSubscription(result.rows[0]);
}

async function findByCheckoutSessionId(stripeCheckoutSessionId) {
  const result = await query(
    `SELECT *
     FROM subscriptions
     WHERE stripe_checkout_session_id = $1
     LIMIT 1`,
    [stripeCheckoutSessionId]
  );

  return mapSubscription(result.rows[0]);
}

async function findByStripeSubscriptionId(stripeSubscriptionId) {
  const result = await query(
    `SELECT *
     FROM subscriptions
     WHERE stripe_subscription_id = $1
     LIMIT 1`,
    [stripeSubscriptionId]
  );

  return mapSubscription(result.rows[0]);
}

async function markOnboardingMeetingScheduled(id, { meetLink, calendarEventId }) {
  const result = await query(
    `UPDATE subscriptions
     SET onboarding_meet_link = $2,
         onboarding_calendar_event_id = $3,
         onboarding_meeting_scheduled_at = NOW(),
         updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [id, meetLink || null, calendarEventId || null]
  );

  return mapSubscription(result.rows[0]);
}

async function findLatestByEmail(email) {
  const result = await query(
    `SELECT *
     FROM subscriptions
     WHERE email = $1
     ORDER BY updated_at DESC
     LIMIT 1`,
    [email]
  );

  return mapSubscription(result.rows[0]);
}

async function touchPortalLinkSentAt(id) {
  const result = await query(
    `UPDATE subscriptions
     SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('lastPortalLinkSentAt', $2::text),
         updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [id, new Date().toISOString()]
  );

  return mapSubscription(result.rows[0]);
}

async function upsertByCheckoutSessionId(data) {
  const result = await query(
    `INSERT INTO subscriptions (
       email,
       stripe_customer_id,
       stripe_subscription_id,
       stripe_checkout_session_id,
       plan_code,
       status,
       cancel_at_period_end,
       current_period_start,
       current_period_end,
       service_access_ends_at,
       canceled_at,
       metadata,
       updated_at
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::jsonb, NOW())
     ON CONFLICT (stripe_checkout_session_id)
     DO UPDATE SET
       email = EXCLUDED.email,
       stripe_customer_id = EXCLUDED.stripe_customer_id,
       stripe_subscription_id = EXCLUDED.stripe_subscription_id,
       plan_code = EXCLUDED.plan_code,
       status = EXCLUDED.status,
       cancel_at_period_end = EXCLUDED.cancel_at_period_end,
       current_period_start = EXCLUDED.current_period_start,
       current_period_end = EXCLUDED.current_period_end,
       service_access_ends_at = EXCLUDED.service_access_ends_at,
       canceled_at = EXCLUDED.canceled_at,
       metadata = COALESCE(subscriptions.metadata, '{}'::jsonb) || EXCLUDED.metadata,
       updated_at = NOW()
     RETURNING *`,
    [
      data.email,
      data.stripeCustomerId,
      data.stripeSubscriptionId,
      data.stripeCheckoutSessionId,
      canonicalizePlanCode(data.planCode),
      data.status,
      data.cancelAtPeriodEnd || false,
      data.currentPeriodStart || null,
      data.currentPeriodEnd || null,
      data.serviceAccessEndsAt || null,
      data.canceledAt || null,
      JSON.stringify(data.metadata || {})
    ]
  );

  return mapSubscription(result.rows[0]);
}

async function upsertBySubscriptionId(data) {
  const result = await query(
    `INSERT INTO subscriptions (
       email,
       stripe_customer_id,
       stripe_subscription_id,
       stripe_checkout_session_id,
       plan_code,
       status,
       cancel_at_period_end,
       current_period_start,
       current_period_end,
       service_access_ends_at,
       canceled_at,
       metadata,
       updated_at
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::jsonb, NOW())
     ON CONFLICT (stripe_subscription_id)
     DO UPDATE SET
       email = CASE
         WHEN EXCLUDED.email = 'unknown-subscription-email@local.invalid' THEN subscriptions.email
         ELSE EXCLUDED.email
       END,
       stripe_customer_id = COALESCE(EXCLUDED.stripe_customer_id, subscriptions.stripe_customer_id),
       stripe_checkout_session_id = COALESCE(EXCLUDED.stripe_checkout_session_id, subscriptions.stripe_checkout_session_id),
       plan_code = COALESCE(EXCLUDED.plan_code, subscriptions.plan_code),
       status = EXCLUDED.status,
       cancel_at_period_end = EXCLUDED.cancel_at_period_end,
       current_period_start = EXCLUDED.current_period_start,
       current_period_end = EXCLUDED.current_period_end,
       service_access_ends_at = EXCLUDED.service_access_ends_at,
       canceled_at = EXCLUDED.canceled_at,
       metadata = COALESCE(subscriptions.metadata, '{}'::jsonb) || EXCLUDED.metadata,
       updated_at = NOW()
     RETURNING *`,
    [
      data.email,
      data.stripeCustomerId,
      data.stripeSubscriptionId,
      data.stripeCheckoutSessionId || null,
      canonicalizePlanCode(data.planCode),
      data.status,
      data.cancelAtPeriodEnd || false,
      data.currentPeriodStart || null,
      data.currentPeriodEnd || null,
      data.serviceAccessEndsAt || null,
      data.canceledAt || null,
      JSON.stringify(data.metadata || {})
    ]
  );

  return mapSubscription(result.rows[0]);
}

async function updateBySubscriptionId(stripeSubscriptionId, updates) {
  const fields = [];
  const values = [];

  const mapping = {
    stripeCustomerId: 'stripe_customer_id',
    status: 'status',
    cancelAtPeriodEnd: 'cancel_at_period_end',
    currentPeriodStart: 'current_period_start',
    currentPeriodEnd: 'current_period_end',
    serviceAccessEndsAt: 'service_access_ends_at',
    canceledAt: 'canceled_at',
    planCode: 'plan_code',
    reminderWeek3SentAt: 'reminder_week3_sent_at',
    reminderDay3SentAt: 'reminder_day3_sent_at',
    reminderDay1SentAt: 'reminder_day1_sent_at',
    metadata: 'metadata'
  };

  Object.entries(mapping).forEach(([key, column]) => {
    if (Object.prototype.hasOwnProperty.call(updates, key)) {
      const value = key === 'planCode'
        ? canonicalizePlanCode(updates[key])
        : key === 'metadata'
          ? JSON.stringify(updates[key] || {})
          : updates[key];
      values.push(value);
      fields.push(key === 'metadata'
        ? `${column} = COALESCE(${column}, '{}'::jsonb) || $${values.length}::jsonb`
        : `${column} = $${values.length}`);
    }
  });

  if (!fields.length) {
    return null;
  }

  values.push(stripeSubscriptionId);

  const result = await query(
    `UPDATE subscriptions
     SET ${fields.join(', ')}, updated_at = NOW()
     WHERE stripe_subscription_id = $${values.length}
     RETURNING *`,
    values
  );

  return mapSubscription(result.rows[0]);
}

async function findDueRenewalReminders(reminderType, now = new Date()) {
  const reminderConfig = {
    week3: {
      sentColumn: 'reminder_week3_sent_at',
      dueExpression: "current_period_start + INTERVAL '21 days'",
      guardClause: "current_period_start + INTERVAL '21 days' < current_period_end"
    },
    day3: {
      sentColumn: 'reminder_day3_sent_at',
      dueExpression: "current_period_end - INTERVAL '3 days'",
      guardClause: "current_period_end - INTERVAL '3 days' > current_period_start"
    },
    day1: {
      sentColumn: 'reminder_day1_sent_at',
      dueExpression: "current_period_end - INTERVAL '1 day'",
      guardClause: "current_period_end - INTERVAL '1 day' > current_period_start"
    }
  }[reminderType];

  if (!reminderConfig) {
    throw new Error(`Unknown reminder type: ${reminderType}`);
  }

  const result = await query(
    `SELECT *
     FROM subscriptions
     WHERE status IN ('active', 'trialing')
       AND current_period_start IS NOT NULL
       AND current_period_end IS NOT NULL
       AND cancel_at_period_end = FALSE
       AND ${reminderConfig.sentColumn} IS NULL
       AND current_period_end > $1
       AND ${reminderConfig.guardClause}
       AND ${reminderConfig.dueExpression} <= $1
     ORDER BY current_period_end ASC`,
    [now]
  );

  return result.rows.map(mapSubscription);
}

async function findAfterId(afterId, limit) {
  const result = await query(
    `SELECT *
     FROM subscriptions
     WHERE id > $1
     ORDER BY id ASC
     LIMIT $2`,
    [afterId, limit]
  );

  return result.rows.map(mapSubscription);
}

async function markReminderSent(id, reminderType, sentAt = new Date()) {
  const column = {
    week3: 'reminder_week3_sent_at',
    day3: 'reminder_day3_sent_at',
    day1: 'reminder_day1_sent_at'
  }[reminderType];

  if (!column) {
    throw new Error(`Unknown reminder type: ${reminderType}`);
  }

  const result = await query(
    `UPDATE subscriptions
     SET ${column} = $2,
         updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [id, sentAt]
  );

  return mapSubscription(result.rows[0]);
}

module.exports = {
  findById,
  findByCheckoutSessionId,
  findByStripeSubscriptionId,
  findLatestByEmail,
  findAfterId,
  findDueRenewalReminders,
  markOnboardingMeetingScheduled,
  markReminderSent,
  touchPortalLinkSentAt,
  upsertByCheckoutSessionId,
  upsertBySubscriptionId,
  updateBySubscriptionId
};
