const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true
    },
    stripeCustomerId: {
      type: String,
      index: true
    },
    stripeSubscriptionId: {
      type: String,
      unique: true,
      sparse: true,
      index: true
    },
    stripeCheckoutSessionId: {
      type: String,
      index: true
    },
    planCode: {
      type: String,
      required: true,
      enum: ['essential_weekly', 'premium_monthly', 'custom_plus_monthly']
    },
    status: {
      type: String,
      default: 'pending',
      enum: ['pending', 'active', 'past_due', 'canceled', 'unpaid', 'incomplete', 'incomplete_expired', 'trialing']
    },
    cancelAtPeriodEnd: {
      type: Boolean,
      default: false
    },
    currentPeriodEnd: Date,
    serviceAccessEndsAt: Date,
    canceledAt: Date,
    metadata: {
      type: Map,
      of: String,
      default: {}
    }
  },
  {
    timestamps: true,
    collection: 'subscriptions'
  }
);

module.exports = mongoose.model('Subscription', subscriptionSchema);
