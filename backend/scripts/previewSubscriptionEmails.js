const fs = require('fs');
const path = require('path');
const { PLAN_CODES } = require('../src/config/billing');
const {
  buildSubscriptionEmailHtml,
  buildSubscriptionEmailPreviewDocument,
  getSubscriptionEmailSubject
} = require('../src/emails/subscriptionConfirmationEmail');

const PREVIEW_DIR = path.join(__dirname, '..', 'email-previews');
const APP_BASE_URL = 'https://vololeads.com';
const SAMPLE_EMAIL = 'customer@example.com';

const PREVIEWS = [
  {
    filename: 'success-essential.html',
    planCode: PLAN_CODES.ESSENTIAL_WEEKLY,
    title: 'VoloLeads Essential Email Preview',
    discountInfo: null
  },
  {
    filename: 'success-essential-discounted.html',
    planCode: PLAN_CODES.ESSENTIAL_WEEKLY,
    title: 'VoloLeads Essential Email Preview (COW Discount)',
    discountInfo: { hasDiscount: true, promoCode: 'COW2026E', discountCents: 1000 }
  },
  {
    filename: 'success-premium.html',
    planCode: PLAN_CODES.PREMIUM_MONTHLY,
    title: 'VoloLeads Growth Email Preview',
    discountInfo: null
  },
  {
    filename: 'success-premium-discounted.html',
    planCode: PLAN_CODES.PREMIUM_MONTHLY,
    title: 'VoloLeads Growth Email Preview (COW Discount)',
    discountInfo: { hasDiscount: true, promoCode: 'COW2026G', discountCents: 10000 }
  },
  {
    filename: 'success-scale.html',
    planCode: PLAN_CODES.CUSTOM_PLUS_MONTHLY,
    title: 'VoloLeads Scale Email Preview',
    discountInfo: null
  },
  {
    filename: 'success-scale-discounted.html',
    planCode: PLAN_CODES.CUSTOM_PLUS_MONTHLY,
    title: 'VoloLeads Scale Email Preview (COW Discount)',
    discountInfo: { hasDiscount: true, promoCode: 'COW2026S', discountCents: 20000 }
  }
];

fs.mkdirSync(PREVIEW_DIR, { recursive: true });

for (const preview of PREVIEWS) {
  const bodyHtml = buildSubscriptionEmailHtml({
    email: SAMPLE_EMAIL,
    planCode: preview.planCode,
    appBaseUrl: APP_BASE_URL,
    discountInfo: preview.discountInfo
  });

  const document = buildSubscriptionEmailPreviewDocument({
    title: preview.title,
    bodyHtml
  });

  const outputPath = path.join(PREVIEW_DIR, preview.filename);
  fs.writeFileSync(outputPath, document, 'utf8');

  console.log(`${preview.filename}`);
  console.log(`  subject: ${getSubscriptionEmailSubject(preview.discountInfo)}`);
  console.log(`  path: ${outputPath}`);
}

console.log('\nOpen the *-discounted.html files in your browser to verify partner pricing.');
