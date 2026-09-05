const {
  PLAN_CODES,
  getPlanCode,
  getPlanConfig,
  getPlanPriceIds,
  normalizePlanCode
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

  it('uses the new Stripe environment name before the legacy fallback', () => {
    process.env.STRIPE_PRICE_ESSENTIAL_MONTHLY_RECURRING = 'price_monthly';
    process.env.STRIPE_PRICE_ESSENTIAL_WEEKLY_RECURRING = 'price_legacy';

    expect(getPlanPriceIds(PLAN_CODES.ESSENTIAL_MONTHLY).recurring).toBe('price_monthly');

    delete process.env.STRIPE_PRICE_ESSENTIAL_MONTHLY_RECURRING;
    expect(getPlanPriceIds(PLAN_CODES.ESSENTIAL_MONTHLY).recurring).toBe('price_legacy');
  });
});
