require('dotenv').config();

const connectDB = require('../src/config/db');
const db = require('../src/config/db');
const getStripeClient = require('../src/config/stripe');
const {
  resolveStripePlanCode,
  computeServiceAccessEnd
} = require('../src/controllers/billingController');
const SubscriptionStore = require('../src/repositories/subscriptions');

async function getSubscriptionsNeedingBackfill() {
  const result = await db.query(
    `SELECT id, email, stripe_subscription_id
     FROM subscriptions
     WHERE stripe_subscription_id IS NOT NULL
       AND (current_period_start IS NULL OR current_period_end IS NULL)
     ORDER BY updated_at DESC`
  );

  return result.rows;
}

(async () => {
  await connectDB();
  const stripe = getStripeClient();
  const rows = await getSubscriptionsNeedingBackfill();
  const summary = [];

  for (const row of rows) {
    const subscription = await stripe.subscriptions.retrieve(row.stripe_subscription_id);
    let email = row.email || null;

    if (!email && subscription.customer) {
      const customer = await stripe.customers.retrieve(subscription.customer);
      if (customer && !customer.deleted) {
        email = customer.email || null;
      }
    }

    const planCode = resolveStripePlanCode(subscription) || 'unknown_plan';
    const currentPeriodEnd = subscription.current_period_end
      ? new Date(subscription.current_period_end * 1000)
      : null;

    await SubscriptionStore.upsertBySubscriptionId({
      email: email || 'unknown-subscription-email@local.invalid',
      stripeCustomerId: subscription.customer,
      stripeSubscriptionId: subscription.id,
      stripeCheckoutSessionId: null,
      planCode,
      status: subscription.status,
      cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
      currentPeriodStart: subscription.current_period_start ? new Date(subscription.current_period_start * 1000) : null,
      currentPeriodEnd,
      serviceAccessEndsAt: currentPeriodEnd && (subscription.cancel_at_period_end || subscription.status === 'canceled')
        ? computeServiceAccessEnd(currentPeriodEnd, planCode)
        : currentPeriodEnd,
      canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
      metadata: {
        stripePriceIds: subscription.items && Array.isArray(subscription.items.data)
          ? subscription.items.data.map(item => item.price && item.price.id).filter(Boolean)
          : [],
        stripePlanCode: subscription.metadata && subscription.metadata.planCode || null
      }
    });

    summary.push({
      id: row.id,
      email: email || row.email,
      stripeSubscriptionId: subscription.id,
      currentPeriodStart: subscription.current_period_start ? new Date(subscription.current_period_start * 1000).toISOString() : null,
      currentPeriodEnd: subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : null,
      status: subscription.status
    });
  }

  console.log(JSON.stringify({
    inspected: rows.length,
    updated: summary.length,
    rows: summary
  }, null, 2));
  process.exit(0);
})().catch(error => {
  console.error(error);
  process.exit(1);
});
