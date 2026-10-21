const { getPlanConfig, getPlanPriceIds, getSubscriptionBillingCycle } = require('../config/billing');

// Validate resolved IDs, including legacy fallbacks, before accepting a new checkout.
async function getVerifiedCheckoutLineItems(stripe, planCode, billingCycle = 'monthly') {
  const plan = getPlanConfig(planCode, billingCycle);
  const ids = getPlanPriceIds(planCode, billingCycle);
  if (!plan || !ids || !ids.recurring) {
    throw new Error(`Missing Stripe price configuration for ${planCode}`);
  }
  const recurring = await stripe.prices.retrieve(ids.recurring);
  if (!recurring.active || recurring.currency !== plan.pricing.currency
    || recurring.unit_amount !== plan.pricing.recurringAmountCents
    || recurring.recurring?.interval !== plan.billingInterval
    || recurring.recurring?.interval_count !== 1
    || recurring.recurring?.usage_type !== 'licensed'
    || recurring.billing_scheme !== 'per_unit'
    || recurring.transform_quantity) {
    throw new Error(`Stripe recurring price for ${planCode} must match the advertised ${billingCycle} package`);
  }
  return [{ price: ids.recurring, quantity: 1 }];
}

async function getCheckoutBillingCycle(stripe, session, subscription) {
  // Stripe upsells replace the line item; the original session metadata stays unchanged.
  const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 10 });
  const recurringItems = lineItems.data.filter(item => item.price?.recurring);
  return recurringItems.length
    ? getSubscriptionBillingCycle({ items: { data: recurringItems } })
    : getSubscriptionBillingCycle(subscription || session);
}

module.exports = { getVerifiedCheckoutLineItems, getCheckoutBillingCycle };
