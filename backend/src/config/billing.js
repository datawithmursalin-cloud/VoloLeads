const PLAN_CODES = {
  ESSENTIAL_MONTHLY: 'essential_monthly',
  PREMIUM_MONTHLY: 'premium_monthly',
  CUSTOM_PLUS_MONTHLY: 'custom_plus_monthly'
};

const LEGACY_PLAN_CODES = {
  ESSENTIAL_WEEKLY: 'essential_weekly'
};

const PLAN_REQUEST_MAP = {
  essential: PLAN_CODES.ESSENTIAL_MONTHLY,
  premium: PLAN_CODES.PREMIUM_MONTHLY,
  custom_plus: PLAN_CODES.CUSTOM_PLUS_MONTHLY
};

const COW_PROMO_EXPIRES_LABEL = 'Jan 1, 2027';

const PLAN_CONFIG = {
  [PLAN_CODES.ESSENTIAL_MONTHLY]: {
    requestPlan: 'essential',
    displayName: 'Essential Monthly',
    recurringPriceEnv: 'STRIPE_PRICE_ESSENTIAL_MONTHLY_RECURRING',
    recurringPriceEnvFallback: 'STRIPE_PRICE_ESSENTIAL_WEEKLY_RECURRING',
    graceDaysAfterCancel: 7,
    billingInterval: 'month',
    pricing: {
      recurringAmountCents: 73000,
      currency: 'usd',
      listDisplay: '$730/month',
      setupAmountCents: 15000,
      setupDisplay: '$150 one-time setup fee',
      promoCode: 'COW2026E',
      promoDiscountCents: 5000,
      promoDisplay: '$680/month',
      promoExpiresLabel: COW_PROMO_EXPIRES_LABEL
    }
  },
  [PLAN_CODES.PREMIUM_MONTHLY]: {
    requestPlan: 'premium',
    displayName: 'Growth Monthly',
    recurringPriceEnv: 'STRIPE_PRICE_PREMIUM_MONTHLY',
    graceDaysAfterCancel: 7,
    billingInterval: 'month',
    pricing: {
      recurringAmountCents: 169900,
      currency: 'usd',
      listDisplay: '$1,699/month',
      promoCode: 'COW2026G',
      promoDiscountCents: 10000,
      promoExpiresLabel: COW_PROMO_EXPIRES_LABEL
    }
  },
  [PLAN_CODES.CUSTOM_PLUS_MONTHLY]: {
    requestPlan: 'custom_plus',
    displayName: 'Scale Monthly',
    recurringPriceEnv: 'STRIPE_PRICE_CUSTOM_PLUS_MONTHLY',
    graceDaysAfterCancel: 7,
    billingInterval: 'month',
    pricing: {
      recurringAmountCents: 299900,
      currency: 'usd',
      listDisplay: '$2,999/month',
      promoCode: 'COW2026S',
      promoDiscountCents: 30000,
      promoExpiresLabel: COW_PROMO_EXPIRES_LABEL
    }
  }
};

// Retain annual details for historical subscriptions and in-flight webhook events.
// New checkout sessions and deployment checks support monthly billing only.
const ANNUAL_PLAN_CONFIG = {
  [PLAN_CODES.PREMIUM_MONTHLY]: {
    displayName: 'Growth Annual',
    recurringPriceEnv: 'STRIPE_PRICE_PREMIUM_ANNUAL',
    pricing: {
      recurringAmountCents: 1842000,
      currency: 'usd',
      listDisplay: '$18,420/year',
      monthlyEquivalentDisplay: '$1,535/month',
      monthlyOptionDisplay: '$1,699/month',
      savingsDisplay: '$1,968/year'
    }
  },
  [PLAN_CODES.CUSTOM_PLUS_MONTHLY]: {
    displayName: 'Scale Annual',
    recurringPriceEnv: 'STRIPE_PRICE_CUSTOM_PLUS_ANNUAL',
    pricing: {
      recurringAmountCents: 3222000,
      currency: 'usd',
      listDisplay: '$32,220/year',
      monthlyEquivalentDisplay: '$2,685/month',
      monthlyOptionDisplay: '$2,999/month',
      savingsDisplay: '$3,768/year'
    }
  }
};

function getPlanCode(requestPlan) {
  return PLAN_REQUEST_MAP[requestPlan] || null;
}

function normalizePlanCode(planCode) {
  if (planCode === LEGACY_PLAN_CODES.ESSENTIAL_WEEKLY) {
    return PLAN_CODES.ESSENTIAL_MONTHLY;
  }

  return Object.values(PLAN_CODES).includes(planCode) ? planCode : null;
}

function getPlanConfig(planCode, billingCycle = 'monthly') {
  const normalized = normalizePlanCode(planCode);
  const plan = PLAN_CONFIG[normalized];
  if (!plan) return null;
  if (billingCycle === 'monthly') return plan;
  if (billingCycle !== 'annual' || !ANNUAL_PLAN_CONFIG[normalized]) return null;
  return { ...plan, ...ANNUAL_PLAN_CONFIG[normalized], billingInterval: 'year' };
}

function getPlanPriceIds(planCode, billingCycle = 'monthly') {
  const plan = getPlanConfig(planCode, billingCycle);
  if (!plan) return null;

  return {
    recurring: process.env[plan.recurringPriceEnv]
      || (plan.recurringPriceEnvFallback ? process.env[plan.recurringPriceEnvFallback] : '')
      || ''
  };
}

function getPlanPricing(planCode, billingCycle = 'monthly') {
  const plan = getPlanConfig(planCode, billingCycle);
  return plan && plan.pricing ? plan.pricing : null;
}

function getPromoPricingByCode(promoCode) {
  if (!promoCode) return null;

  const normalized = promoCode.trim().toUpperCase();
  for (const planCode of Object.values(PLAN_CODES)) {
    const pricing = getPlanPricing(planCode);
    if (pricing && pricing.promoCode && pricing.promoCode.toUpperCase() === normalized) {
      return { planCode, pricing };
    }
  }

  return null;
}

function getSubscriptionBillingCycle(subscription) {
  const items = subscription?.items?.data || [];
  if (items.some(item => item.price?.recurring?.interval === 'year')) return 'annual';
  if (items.some(item => item.price?.recurring?.interval === 'month')) return 'monthly';
  return subscription?.metadata?.billingCycle === 'annual' ? 'annual' : 'monthly';
}

module.exports = {
  PLAN_CODES,
  LEGACY_PLAN_CODES,
  COW_PROMO_EXPIRES_LABEL,
  getPlanCode,
  normalizePlanCode,
  getPlanConfig,
  getPlanPriceIds,
  getPlanPricing,
  getPromoPricingByCode,
  getSubscriptionBillingCycle
};
