const { PLAN_CODES } = require('../config/billing');
const {
  getSubscriptionEmailSubject,
  getSubscriptionEmailText,
  getPlanEmailDetails,
  buildSubscriptionEmailHtml,
  extractDiscountFromStripeObject
} = require('../emails/subscriptionConfirmationEmail');

describe('subscriptionConfirmationEmail', () => {
  describe('standard checkout email', () => {
    it('shows the current Essential monthly price', () => {
      const details = getPlanEmailDetails(PLAN_CODES.ESSENTIAL_MONTHLY);

      expect(details.price).toBe('$8.50/hour, billed monthly');
    });

    it('shows the current Essential promotional price', () => {
      const details = getPlanEmailDetails(PLAN_CODES.ESSENTIAL_MONTHLY, {
        hasDiscount: true,
        promoCode: 'COW2026E',
        discountCents: 5000
      });

      expect(details.price).toBe('$630/month');
      expect(details.listPrice).toBe('$680/month');
    });

    it('shows full Growth price without discount markup', () => {
      const html = buildSubscriptionEmailHtml({
        email: 'test@example.com',
        planCode: PLAN_CODES.PREMIUM_MONTHLY,
        appBaseUrl: 'https://vololeads.com'
      });

      expect(html).toContain('$1,235/month');
      expect(html).toContain('Payment successful');
      expect(html).not.toContain('Partner discount');
      expect(html).not.toContain('line-through');
    });

    it('uses the standard subject line', () => {
      expect(getSubscriptionEmailSubject(null)).toBe('Your VoloLeads payment was successful');
    });
  });

  describe('discounted checkout email', () => {
    const discountInfo = {
      hasDiscount: true,
      promoCode: 'COW2026G',
      discountCents: 10000
    };

    it('shows partner pricing for Growth', () => {
      const details = getPlanEmailDetails(PLAN_CODES.PREMIUM_MONTHLY, discountInfo);

      expect(details.price).toBe('$1,135/month');
      expect(details.listPrice).toBe('$1,235/month');
      expect(details.promoCode).toBe('COW2026G');
    });

    it('renders strikethrough list price and partner badge in HTML', () => {
      const html = buildSubscriptionEmailHtml({
        email: 'test@example.com',
        planCode: PLAN_CODES.PREMIUM_MONTHLY,
        appBaseUrl: 'https://vololeads.com',
        discountInfo
      });

      expect(html).toContain('text-decoration:line-through');
      expect(html).toContain('$1,235/month');
      expect(html).toContain('$1,135/month');
      expect(html).toContain('Partner discount · COW2026G');
      expect(html).toContain('Partner discount applied');
    });

    it('uses the partner discount subject line', () => {
      expect(getSubscriptionEmailSubject(discountInfo)).toBe('Your VoloLeads partner discount is active');
    });

    it('includes promo details in plain text', () => {
      const text = getSubscriptionEmailText({
        displayName: 'Growth Monthly',
        email: 'test@example.com',
        discountInfo,
        planCode: PLAN_CODES.PREMIUM_MONTHLY
      });

      expect(text).toContain('$1,135/month');
      expect(text).toContain('COW2026G');
      expect(text).toContain('$1,235/month');
    });
  });

  describe('extractDiscountFromStripeObject', () => {
    it('reads promotion code and amount from expanded Stripe discount', () => {
      const result = extractDiscountFromStripeObject({
        promotion_code: { code: 'COW2026S' },
        coupon: { amount_off: 20000 }
      });

      expect(result).toEqual({
        hasDiscount: true,
        promoCode: 'COW2026S',
        discountCents: 20000
      });
    });

    it('returns no discount when Stripe object is missing', () => {
      expect(extractDiscountFromStripeObject(null)).toEqual({
        hasDiscount: false,
        promoCode: null,
        discountCents: 0
      });
    });
  });
});
