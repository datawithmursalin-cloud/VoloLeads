jest.mock('../repositories/subscriptions', () => ({
  findDueRenewalReminders: jest.fn(),
  markReminderSent: jest.fn(),
  upsertBySubscriptionId: jest.fn(),
  updateBySubscriptionId: jest.fn()
}));

jest.mock('../config/stripe', () => jest.fn());

jest.mock('../utils/mailer', () => ({
  sendEmail: jest.fn()
}));

const SubscriptionStore = require('../repositories/subscriptions');
const getStripeClient = require('../config/stripe');
const { sendEmail } = require('../utils/mailer');
const {
  createCheckoutSession,
  processRenewalReminders,
  resolveStripePlanCode,
  computeServiceAccessEnd,
  handleStripeWebhook
} = require('../controllers/billingController');

describe('checkout billing selection', () => {
  const savedEnv = { ...process.env };
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.STRIPE_PRICE_PREMIUM_MONTHLY = 'growth_monthly';
    process.env.STRIPE_PRICE_CUSTOM_PLUS_MONTHLY = 'scale_monthly';
    process.env.STRIPE_PRICE_PREMIUM_ANNUAL = 'old_growth_annual';
    process.env.STRIPE_PRICE_CUSTOM_PLUS_ANNUAL = 'old_scale_annual';
  });
  afterEach(() => { process.env = { ...savedEnv }; });

  it.each([
    ['premium', 'premium_monthly', 'growth_monthly', 169900],
    ['custom_plus', 'custom_plus_monthly', 'scale_monthly', 299900]
  ])('checks out %s monthly and allows Stripe promotion codes', async (requestPlan, planCode, id, amount) => {
    const billingCycle = 'monthly';
    const interval = 'month';
    const stripe = {
      prices: { retrieve: jest.fn().mockResolvedValue({
        active: true, currency: 'usd', unit_amount: amount, billing_scheme: 'per_unit',
        recurring: { interval, interval_count: 1, usage_type: 'licensed' }
      }) },
      checkout: { sessions: { create: jest.fn().mockResolvedValue({ url: 'https://checkout.stripe.com/test' }) } }
    };
    getStripeClient.mockReturnValue(stripe);
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
    await createCheckoutSession({ body: { plan: requestPlan, billingCycle } }, res);
    expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(expect.objectContaining({
      line_items: [{ price: id, quantity: 1 }],
      allow_promotion_codes: true,
      metadata: { planCode, billingCycle, setupFeeIncluded: 'false' },
      subscription_data: { metadata: { planCode, billingCycle, graceDaysAfterCancel: '7' } }
    }));
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('rejects all annual and invalid cadence requests even when annual price IDs remain configured', async () => {
    for (const [plan, billingCycle] of [['essential', 'annual'], ['premium', 'annual'], ['custom_plus', 'annual'], ['premium', 'weekly']]) {
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
      await createCheckoutSession({ body: { plan, billingCycle } }, res);
      expect(res.status).toHaveBeenCalledWith(400);
    }
    expect(getStripeClient).not.toHaveBeenCalled();
  });

  it('creates Essential checkout without a setup fee even if old setup IDs remain', async () => {
    process.env.STRIPE_PRICE_ESSENTIAL_MONTHLY_RECURRING = 'essential_monthly';
    process.env.STRIPE_PRICE_ESSENTIAL_MONTHLY_SETUP = 'old_setup';
    process.env.STRIPE_PRICE_ESSENTIAL_WEEKLY_SETUP = 'older_setup';
    const stripe = {
      prices: { retrieve: jest.fn().mockResolvedValue({
        active: true, currency: 'usd', unit_amount: 73000, billing_scheme: 'per_unit',
        recurring: { interval: 'month', interval_count: 1, usage_type: 'licensed' }
      }) },
      checkout: { sessions: { create: jest.fn().mockResolvedValue({ url: 'https://checkout.stripe.com/test' }) } }
    };
    getStripeClient.mockReturnValue(stripe);
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
    await createCheckoutSession({ body: { plan: 'essential' } }, res);
    expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(expect.objectContaining({
      line_items: [{ price: 'essential_monthly', quantity: 1 }],
      allow_promotion_codes: false,
      metadata: { planCode: 'essential_monthly', billingCycle: 'monthly', setupFeeIncluded: 'false' }
    }));
    expect(stripe.prices.retrieve).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

describe('processRenewalReminders', () => {
  const now = new Date('2026-06-01T00:00:00.000Z');
  const dueSubscription = {
    id: '1',
    email: 'same@example.com',
    planCode: 'premium_monthly',
    currentPeriodEnd: new Date('2026-06-21T00:00:00.000Z')
  };

  beforeEach(() => {
    jest.clearAllMocks();
    SubscriptionStore.findDueRenewalReminders.mockResolvedValue([]);
  });

  it('returns due reminders without sending or marking in dry-run mode', async () => {
    SubscriptionStore.findDueRenewalReminders
      .mockResolvedValueOnce([dueSubscription])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const result = await processRenewalReminders(now, { dryRun: true });

    expect(result).toMatchObject({
      dryRun: true,
      sentCount: 0,
      dueCount: 1
    });
    expect(result.dueItems).toEqual([
      expect.objectContaining({
        reminderKey: 'week3',
        email: dueSubscription.email,
        planCode: dueSubscription.planCode
      })
    ]);
    expect(sendEmail).not.toHaveBeenCalled();
    expect(SubscriptionStore.markReminderSent).not.toHaveBeenCalled();
  });

  it('does not mark reminders sent when email transport skips delivery', async () => {
    SubscriptionStore.findDueRenewalReminders
      .mockResolvedValueOnce([dueSubscription])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    sendEmail.mockResolvedValue({ sent: false, skipped: true });

    const result = await processRenewalReminders(now);

    expect(result).toMatchObject({
      dryRun: false,
      sentCount: 0,
      dueCount: 1
    });
    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(SubscriptionStore.markReminderSent).not.toHaveBeenCalled();
  });
});

describe('Essential plan normalization', () => {
  it('normalizes legacy Stripe metadata to the monthly plan code', () => {
    expect(resolveStripePlanCode({
      metadata: { planCode: 'essential_weekly' },
      items: { data: [] }
    })).toBe('essential_monthly');
  });

  it('applies the cancellation grace period to legacy Essential subscriptions', () => {
    const result = computeServiceAccessEnd(
      new Date('2026-08-31T00:00:00.000Z'),
      'essential_weekly'
    );

    expect(result.toISOString()).toBe('2026-09-07T00:00:00.000Z');
  });
});

describe('Stripe status synchronization', () => {
  const originalWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  afterEach(() => {
    if (originalWebhookSecret === undefined) delete process.env.STRIPE_WEBHOOK_SECRET;
    else process.env.STRIPE_WEBHOOK_SECRET = originalWebhookSecret;
  });

  it('uses Stripe status for a failed first invoice instead of forcing past_due', async () => {
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
    const stripeSubscription = {
      id: 'sub_incomplete',
      customer: null,
      status: 'incomplete_expired',
      metadata: { planCode: 'essential_weekly' },
      items: { data: [] },
      current_period_start: null,
      current_period_end: null,
      cancel_at_period_end: false,
      canceled_at: null
    };
    const stripe = {
      webhooks: {
        constructEvent: jest.fn().mockReturnValue({
          type: 'invoice.payment_failed',
          data: {
            object: {
              subscription: stripeSubscription.id,
              customer_email: null
            }
          }
        })
      },
      subscriptions: {
        retrieve: jest.fn().mockResolvedValue(stripeSubscription)
      }
    };
    getStripeClient.mockReturnValue(stripe);
    SubscriptionStore.upsertBySubscriptionId.mockResolvedValue({});
    const req = { headers: { 'stripe-signature': 'signature' }, body: Buffer.from('{}') };
    const res = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    };

    await handleStripeWebhook(req, res);

    expect(SubscriptionStore.upsertBySubscriptionId).toHaveBeenCalledWith(
      expect.objectContaining({
        planCode: 'essential_monthly',
        status: 'incomplete_expired'
      })
    );
    expect(SubscriptionStore.updateBySubscriptionId).not.toHaveBeenCalledWith(
      stripeSubscription.id,
      { status: 'past_due' }
    );
    expect(res.json).toHaveBeenCalledWith({ received: true });
  });
});


describe('checkout promotion codes', () => {
  const priceEnv = 'STRIPE_PRICE_PREMIUM_MONTHLY';
  const originalPrice = process.env[priceEnv];

  afterEach(() => {
    if (originalPrice === undefined) delete process.env[priceEnv];
    else process.env[priceEnv] = originalPrice;
    jest.clearAllMocks();
  });

  it('starts at the regular monthly price and leaves discount redemption to Stripe', async () => {
    process.env[priceEnv] = 'price_growth_regular';
    const create = jest.fn().mockResolvedValue({ url: 'https://checkout.stripe.com/test' });
    getStripeClient.mockReturnValue({
      prices: { retrieve: jest.fn().mockResolvedValue({
        active: true, currency: 'usd', unit_amount: 169900, billing_scheme: 'per_unit',
        recurring: { interval: 'month', interval_count: 1, usage_type: 'licensed' }
      }) },
      checkout: { sessions: { create } }
    });
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };

    await createCheckoutSession({ body: { plan: 'premium', promoCode: 'COW2026G' } }, res);

    expect(create).toHaveBeenCalledWith(expect.objectContaining({
      mode: 'subscription',
      line_items: [{ price: 'price_growth_regular', quantity: 1 }],
      allow_promotion_codes: true
    }));
    expect(create.mock.calls[0][0]).not.toHaveProperty('discounts');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, url: 'https://checkout.stripe.com/test' });
  });
});
