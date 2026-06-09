require('dotenv').config();

const { sendEmail } = require('../src/utils/mailer');

const configuredBaseUrl = (process.env.APP_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
const appBaseUrl = /localhost|127\.0\.0\.1/i.test(configuredBaseUrl) ? 'https://vololeads.com' : configuredBaseUrl;
const email = 'benaaf2000@gmail.com';

const plans = [
  {
    code: 'essential_weekly',
    subject: 'VoloLeads Starter email preview',
    eyebrow: 'Staffing & Training',
    headline: 'Starter is active',
    summary: 'Your dedicated cold calling support plan is now live.',
    price: '$6/hour, billed monthly',
    note: 'Your first checkout also includes the one-week setup fee deposit.',
    bullets: [
      '1 dedicated cold caller focused on your campaign',
      'Setup, onboarding, and direct CRM integration',
      'Ongoing management and daily KPI reporting'
    ]
  },
  {
    code: 'premium_monthly',
    subject: 'VoloLeads Growth email preview',
    eyebrow: 'Done-For-You System',
    headline: 'Growth is active',
    summary: 'Your outbound machine is ready to run.',
    price: '$1,235/month',
    note: 'No long-term contract. Manage or cancel from your secure billing portal anytime.',
    bullets: [
      '1 dedicated cold caller assigned to your campaign',
      'Lead sourcing, dialer infrastructure, and data cleaning',
      'Daily QA monitoring, pipeline support, and CRM support'
    ]
  },
  {
    code: 'custom_plus_monthly',
    subject: 'VoloLeads Scale email preview',
    eyebrow: 'Advanced Scaling',
    headline: 'Scale is active',
    summary: 'Your advanced scaling plan is now in motion.',
    price: '$2,799/month',
    note: 'This plan is built for higher-volume operators and includes enterprise-level support.',
    bullets: [
      'Higher calling volume with advanced KPI optimization',
      '2 dedicated cold callers plus pipeline and CRM support',
      'Comps, targeted marketing, and AI automation support'
    ]
  }
];

function buildHtml(plan) {
  const bulletMarkup = plan.bullets
    .map(item => `<tr><td style="padding:0 0 12px 0;font-size:15px;line-height:1.6;color:#dbe4f0;"><span style="display:inline-block;width:20px;color:#f97316;font-weight:700;">&#8226;</span>${item}</td></tr>`)
    .join('');

  return `
  <div style="margin:0;background:#0f172a;padding:32px 16px;font-family:Arial,sans-serif;color:#e2e8f0;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:640px;margin:0 auto;background:#111827;border:1px solid #334155;border-radius:24px;overflow:hidden;box-shadow:0 20px 50px rgba(15,23,42,0.32);">
      <tr>
        <td style="background:#f8fafc;padding:28px 32px;">
          <div style="font-size:12px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#fdba74;margin-bottom:14px;">${plan.eyebrow}</div>
          <div style="font-size:34px;line-height:1.1;font-weight:800;color:#111827;margin-bottom:10px;">${plan.headline}</div>
          <div style="font-size:16px;line-height:1.6;color:#475569;max-width:440px;">${plan.summary}</div>
        </td>
      </tr>
      <tr>
        <td style="padding:28px 32px 8px 32px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td style="padding:0 0 18px 0;"><div style="display:inline-block;padding:8px 12px;background:#2b2118;border:1px solid #fdba74;border-radius:999px;font-size:12px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#fb923c;">Payment successful</div></td>
            </tr>
            <tr>
              <td style="padding:0 0 10px 0;font-size:16px;line-height:1.7;color:#dbe4f0;">Thanks for choosing VoloLeads. Your subscription for <strong style="color:#ffffff;">${email}</strong> is now active.</td>
            </tr>
            <tr>
              <td style="padding:0 0 20px 0;font-size:28px;line-height:1.2;font-weight:800;color:#ffffff;">${plan.price}</td>
            </tr>
            <tr>
              <td style="padding:0 0 24px 0;font-size:14px;line-height:1.7;color:#94a3b8;">${plan.note}</td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:0 32px 8px 32px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#172033;border:1px solid #334155;border-radius:20px;padding:22px;">
            <tr>
              <td style="padding:0 0 14px 0;font-size:18px;font-weight:800;color:#ffffff;">Included</td>
            </tr>
            ${bulletMarkup}
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:24px 32px 32px 32px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="border-radius:999px;background:#f97316;"><a href="${appBaseUrl}/manage-subscription.html" style="display:inline-block;padding:14px 22px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;">Manage Subscription</a></td>
            </tr>
          </table>
          <div style="padding-top:18px;font-size:13px;line-height:1.7;color:#94a3b8;">Need help? Reply to this email and our team will point you in the right direction.</div>
        </td>
      </tr>
    </table>
  </div>`;
}

(async () => {
  for (const plan of plans) {
    await sendEmail({
      to: email,
      subject: plan.subject,
      text: `${plan.headline} - ${plan.summary}`,
      html: buildHtml(plan)
    });

    console.log(`sent:${plan.code}`);
  }
})().catch(error => {
  console.error(error);
  process.exit(1);
});
