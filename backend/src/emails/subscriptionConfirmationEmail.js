const {
  PLAN_CODES,
  normalizePlanCode,
  getPlanPricing,
  getPromoPricingByCode
} = require('../config/billing');
const { escapeHtml } = require('../utils/helpers');

function getSubscriptionEmailSubject(discountInfo = null) {
  return discountInfo && discountInfo.hasDiscount
    ? 'Your VoloLeads partner discount is active'
    : 'Your VoloLeads payment was successful';
}

function getSubscriptionEmailText({ displayName, email, discountInfo = null, planCode = null, billingCycle = 'monthly' }) {
  const details = getPlanEmailDetails(planCode, discountInfo, billingCycle);
  const price = details.price ? ` at ${details.price}` : '';
  const original = details.originalPrice || details.listPrice;
  const originalNote = original ? ` Original price: ${original}.` : '';
  const publicNote = details.originalPrice && details.listPrice ? ` Public discounted price: ${details.listPrice}.` : '';
  const promoNote = details.promoCode ? ` Applied code: ${details.promoCode}.` : '';
  return `Thanks for choosing VoloLeads. Your ${displayName} payment was successful and your subscription is now active for ${email}${price}.${originalNote}${publicNote}${promoNote} ${details.note} Includes: ${details.bullets.join('; ')}.`;
}

function extractDiscountFromStripeObject(discountObject) {
  if (!discountObject) {
    return { hasDiscount: false, promoCode: null, discountCents: 0 };
  }

  const promotionCode = discountObject.promotion_code;
  const coupon = discountObject.coupon;
  const promoCode = promotionCode && typeof promotionCode === 'object' ? promotionCode.code : null;
  const discountCents = coupon && typeof coupon === 'object' ? (coupon.amount_off || 0) : 0;

  return {
    hasDiscount: Boolean(promoCode || discountCents),
    promoCode,
    discountCents
  };
}

async function resolveCheckoutDiscount(stripe, session, stripeSubscription) {
  let discountInfo = extractDiscountFromStripeObject(
    stripeSubscription && stripeSubscription.discount
  );

  if (!discountInfo.hasDiscount && session && session.id) {
    const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
      expand: ['discounts.promotion_code', 'discounts.coupon']
    });

    if (fullSession.total_details && fullSession.total_details.amount_discount) {
      // Checkout totals can include the setup fee; they are not a monthly discount.
      discountInfo.hasDiscount = true;
    }

    if (Array.isArray(fullSession.discounts) && fullSession.discounts.length > 0) {
      const sessionDiscount = extractDiscountFromStripeObject(fullSession.discounts[0]);
      if (sessionDiscount.hasDiscount) {
        discountInfo = sessionDiscount;
      }
    }
  }

  if (discountInfo.promoCode) {
    const knownPromo = getPromoPricingByCode(discountInfo.promoCode);
    if (knownPromo && !discountInfo.discountCents && knownPromo.pricing.promoDiscountCents) {
      discountInfo.discountCents = knownPromo.pricing.promoDiscountCents;
    }
  }

  return discountInfo;
}

function formatRecurringPrice(cents, billingCycle) {
  return `$${(cents / 100).toLocaleString('en-US', { maximumFractionDigits: 2 })}/${billingCycle === 'annual' ? 'year' : 'month'}`;
}

