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

const PLAN_CONFIG = {
  [PLAN_CODES.ESSENTIAL_WEEKLY]: {
    requestPlan: 'essential',
    displayName: 'Essential Weekly',
    recurringPriceEnv: 'STRIPE_PRICE_ESSENTIAL_WEEKLY_RECURRING',
    setupPriceEnv: 'STRIPE_PRICE_ESSENTIAL_WEEKLY_SETUP',
    graceDaysAfterCancel: 7,
    billingInterval: 'week'
  },
  [PLAN_CODES.PREMIUM_MONTHLY]: {
    requestPlan: 'premium',
    displayName: 'Premium Monthly',
    recurringPriceEnv: 'STRIPE_PRICE_PREMIUM_MONTHLY',
    graceDaysAfterCancel: 7,
    billingInterval: 'month'
  },
  [PLAN_CODES.CUSTOM_PLUS_MONTHLY]: {
    requestPlan: 'custom_plus',
    displayName: 'Custom+ Monthly',
    recurringPriceEnv: 'STRIPE_PRICE_CUSTOM_PLUS_MONTHLY',
    graceDaysAfterCancel: 7,
    billingInterval: 'month'
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

module.exports = {
  PLAN_CODES,
  getPlanCode,
  getPlanConfig,
  getPlanPriceIds
};
