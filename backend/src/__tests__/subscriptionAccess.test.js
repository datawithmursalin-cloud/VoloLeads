const jwt = require('jsonwebtoken');
const {
  isSubscriptionActive,
  issueBookingToken,
  verifyBookingToken,
  issueOnboardingAccessToken,
  verifyOnboardingAccessToken,
  BOOKING_TOKEN_PURPOSE,
  ONBOARDING_ACCESS_PURPOSE
} = require('../utils/subscriptionAccess');

describe('subscriptionAccess', () => {
  const activeSubscription = {
    id: '12',
    email: 'subscriber@example.com',
    stripeSubscriptionId: 'sub_123',
    planCode: 'premium_monthly',
    status: 'active',
    serviceAccessEndsAt: new Date('2027-01-01T00:00:00.000Z')
  };

  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
  });

  it('treats active subscriptions with future access as active', () => {
    expect(isSubscriptionActive(activeSubscription, new Date('2026-06-01T00:00:00.000Z'))).toBe(true);
  });

  it('rejects canceled or expired subscriptions', () => {
    expect(isSubscriptionActive({ ...activeSubscription, status: 'canceled' })).toBe(false);
    expect(isSubscriptionActive({
      ...activeSubscription,
      serviceAccessEndsAt: new Date('2026-01-01T00:00:00.000Z')
    }, new Date('2026-06-01T00:00:00.000Z'))).toBe(false);
  });

  it('issues and verifies subscriber booking tokens', () => {
    const token = issueBookingToken(activeSubscription, '1h');
    const payload = verifyBookingToken(token);

    expect(payload).toMatchObject({
      purpose: BOOKING_TOKEN_PURPOSE,
      subscriptionId: activeSubscription.id,
      stripeSubscriptionId: activeSubscription.stripeSubscriptionId,
      email: activeSubscription.email,
      planCode: activeSubscription.planCode
    });
  });

  it('issues and verifies onboarding access tokens', () => {
    const token = issueOnboardingAccessToken(activeSubscription, 'cs_test_123', '1h');
    const payload = verifyOnboardingAccessToken(token);

    expect(payload).toMatchObject({
      purpose: ONBOARDING_ACCESS_PURPOSE,
      subscriptionId: activeSubscription.id,
      stripeCheckoutSessionId: 'cs_test_123',
      email: activeSubscription.email,
      planCode: activeSubscription.planCode
    });
  });

  it('rejects tokens with the wrong purpose', () => {
    const token = jwt.sign({ purpose: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1h' });
    expect(verifyBookingToken(token)).toBeNull();
  });
});
