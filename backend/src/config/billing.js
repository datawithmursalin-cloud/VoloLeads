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
    setupPriceEnv: 'STRIPE_PRICE_ESSENTIAL_MONTHLY_SETUP',
    setupPriceEnvFallback: 'STRIPE_PRICE_ESSENTIAL_WEEKLY_SETUP',
    graceDaysAfterCancel: 7,
    billingInterval: 'month',
    pricing: {
      listDisplay: '$680/month',
      listDisplayAlt: '$8.50/hour, billed monthly',
      setupDisplay: '1 week of cost is used as a one-time setup fee at checkout',
      promoCode: 'COW2026E',
      promoDiscountCents: 5000,
      promoDisplay: '$630/month',
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
      listDisplay: '$1,235/month',
      promoCode: 'COW2026G',
      promoDiscountCents: 10000,
      promoDisplay: '$1,135/month',
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
      listDisplay: '$2,799/month',
      promoCode: 'COW2026S',
      promoDiscountCents: 20000,
      promoDisplay: '$2,599/month',
      promoExpiresLabel: COW_PROMO_EXPIRES_LABEL
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

function getPlanConfig(planCode) {
  return PLAN_CONFIG[normalizePlanCode(planCode)] || null;
}

function getPlanPriceIds(planCode) {
  const plan = getPlanConfig(planCode);
  if (!plan) return null;

  return {
    recurring: process.env[plan.recurringPriceEnv]
      || (plan.recurringPriceEnvFallback ? process.env[plan.recurringPriceEnvFallback] : '')
      || '',
    setup: plan.setupPriceEnv
      ? (process.env[plan.setupPriceEnv]
        || (plan.setupPriceEnvFallback ? process.env[plan.setupPriceEnvFallback] : '')
        || '')
      : ''
  };
}

function getPlanPricing(planCode) {
  const plan = getPlanConfig(planCode);
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

module.exports = {
  PLAN_CODES,
  LEGACY_PLAN_CODES,
  COW_PROMO_EXPIRES_LABEL,
  getPlanCode,
  normalizePlanCode,
  getPlanConfig,
  getPlanPriceIds,
  getPlanPricing,
  getPromoPricingByCode
};
