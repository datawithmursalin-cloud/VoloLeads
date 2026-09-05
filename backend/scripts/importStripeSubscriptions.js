require('dotenv').config();

const connectDB = require('../src/config/db');
const db = require('../src/config/db');
const getStripeClient = require('../src/config/stripe');
const {
  resolveStripePlanCode,
  computeServiceAccessEnd
} = require('../src/controllers/billingController');
const SubscriptionStore = require('../src/repositories/subscriptions');

async function getKnownSubscriptionIds() {
  const result = await db.query(
    `SELECT stripe_subscription_id
     FROM subscriptions
     WHERE stripe_subscription_id IS NOT NULL`
  );

  return new Set(result.rows.map(row => row.stripe_subscription_id));
}

async function importSubscription(stripe, subscription, knownIds) {
  const existed = knownIds.has(subscription.id);

  let email = null;
  if (subscription.customer) {
    const customer = await stripe.customers.retrieve(subscription.customer);
    if (customer && !customer.deleted) {
      email = customer.email || null;
    }
  }

  const planCode = resolveStripePlanCode(subscription) || 'unknown_plan';

  await SubscriptionStore.upsertBySubscriptionId({
    email: email || 'unknown-subscription-email@local.invalid',
    stripeCustomerId: subscription.customer,
    stripeSubscriptionId: subscription.id,
    stripeCheckoutSessionId: null,
    planCode,
    status: subscription.status,
    cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
    currentPeriodStart: subscription.current_period_start
      ? new Date(subscription.current_period_start * 1000)
      : null,
    currentPeriodEnd: subscription.current_period_end
      ? new Date(subscription.current_period_end * 1000)
      : null,
    serviceAccessEndsAt: subscription.current_period_end
      ? (subscription.cancel_at_period_end || subscription.status === 'canceled'
        ? computeServiceAccessEnd(new Date(subscription.current_period_end * 1000), planCode)
        : new Date(subscription.current_period_end * 1000))
      : null,
    canceledAt: subscription.canceled_at
      ? new Date(subscription.canceled_at * 1000)
      : null,
    metadata: {
      stripePriceIds: subscription.items && Array.isArray(subscription.items.data)
        ? subscription.items.data.map(item => item.price && item.price.id).filter(Boolean)
        : [],
      stripePlanCode: subscription.metadata && subscription.metadata.planCode || null
    }
  });

  return {
    imported: !existed,
    updated: existed,
    stripeSubscriptionId: subscription.id,
    email,
    planCode,
    status: subscription.status
  };
}

(async () => {
  await connectDB();
  const stripe = getStripeClient();
  const knownIds = await getKnownSubscriptionIds();
  const summary = [];
  let startingAfter = null;

  do {
    const page = await stripe.subscriptions.list({
      status: 'all',
      limit: 100,
      ...(startingAfter ? { starting_after: startingAfter } : {})
    });

    for (const subscription of page.data) {
      summary.push(await importSubscription(stripe, subscription, knownIds));
      knownIds.add(subscription.id);
    }

    startingAfter = page.has_more ? page.data[page.data.length - 1].id : null;
  } while (startingAfter);

  const imported = summary.filter(item => item.imported);
  const updated = summary.filter(item => item.updated);

  console.log(JSON.stringify({
    inspected: summary.length,
    imported: imported.length,
    updated: updated.length,
    rows: summary
  }, null, 2));

  process.exit(0);
})().catch(error => {
  console.error(error);
  process.exit(1);
});
