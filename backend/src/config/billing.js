const PLAN_CODES = {
  ESSENTIAL_WEEKLY: 'essential_weekly',
  PREMIUM_MONTHLY: 'premium_monthly',
  CUSTOM_PLUS_MONTHLY: 'custom_plus_monthly'
};

const PLAN_REQUEST_MAP = {
  essential: PLAN_CODES.ESSENTIAL_WEEKLY,
  premium: PLAN_CODES.PREMIUM_MONTHLY,
  custom_plus: PLAN_CODES.CUSTOM_PLUS_MONTHLY
};

const COW_PROMO_EXPIRES_LABEL = 'Jan 1, 2027';

const PLAN_CONFIG = {
  [PLAN_CODES.ESSENTIAL_WEEKLY]: {
    requestPlan: 'essential',
    displayName: 'Starter Monthly',
    recurringPriceEnv: 'STRIPE_PRICE_ESSENTIAL_WEEKLY_RECURRING',
    setupPriceEnv: 'STRIPE_PRICE_ESSENTIAL_WEEKLY_SETUP',
    graceDaysAfterCancel: 7,
    billingInterval: 'month',
    pricing: {
      listDisplay: '$480/month',
      listDisplayAlt: '$5.75/hour, billed monthly',
      promoCode: 'COW2026E',
      promoDiscountCents: 2000,
      promoDisplay: '$460/month',
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

function getPlanConfig(planCode) {
  return PLAN_CONFIG[planCode] || null;
}

function getPlanPriceIds(planCode) {
  const plan = getPlanConfig(planCode);
  if (!plan) return null;

  return {
    recurring: process.env[plan.recurringPriceEnv] || '',
    setup: plan.setupPriceEnv ? (process.env[plan.setupPriceEnv] || '') : ''
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
  COW_PROMO_EXPIRES_LABEL,
  getPlanCode,
  getPlanConfig,
  getPlanPriceIds,
  getPlanPricing,
  getPromoPricingByCode
};
