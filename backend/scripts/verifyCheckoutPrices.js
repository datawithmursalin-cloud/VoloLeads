require('dotenv').config();
const getStripeClient = require('../src/config/stripe');
const { PLAN_CODES, getPlanPricing } = require('../src/config/billing');
const { getVerifiedCheckoutLineItems } = require('../src/utils/checkoutPricing');

async function main() {
  const stripe = getStripeClient();
  let failed = false;
  for (const code of Object.values(PLAN_CODES)) {
    const billingCycle = 'monthly';
    try {
      await getVerifiedCheckoutLineItems(stripe, code, billingCycle);
      console.log(`${code} (${billingCycle}): verified ${getPlanPricing(code, billingCycle).listDisplay}${code === PLAN_CODES.ESSENTIAL_MONTHLY ? '; no setup fee' : ''}`);
    } catch {
      failed = true;
      console.error(`${code} (${billingCycle}): verification failed. Check the configured Stripe price amount, currency, and interval.`);
    }
  }
  if (failed) process.exitCode = 1;
}

main().catch(() => {
  console.error('Stripe verification unavailable. Configure STRIPE_SECRET_KEY in the backend environment.');
  process.exitCode = 1;
});
