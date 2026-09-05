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
  processRenewalReminders,
  resolveStripePlanCode,
  computeServiceAccessEnd,
  handleStripeWebhook
} = require('../controllers/billingController');

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