function getPlanEmailDetails(planCode, discountInfo = null, billingCycle = 'monthly') {
  const normalizedPlanCode = normalizePlanCode(planCode);
  const pricing = getPlanPricing(planCode, billingCycle);
  const hasDiscount = Boolean(discountInfo && discountInfo.hasDiscount);
  const promoCode = hasDiscount ? discountInfo.promoCode : null;
  const knownPromo = promoCode ? getPromoPricingByCode(promoCode) : null;
  const knownPlanPromo = billingCycle === 'monthly' && knownPromo && knownPromo.planCode === normalizedPlanCode;
  const discountCents = hasDiscount
    ? discountInfo.discountCents || (knownPlanPromo ? pricing.promoDiscountCents : 0)
    : 0;
  const price = pricing ? (hasDiscount
    ? discountCents > 0
      ? formatRecurringPrice(Math.max(0, pricing.recurringAmountCents - discountCents), billingCycle)
      : 'See your Stripe receipt for your discounted recurring price'
    : pricing.listDisplay) : '';
  const priceDetails = {
    price,
    priceLabel: hasDiscount ? 'After applied discount' : billingCycle === 'annual' ? 'Annual payment, billed upfront' : 'Monthly package',
    listPrice: pricing ? (hasDiscount ? pricing.listDisplay : pricing.originalDisplay || null) : null,
    originalPrice: hasDiscount && pricing ? pricing.originalDisplay || null : null,
    promoCode,
    hasDiscount
  };
  const discountNote = hasDiscount
    ? `Your checkout discount${promoCode ? ` (${promoCode})` : ''} is applied. See your Stripe receipt for its duration and billing details. `
    : '';

  const billingNote = billingCycle === 'annual' && pricing
    ? `${pricing.monthlyEquivalentDisplay} equivalent, with ${pricing.listDisplay} billed upfront each year. Save ${pricing.savingsDisplay} compared with ${pricing.monthlyOptionDisplay} on monthly billing. `
    : 'Billed monthly. ';

  switch (normalizedPlanCode) {
    case PLAN_CODES.ESSENTIAL_MONTHLY:
      return {
        ...priceDetails,
        eyebrow: 'Dedicated Cold Calling Support',
        headline: 'Essential is active',
        summary: 'Your dedicated cold calling support plan is now live.',
        note: `${discountNote}Billed monthly with no setup fee. Additional lead sourcing and CRM costs are separate. The signup bonus consists of sourced records, not qualified opportunities or guaranteed results.`,
        bullets: [
          '1 dedicated cold caller, 80 hours/month, with a VA manager',
          'WAVV Triple Line Dialer included',
          'One-time signup bonus: 10,000 leads sourced using BatchLeads, at no additional charge',
          'Setup, training, and direct CRM integration',
          'Ongoing management and daily KPI reporting'
        ]
      };
    case PLAN_CODES.PREMIUM_MONTHLY:
      return {
        ...priceDetails,
        eyebrow: 'Done-For-You System',
        headline: 'Growth is active',
        summary: 'Your outbound machine is ready to run.',
        note: `${billingNote}${discountNote}Manage your subscription and renewal from your secure billing portal.`,
        bullets: [
          '1 dedicated cold caller assigned to your campaign',
          'Monthly lead sourcing, WAVV Triple Line Dialer, and data cleaning',
          'Daily QA monitoring, pipeline support, and CRM support'
        ]
      };
    case PLAN_CODES.CUSTOM_PLUS_MONTHLY:
      return {
        ...priceDetails,
        eyebrow: 'Advanced Scaling',
        headline: 'Scale is active',
        summary: 'Your advanced scaling plan is now in motion.',
        note: `${billingNote}${discountNote}This plan is built for higher-volume operators and includes enterprise-level support.`,
        bullets: [
          'Advanced KPI optimization and monthly lead sourcing',
          '2 dedicated cold callers, WAVV Triple Line Dialer, plus pipeline and CRM support',
          'Comps, targeted marketing, and AI automation support'
        ]
      };
    default:
      return {
        ...priceDetails,
        eyebrow: 'Subscription Active',
        headline: 'Your VoloLeads plan is active',
        summary: 'Your subscription has been activated successfully.',
        note: '',
        bullets: []
      };
  }
}

function buildSubscriptionPriceMarkup(details) {
  if (!details.price) return '';
  const original = details.originalPrice
    ? `<tr><td style="padding:0 0 6px;color:#94a3b8;">Original: <s>${escapeHtml(details.originalPrice)}</s></td></tr>` : '';
  const list = details.listPrice
    ? `<tr><td style="padding:0 0 6px;font-size:16px;color:#94a3b8;">${details.hasDiscount ? 'Before applied discount' : 'Original'}: <s style="text-decoration:line-through;">${escapeHtml(details.listPrice)}</s></td></tr>` : '';
  const badge = details.promoCode
    ? `<tr><td style="padding:0 0 20px;color:#34d399;">Partner discount · ${escapeHtml(details.promoCode)}</td></tr>` : '';
  return original + list
    + `<tr><td style="padding:0 0 6px;color:#94a3b8;">${details.priceLabel}</td></tr>`
    + `<tr><td style="padding:0 0 20px;font-size:28px;font-weight:800;color:#ffffff;">${escapeHtml(details.price)}</td></tr>`
    + badge;
}

