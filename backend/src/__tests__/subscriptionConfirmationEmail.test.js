const { PLAN_CODES } = require('../config/billing');
const {
  getSubscriptionEmailSubject,
  getSubscriptionEmailText,
  getPlanEmailDetails,
  buildSubscriptionEmailHtml,
  extractDiscountFromStripeObject,
  resolveCheckoutDiscount
} = require('../emails/subscriptionConfirmationEmail');

describe('subscriptionConfirmationEmail', () => {
  it.each([
    [PLAN_CODES.PREMIUM_MONTHLY, '$18,420/year', '$1,535/month', '$1,968/year'],
    [PLAN_CODES.CUSTOM_PLUS_MONTHLY, '$32,220/year', '$2,685/month', '$3,768/year']
  ])('shows annual payment and monthly equivalent separately for %s', (planCode, total, equivalent, savings) => {
    const args = { email: 'test@example.com', planCode, billingCycle: 'annual', appBaseUrl: 'https://vololeads.com' };
    for (const output of [buildSubscriptionEmailHtml(args), getSubscriptionEmailText(args)]) {
      expect(output).toContain(total);
      expect(output).toContain(equivalent);
      expect(output).toContain(savings);
      expect(output).toContain('billed upfront');
      expect(output).not.toContain('Billed monthly');
    }
  });
  describe('standard checkout email', () => {
    it('shows the current Essential monthly price', () => {
      const details = getPlanEmailDetails(PLAN_CODES.ESSENTIAL_MONTHLY);

      expect(details.price).toBe('$730/month');
    });

    it('shows the current Essential promotional price', () => {
      const details = getPlanEmailDetails(PLAN_CODES.ESSENTIAL_MONTHLY, {
        hasDiscount: true,
        promoCode: 'COW2026E',
        discountCents: 5000
      });

      expect(details.price).toBe('$680/month');
      expect(details.listPrice).toBe('$730/month');
    });

    it('shows the Growth monthly rate without annual-discount markup', () => {
      const html = buildSubscriptionEmailHtml({
        email: 'test@example.com',
        planCode: PLAN_CODES.PREMIUM_MONTHLY,
        appBaseUrl: 'https://vololeads.com'
      });

      expect(html).toContain('$1,699/month');
      expect(html).toContain('Payment successful');
      expect(html).not.toContain('Partner discount');
      expect(html).not.toContain('line-through');
      expect(html).not.toContain('$1,535/month');
    });

    it('shows the original Scale monthly price', () => {
      const details = getPlanEmailDetails(PLAN_CODES.CUSTOM_PLUS_MONTHLY);

      expect(details.price).toBe('$2,999/month');
    });

    it('uses the standard subject line', () => {
      expect(getSubscriptionEmailSubject(null)).toBe('Your VoloLeads payment was successful');
    });

    it('shows the Scale monthly rate', () => {
      const html = buildSubscriptionEmailHtml({
        email: 'test@example.com', planCode: PLAN_CODES.CUSTOM_PLUS_MONTHLY,
        appBaseUrl: 'https://vololeads.com'
      });
      expect(html).not.toContain('$2,685/month');
      expect(html).toContain('$2,999/month');
      expect(html).not.toContain('line-through');
    });

    it('explains the one-time Essential bonus in HTML and plain text', () => {
      const args = { email: 'test@example.com', planCode: PLAN_CODES.ESSENTIAL_MONTHLY, appBaseUrl: 'https://vololeads.com' };
      for (const output of [buildSubscriptionEmailHtml(args), getSubscriptionEmailText(args)]) {
        expect(output).toContain('WAVV Triple Line Dialer included');
        expect(output).toContain('One-time signup bonus: 10,000 leads sourced using BatchLeads');
        expect(output).toContain('80 hours/month');
      }
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

      expect(details.price).toBe('$1,599/month');
      expect(details.listPrice).toBe('$1,699/month');
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
      expect(html).toContain('$1,699/month');
      expect(html).toContain('$1,599/month');
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

      expect(text).toContain('$1,599/month');
      expect(text).toContain('COW2026G');
      expect(text).toContain('$1,699/month');
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

  it('does not mistake a checkout-total discount including setup for a monthly discount', async () => {
    const stripe = { checkout: { sessions: { retrieve: jest.fn().mockResolvedValue({
      total_details: { amount_discount: 22500 }, discounts: []
    }) } } };
    const discount = await resolveCheckoutDiscount(stripe, { id: 'cs_test' }, null);
    expect(discount).toEqual({ hasDiscount: true, promoCode: null, discountCents: 0 });
    const details = getPlanEmailDetails(PLAN_CODES.ESSENTIAL_MONTHLY, discount);
    expect(details.price).toContain('Stripe receipt');
  });
});
