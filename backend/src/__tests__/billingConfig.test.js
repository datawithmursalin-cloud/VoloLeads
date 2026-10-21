const {
  PLAN_CODES,
  getPlanCode,
  getPlanConfig,
  getPlanPriceIds,
  normalizePlanCode,
  getPlanPricing,
  getSubscriptionBillingCycle
} = require('../config/billing');

describe('billing plan configuration', () => {
  const originalMonthlyPrice = process.env.STRIPE_PRICE_ESSENTIAL_MONTHLY_RECURRING;
  const originalLegacyPrice = process.env.STRIPE_PRICE_ESSENTIAL_WEEKLY_RECURRING;

  afterEach(() => {
    if (originalMonthlyPrice === undefined) delete process.env.STRIPE_PRICE_ESSENTIAL_MONTHLY_RECURRING;
    else process.env.STRIPE_PRICE_ESSENTIAL_MONTHLY_RECURRING = originalMonthlyPrice;

    if (originalLegacyPrice === undefined) delete process.env.STRIPE_PRICE_ESSENTIAL_WEEKLY_RECURRING;
    else process.env.STRIPE_PRICE_ESSENTIAL_WEEKLY_RECURRING = originalLegacyPrice;
  });

  it('maps Essential requests to the canonical monthly code', () => {
    expect(getPlanCode('essential')).toBe(PLAN_CODES.ESSENTIAL_MONTHLY);
    expect(normalizePlanCode('essential_weekly')).toBe(PLAN_CODES.ESSENTIAL_MONTHLY);
    expect(getPlanConfig('essential_weekly').billingInterval).toBe('month');
  });

  it('separates monthly prices from annual upfront totals', () => {
    expect(getPlanPricing(PLAN_CODES.PREMIUM_MONTHLY).recurringAmountCents).toBe(169900);
    expect(getPlanPricing(PLAN_CODES.PREMIUM_MONTHLY, 'annual').recurringAmountCents).toBe(1842000);
    expect(getPlanPricing(PLAN_CODES.CUSTOM_PLUS_MONTHLY).recurringAmountCents).toBe(299900);
    expect(getPlanPricing(PLAN_CODES.CUSTOM_PLUS_MONTHLY, 'annual').recurringAmountCents).toBe(3222000);
    expect(getPlanConfig(PLAN_CODES.ESSENTIAL_MONTHLY, 'annual')).toBeNull();
    expect(getPlanConfig(PLAN_CODES.PREMIUM_MONTHLY, 'weekly')).toBeNull();
  });

  it('uses the actual Stripe interval ahead of metadata for confirmation emails', () => {
    expect(getSubscriptionBillingCycle({
      metadata: { billingCycle: 'monthly' },
      items: { data: [{ price: { recurring: { interval: 'year' } } }] }
    })).toBe('annual');
    expect(getSubscriptionBillingCycle({ metadata: { billingCycle: 'annual' } })).toBe('annual');
    expect(getSubscriptionBillingCycle({})).toBe('monthly');
  });

  it('uses the new Stripe environment name before the legacy fallback', () => {
    process.env.STRIPE_PRICE_ESSENTIAL_MONTHLY_RECURRING = 'price_monthly';
    process.env.STRIPE_PRICE_ESSENTIAL_WEEKLY_RECURRING = 'price_legacy';

    expect(getPlanPriceIds(PLAN_CODES.ESSENTIAL_MONTHLY).recurring).toBe('price_monthly');

    delete process.env.STRIPE_PRICE_ESSENTIAL_MONTHLY_RECURRING;
    expect(getPlanPriceIds(PLAN_CODES.ESSENTIAL_MONTHLY).recurring).toBe('price_legacy');
  });
});
