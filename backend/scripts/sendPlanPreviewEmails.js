require('dotenv').config();

const { sendEmail } = require('../src/utils/mailer');
const { PLAN_CODES, getPlanConfig } = require('../src/config/billing');
const { buildSubscriptionEmailHtml, getSubscriptionEmailText } = require('../src/emails/subscriptionConfirmationEmail');

const configuredBaseUrl = (process.env.APP_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
const appBaseUrl = /localhost|127\.0\.0\.1/i.test(configuredBaseUrl) ? 'https://vololeads.com' : configuredBaseUrl;
const email = 'benaaf2000@gmail.com';

(async () => {
  for (const planCode of Object.values(PLAN_CODES)) {
    const plan = getPlanConfig(planCode);
    await sendEmail({
      to: email,
      subject: `VoloLeads ${plan.displayName} email preview`,
      text: getSubscriptionEmailText({ displayName: plan.displayName, email, planCode }),
      html: buildSubscriptionEmailHtml({ email, planCode, appBaseUrl })
    });
    console.log(`sent:${planCode}`);
  }
})().catch(error => {
  console.error(error);
  process.exit(1);
});