function buildSubscriptionEmailHtml({ email, planCode, appBaseUrl, discountInfo = null, onboardingAccessToken = null, billingCycle = 'monthly' }) {
  const details = getPlanEmailDetails(planCode, discountInfo, billingCycle);
  const bulletMarkup = details.bullets
    .map(item => `<tr><td style="padding:0 0 12px 0;font-size:15px;line-height:1.6;color:#dbe4f0;"><span style="display:inline-block;width:20px;color:#f97316;font-weight:700;">&#8226;</span>${item}</td></tr>`)
    .join('');
  const priceMarkup = buildSubscriptionPriceMarkup(details);
  const statusLabel = details.promoCode ? 'Partner discount applied' : 'Payment successful';
  const scheduleHref = onboardingAccessToken
    ? `${appBaseUrl}/schedule-onboarding.html#access_token=${encodeURIComponent(onboardingAccessToken)}`
    : `${appBaseUrl}/success.html`;
  const scheduleCta = onboardingAccessToken
    ? `<tr><td style="padding:0 12px 0 0;"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td style="border-radius:999px;background:#f97316;"><a href="${scheduleHref}" style="display:inline-block;padding:14px 22px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;">Schedule Onboarding Call</a></td></tr></table></td></tr>`
    : '';

  return `
  <div style="margin:0;background:#0f172a;padding:32px 16px;font-family:Arial,sans-serif;color:#e2e8f0;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:640px;margin:0 auto;background:#111827;border:1px solid #334155;border-radius:24px;overflow:hidden;box-shadow:0 20px 50px rgba(15,23,42,0.32);">
      <tr>
        <td style="background:#f8fafc;padding:28px 32px;">
          <div style="font-size:12px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#9a5a12;margin-bottom:14px;">${details.eyebrow}</div>
          <div style="font-size:34px;line-height:1.1;font-weight:800;color:#111827;margin-bottom:10px;">${details.headline}</div>
          <div style="font-size:16px;line-height:1.6;color:#475569;max-width:440px;">${details.summary}</div>
        </td>
      </tr>
      <tr>
        <td style="padding:28px 32px 8px 32px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td style="padding:0 0 18px 0;">
                <div style="display:inline-block;padding:8px 12px;background:#2b2118;border:1px solid #fdba74;border-radius:999px;font-size:12px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#fb923c;">${statusLabel}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:0 0 10px 0;font-size:16px;line-height:1.7;color:#dbe4f0;">Thanks for choosing VoloLeads. Your subscription for <strong style="color:#ffffff;">${escapeHtml(email)}</strong> is now active.</td>
            </tr>
            ${priceMarkup}
            ${details.note ? `<tr><td style="padding:0 0 24px 0;font-size:14px;line-height:1.7;color:#94a3b8;">${escapeHtml(details.note)}</td></tr>` : ''}
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:0 32px 8px 32px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#172033;border:1px solid #334155;border-radius:20px;padding:22px;">
            <tr>
              <td style="padding:0 0 14px 0;font-size:18px;font-weight:800;color:#ffffff;">What&apos;s included</td>
            </tr>
            ${bulletMarkup}
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:24px 32px 32px 32px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0">
            ${scheduleCta}
            <tr>
              <td style="border-radius:999px;background:#1e293b;border:1px solid #334155;">
                <a href="${appBaseUrl}/manage-subscription.html" style="display:inline-block;padding:14px 22px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;">Manage Subscription</a>
              </td>
            </tr>
          </table>
          <div style="padding-top:18px;font-size:13px;line-height:1.7;color:#94a3b8;">Need help? Reply to this email and our team will point you in the right direction.</div>
        </td>
      </tr>
    </table>
  </div>`;
}

function buildSubscriptionEmailPreviewDocument({ title, bodyHtml }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body>
${bodyHtml.trim().split('\n').map(line => line.trimEnd()).join('\n')}
</body>
</html>`;
}

module.exports = {
  getSubscriptionEmailSubject,
  getSubscriptionEmailText,
  getPlanEmailDetails,
  buildSubscriptionEmailHtml,
  buildSubscriptionEmailPreviewDocument,
  extractDiscountFromStripeObject,
  resolveCheckoutDiscount
};
