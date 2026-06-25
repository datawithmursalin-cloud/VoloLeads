const {
  PLAN_CODES,
  getPlanPricing,
  getPromoPricingByCode
} = require('../config/billing');
const { escapeHtml } = require('../utils/helpers');

function getSubscriptionEmailSubject(discountInfo = null) {
  return discountInfo && discountInfo.hasDiscount
    ? 'Your VoloLeads partner discount is active'
    : 'Your VoloLeads payment was successful';
}

function getSubscriptionEmailText({ displayName, email, discountInfo = null, planCode = null }) {
  if (discountInfo && discountInfo.hasDiscount) {
    const pricing = getPlanPricing(planCode);
    const promoCode = discountInfo.promoCode || (pricing && pricing.promoCode) || 'your promo code';
    const promoPrice = pricing && pricing.promoDisplay ? pricing.promoDisplay : 'your discounted rate';
    const listPrice = pricing && pricing.listDisplay ? pricing.listDisplay : 'the standard rate';
    return `Thanks for choosing VoloLeads. Your ${displayName} payment was successful and your subscription is now active for ${email} at ${promoPrice} (${promoCode} applied; regular price ${listPrice}).`;
  }

  return `Thanks for choosing VoloLeads. Your ${displayName} payment was successful and your subscription is now active for ${email}.`;
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
      discountInfo.discountCents = fullSession.total_details.amount_discount;
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

function getPlanEmailDetails(planCode, discountInfo = null) {
  const pricing = getPlanPricing(planCode);
  const hasDiscount = Boolean(discountInfo && discountInfo.hasDiscount);

  switch (planCode) {
    case PLAN_CODES.ESSENTIAL_WEEKLY:
      return {
        eyebrow: 'Staffing & Training',
        headline: 'Starter is active',
        summary: hasDiscount
          ? 'Your dedicated cold calling support plan is now live with your College of Wholesale partner rate.'
          : 'Your dedicated cold calling support plan is now live.',
        price: hasDiscount && pricing ? pricing.promoDisplay : '$6/hour, billed monthly',
        listPrice: hasDiscount && pricing ? pricing.listDisplay : null,
        promoCode: hasDiscount ? (discountInfo.promoCode || (pricing && pricing.promoCode)) : null,
        note: hasDiscount && pricing
          ? `Your partner discount (${discountInfo.promoCode || pricing.promoCode}) is applied every month through ${pricing.promoExpiresLabel}. Your first checkout also includes the one-week setup fee deposit.`
          : 'Your first checkout also includes the one-week setup fee deposit.',
        bullets: [
          '1 dedicated cold caller focused on your campaign',
          'Setup, onboarding, and direct CRM integration',
          'Ongoing management and daily KPI reporting'
        ]
      };
    case PLAN_CODES.PREMIUM_MONTHLY:
      return {
        eyebrow: 'Done-For-You System',
        headline: 'Growth is active',
        summary: hasDiscount
          ? 'Your outbound machine is ready to run with your College of Wholesale partner rate.'
          : 'Your outbound machine is ready to run.',
        price: hasDiscount && pricing ? pricing.promoDisplay : '$1,235/month',
        listPrice: hasDiscount && pricing ? pricing.listDisplay : null,
        promoCode: hasDiscount ? (discountInfo.promoCode || (pricing && pricing.promoCode)) : null,
        note: hasDiscount && pricing
          ? `Your partner discount (${discountInfo.promoCode || pricing.promoCode}) is applied every month through ${pricing.promoExpiresLabel}. No long-term contract — manage or cancel from your secure billing portal anytime.`
          : 'No long-term contract. Manage or cancel from your secure billing portal anytime.',
        bullets: [
          '1 dedicated cold caller assigned to your campaign',
          'Lead sourcing, dialer infrastructure, and data cleaning',
          'Daily QA monitoring, pipeline support, and CRM support'
        ]
      };
    case PLAN_CODES.CUSTOM_PLUS_MONTHLY:
      return {
        eyebrow: 'Advanced Scaling',
        headline: 'Scale is active',
        summary: hasDiscount
          ? 'Your advanced scaling plan is now in motion with your College of Wholesale partner rate.'
          : 'Your advanced scaling plan is now in motion.',
        price: hasDiscount && pricing ? pricing.promoDisplay : '$2,799/month',
        listPrice: hasDiscount && pricing ? pricing.listDisplay : null,
        promoCode: hasDiscount ? (discountInfo.promoCode || (pricing && pricing.promoCode)) : null,
        note: hasDiscount && pricing
          ? `Your partner discount (${discountInfo.promoCode || pricing.promoCode}) is applied every month through ${pricing.promoExpiresLabel}. This plan is built for higher-volume operators and includes enterprise-level support.`
          : 'This plan is built for higher-volume operators and includes enterprise-level support.',
        bullets: [
          'Higher calling volume with advanced KPI optimization',
          '2 dedicated cold callers plus pipeline and CRM support',
          'Comps, targeted marketing, and AI automation support'
        ]
      };
    default:
      return {
        eyebrow: 'Subscription Active',
        headline: 'Your VoloLeads plan is active',
        summary: 'Your subscription has been activated successfully.',
        price: '',
        listPrice: null,
        promoCode: null,
        note: '',
        bullets: []
      };
  }
}

function buildSubscriptionPriceMarkup(details) {
  if (!details.price) {
    return '';
  }

  if (details.listPrice && details.promoCode) {
    return `<tr><td style="padding:0 0 6px 0;font-size:16px;line-height:1.4;color:#64748b;text-decoration:line-through;">${details.listPrice}</td></tr>`
      + `<tr><td style="padding:0 0 8px 0;font-size:28px;line-height:1.2;font-weight:800;color:#ffffff;">${details.price}</td></tr>`
      + `<tr><td style="padding:0 0 20px 0;"><div style="display:inline-block;padding:6px 12px;background:#1e3a2f;border:1px solid #34d399;border-radius:999px;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#34d399;">Partner discount · ${details.promoCode}</div></td></tr>`;
  }

  return `<tr><td style="padding:0 0 20px 0;font-size:28px;line-height:1.2;font-weight:800;color:#ffffff;">${details.price}</td></tr>`;
}

function buildSubscriptionEmailHtml({ email, planCode, appBaseUrl, discountInfo = null, onboardingAccessToken = null }) {
  const details = getPlanEmailDetails(planCode, discountInfo);
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
            ${details.note ? `<tr><td style="padding:0 0 24px 0;font-size:14px;line-height:1.7;color:#94a3b8;">${details.note}</td></tr>` : ''}
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
${bodyHtml.trim()}
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
