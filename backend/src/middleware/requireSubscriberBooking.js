const SubscriptionStore = require('../repositories/subscriptions');
const { isSubscriptionActive, verifyBookingToken } = require('../utils/subscriptionAccess');

async function requireSubscriberBooking(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Subscriber booking access is required.'
    });
  }

  const payload = verifyBookingToken(token);
  if (!payload) {
    return res.status(403).json({
      success: false,
      message: 'Invalid or expired booking access.'
    });
  }

  let subscription = null;
  if (payload.stripeSubscriptionId) {
    subscription = await SubscriptionStore.findByStripeSubscriptionId(payload.stripeSubscriptionId);
  }

  if (!subscription && payload.subscriptionId) {
    subscription = await SubscriptionStore.findById(payload.subscriptionId);
  }

  if (!subscription || !isSubscriptionActive(subscription)) {
    return res.status(403).json({
      success: false,
      message: 'An active subscription is required to schedule this meeting.'
    });
  }

  if (subscription.email !== payload.email) {
    return res.status(403).json({
      success: false,
      message: 'Booking access does not match the subscription record.'
    });
  }

  req.subscriber = subscription;
  req.bookingTokenPayload = payload;
  return next();
}

module.exports = { requireSubscriberBooking };
