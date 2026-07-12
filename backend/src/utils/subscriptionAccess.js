const { generateToken, verifyToken } = require('./helpers');

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(['active', 'trialing']);
const BOOKING_TOKEN_PURPOSE = 'subscriber_booking';
const ONBOARDING_ACCESS_PURPOSE = 'subscriber_onboarding_access';
const DEFAULT_BOOKING_TOKEN_TTL = '2h';
const DEFAULT_ONBOARDING_ACCESS_TTL = '7d';

function isSubscriptionActive(subscription, now = new Date()) {
  if (!subscription) {
    return false;
  }

  if (!ACTIVE_SUBSCRIPTION_STATUSES.has(subscription.status)) {
    return false;
  }

  if (subscription.serviceAccessEndsAt) {
    const accessEndsAt = new Date(subscription.serviceAccessEndsAt);
    if (!Number.isNaN(accessEndsAt.getTime()) && accessEndsAt <= now) {
      return false;
    }
  }

  return true;
}

function issueBookingToken(subscription, expiresIn = DEFAULT_BOOKING_TOKEN_TTL) {
  return generateToken({
    purpose: BOOKING_TOKEN_PURPOSE,
    subscriptionId: subscription.id,
    stripeSubscriptionId: subscription.stripeSubscriptionId,
    email: subscription.email,
    planCode: subscription.planCode
  }, expiresIn);
}

function verifyBookingToken(token) {
  const payload = verifyToken(token);
  if (!payload || payload.purpose !== BOOKING_TOKEN_PURPOSE) {
    return null;
  }

  if (!payload.subscriptionId || !payload.email || !payload.planCode) {
    return null;
  }

  return payload;
}

function issueOnboardingAccessToken(subscription, checkoutSessionId = null, expiresIn = DEFAULT_ONBOARDING_ACCESS_TTL) {
  return generateToken({
    purpose: ONBOARDING_ACCESS_PURPOSE,
    subscriptionId: subscription.id,
    stripeSubscriptionId: subscription.stripeSubscriptionId,
    stripeCheckoutSessionId: checkoutSessionId || subscription.stripeCheckoutSessionId || null,
    email: subscription.email,
    planCode: subscription.planCode
  }, expiresIn);
}

function verifyOnboardingAccessToken(token) {
  const payload = verifyToken(token);
  if (!payload || payload.purpose !== ONBOARDING_ACCESS_PURPOSE) {
    return null;
  }

  if (!payload.subscriptionId || !payload.email || !payload.planCode) {
    return null;
  }

  return payload;
}

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

module.exports = {
  ACTIVE_SUBSCRIPTION_STATUSES,
  BOOKING_TOKEN_PURPOSE,
  ONBOARDING_ACCESS_PURPOSE,
  DEFAULT_BOOKING_TOKEN_TTL,
  DEFAULT_ONBOARDING_ACCESS_TTL,
  isSubscriptionActive,
  issueBookingToken,
  verifyBookingToken,
  issueOnboardingAccessToken,
  verifyOnboardingAccessToken,
  delay
};
