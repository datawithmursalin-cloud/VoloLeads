const { PLAN_CODES, getPlanPricing } = require('../config/billing');
const { getVerifiedCheckoutLineItems, getCheckoutBillingCycle } = require('../utils/checkoutPricing');

describe('checkout price verification', () => {
  const savedEnv = { ...process.env };
  let stripe;
  const monthlyPrice = amount => ({
    active: true, currency: 'usd', unit_amount: amount, billing_scheme: 'per_unit',
    recurring: { interval: 'month', interval_count: 1, usage_type: 'licensed' }
  });
  beforeEach(() => {
    process.env.STRIPE_PRICE_ESSENTIAL_MONTHLY_RECURRING = 'essential';
    process.env.STRIPE_PRICE_ESSENTIAL_MONTHLY_SETUP = 'setup';
    process.env.STRIPE_PRICE_ESSENTIAL_WEEKLY_RECURRING = 'legacy';
    process.env.STRIPE_PRICE_PREMIUM_MONTHLY = 'growth';
    process.env.STRIPE_PRICE_CUSTOM_PLUS_MONTHLY = 'scale';
    const prices = {
      essential: monthlyPrice(73000), growth: monthlyPrice(169900), scale: monthlyPrice(299900),
      legacy: { ...monthlyPrice(68000), recurring: { interval: 'week', interval_count: 1 } },
      setup: { active: true, currency: 'usd', type: 'one_time', unit_amount: 17000 }
    };
    stripe = { prices: { retrieve: jest.fn(async id => prices[id]) } };
  });
  afterEach(() => { process.env = { ...savedEnv }; });

  it.each(Object.values(PLAN_CODES))('accepts the public monthly amount for %s', async code => {
    const items = await getVerifiedCheckoutLineItems(stripe, code);
    expect(items.at(-1).quantity).toBe(1);
    expect(getPlanPricing(code).listDisplay).toMatch('/month');
  });

  it('charges only the monthly Essential price even when legacy setup IDs remain configured', async () => {
    process.env.STRIPE_PRICE_ESSENTIAL_WEEKLY_SETUP = 'unused_legacy_setup';
    expect(await getVerifiedCheckoutLineItems(stripe, PLAN_CODES.ESSENTIAL_MONTHLY)).toEqual([
      { price: 'essential', quantity: 1 }
    ]);
    expect(stripe.prices.retrieve).toHaveBeenCalledTimes(1);
    expect(stripe.prices.retrieve).toHaveBeenCalledWith('essential');
  });

  it('rejects an old or weekly legacy fallback', async () => {
    delete process.env.STRIPE_PRICE_ESSENTIAL_MONTHLY_RECURRING;
    await expect(getVerifiedCheckoutLineItems(stripe, PLAN_CODES.ESSENTIAL_MONTHLY)).rejects.toThrow('advertised monthly package');
  });

  it.each([
    { unit_amount: 68000 }, { currency: 'eur' }, { active: false },
    { recurring: { interval: 'week', interval_count: 1, usage_type: 'licensed' } },
    { recurring: { interval: 'month', interval_count: 12, usage_type: 'licensed' } },
    { transform_quantity: { divide_by: 100, round: 'up' } },
    { recurring: { interval: 'month', interval_count: 1, usage_type: 'metered' } }
  ])('rejects a mismatched recurring price %j', async override => {
    stripe.prices.retrieve.mockResolvedValue({ ...monthlyPrice(169900), ...override });
    await expect(getVerifiedCheckoutLineItems(stripe, PLAN_CODES.PREMIUM_MONTHLY)).rejects.toThrow('advertised monthly package');
  });

  it('supports Essential checkout with both setup-price variables removed', async () => {
    delete process.env.STRIPE_PRICE_ESSENTIAL_MONTHLY_SETUP;
    delete process.env.STRIPE_PRICE_ESSENTIAL_WEEKLY_SETUP;
    expect(await getVerifiedCheckoutLineItems(stripe, PLAN_CODES.ESSENTIAL_MONTHLY)).toEqual([
      { price: 'essential', quantity: 1 }
    ]);
  });

  it.each([
    [PLAN_CODES.PREMIUM_MONTHLY, 'STRIPE_PRICE_PREMIUM_ANNUAL', 1842000],
    [PLAN_CODES.CUSTOM_PLUS_MONTHLY, 'STRIPE_PRICE_CUSTOM_PLUS_ANNUAL', 3222000]
  ])('requires the annual upfront price for %s', async (code, envName, amount) => {
    process.env[envName] = 'annual';
    stripe.prices.retrieve.mockResolvedValue({ ...monthlyPrice(amount), recurring: { interval: 'year', interval_count: 1, usage_type: 'licensed' } });
    expect(await getVerifiedCheckoutLineItems(stripe, code, 'annual')).toEqual([{ price: 'annual', quantity: 1 }]);
    stripe.prices.retrieve.mockResolvedValue(monthlyPrice(amount));
    await expect(getVerifiedCheckoutLineItems(stripe, code, 'annual')).rejects.toThrow('advertised annual package');
  });

  it('never falls back to a monthly price for an unconfigured annual plan', async () => {
    delete process.env.STRIPE_PRICE_PREMIUM_ANNUAL;
    await expect(getVerifiedCheckoutLineItems(stripe, PLAN_CODES.PREMIUM_MONTHLY, 'annual')).rejects.toThrow('Missing Stripe price');
    expect(stripe.prices.retrieve).not.toHaveBeenCalled();
  });
});

describe('Stripe checkout billing choice', () => {
  it.each([['month', 'monthly'], ['year', 'annual']])('uses the selected %s line item instead of the initial monthly metadata', async (interval, expected) => {
    const stripe = { checkout: { sessions: { listLineItems: jest.fn().mockResolvedValue({
      data: [{ price: { recurring: { interval, interval_count: 1 } } }]
    }) } } };
    const session = { id: 'cs_test', metadata: { billingCycle: 'monthly' } };
    expect(await getCheckoutBillingCycle(stripe, session, session)).toBe(expected);
    expect(stripe.checkout.sessions.listLineItems).toHaveBeenCalledWith('cs_test', { limit: 10 });
  });
});
