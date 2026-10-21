const { getPlanConfig, getPlanPriceIds, PLAN_CODES, normalizePlanCode } = require('../config/billing');

// Validate resolved IDs, including legacy fallbacks, before accepting a new checkout.
async function getVerifiedCheckoutLineItems(stripe, planCode, billingCycle = 'monthly') {
  const plan = getPlanConfig(planCode, billingCycle);
  const ids = getPlanPriceIds(planCode, billingCycle);
  if (!plan || !ids || !ids.recurring) {
    throw new Error(`Missing Stripe price configuration for ${planCode}`);
  }
  const needsSetup = normalizePlanCode(planCode) === PLAN_CODES.ESSENTIAL_MONTHLY;
  if (needsSetup && !ids.setup) throw new Error('Missing setup Stripe price for essential plan');

  const [recurring, setup] = await Promise.all([
    stripe.prices.retrieve(ids.recurring),
    needsSetup ? stripe.prices.retrieve(ids.setup) : null
  ]);
  if (!recurring.active || recurring.currency !== plan.pricing.currency
    || recurring.unit_amount !== plan.pricing.recurringAmountCents
    || recurring.recurring?.interval !== plan.billingInterval
    || recurring.recurring?.interval_count !== 1
    || recurring.recurring?.usage_type !== 'licensed'
    || recurring.billing_scheme !== 'per_unit'
    || recurring.transform_quantity) {
    throw new Error(`Stripe recurring price for ${planCode} must match the advertised ${billingCycle} package`);
  }
  const items = [{ price: ids.recurring, quantity: 1 }];
  if (needsSetup) {
    // Preserve the configured setup amount; the brief does not authorize changing it.
    if (!setup.active || setup.currency !== plan.pricing.currency || setup.type !== 'one_time'
      || !Number.isInteger(setup.unit_amount) || setup.unit_amount < 0) {
      throw new Error('Essential setup price must be an active one-time USD price');
    }
    items.unshift({ price: ids.setup, quantity: 1 });
  }
  return items;
}

module.exports = { getVerifiedCheckoutLineItems };
