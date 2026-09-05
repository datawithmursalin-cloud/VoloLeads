jest.mock('../config/db', () => ({
  query: jest.fn()
}));

const { query } = require('../config/db');
const SubscriptionStore = require('../repositories/subscriptions');

describe('subscriptions repository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    query.mockResolvedValue({ rows: [{ id: 1, plan_code: 'essential_monthly', metadata: {} }] });
  });

  it('canonicalizes legacy Essential codes and stores billing metadata', async () => {
    await SubscriptionStore.upsertBySubscriptionId({
      email: 'customer@example.com',
      stripeCustomerId: 'cus_123',
      stripeSubscriptionId: 'sub_123',
      planCode: 'essential_weekly',
      status: 'active',
      metadata: { checkoutAmountTotalCents: 63000, currency: 'usd' }
    });

    const params = query.mock.calls[0][1];
    expect(params[4]).toBe('essential_monthly');
    expect(JSON.parse(params[11])).toEqual({
      checkoutAmountTotalCents: 63000,
      currency: 'usd'
    });
  });

  it('rejects unrecognized plan codes before writing', async () => {
    await expect(SubscriptionStore.upsertBySubscriptionId({
      email: 'customer@example.com',
      stripeSubscriptionId: 'sub_123',
      planCode: 'starter_mystery',
      status: 'active'
    })).rejects.toThrow('Invalid subscription plan code');

    expect(query).not.toHaveBeenCalled();
  });
});
