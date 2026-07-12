const { formatMeetingDisplay } = require('../utils/meetingSchedule');
const { escapeHtml } = require('../utils/helpers');

function getMeetingEmailSubject({ isSubscriber = false } = {}) {
  return isSubscriber
    ? 'Your VoloLeads onboarding call is scheduled'
    : 'Your VoloLeads consultation is scheduled';
}

function getSubscriberMeetingAdminSubject(planDisplayName, name) {
  return `VoloLeads Subscriber Meeting: ${planDisplayName} — ${name}`;
}

function getMeetingEmailText({
  name,
  meetLink,
  preferredDate,
  preferredTime,
  preferredTimezone,
  service,
  isSubscriber = false
}) {
  const when = formatMeetingDisplay({ preferredDate, preferredTime, preferredTimezone }) || 'your selected time';
  const intro = isSubscriber
    ? 'Thanks for subscribing to VoloLeads. Your onboarding call is confirmed.'
    : 'Thanks for reaching out to VoloLeads. Your consultation call is confirmed.';
  const serviceLabel = isSubscriber ? 'Plan' : 'Service interest';
  const lines = [
    `Hi ${name},`,
    '',
    intro,
    '',
    `When: ${when}`,
    `${serviceLabel}: ${service}`,
    '',
    `Join Google Meet: ${meetLink}`,
    '',
    'We look forward to speaking with you. Need to reschedule? Reply to this email.'
  ];

  return lines.join('\n');
}

function buildMeetingEmailHtml({
  name,
  meetLink,
  preferredDate,
  preferredTime,
  preferredTimezone,
  service,
  isSubscriber = false
}) {
  const when = formatMeetingDisplay({ preferredDate, preferredTime, preferredTimezone }) || 'your selected time';
  const eyebrow = isSubscriber ? 'Onboarding Confirmed' : 'Consultation Confirmed';
  const headline = isSubscriber ? 'Your onboarding call is set' : 'You&apos;re on the calendar';
  const intro = isSubscriber
    ? `Hi ${escapeHtml(name)}, thanks for subscribing to VoloLeads.`
    : `Hi ${escapeHtml(name)}, thanks for booking time with VoloLeads.`;
  const serviceLabel = isSubscriber ? 'Plan' : 'Service';
  const safeMeetLink = escapeHtml(meetLink);

  return `
  <div style="margin:0;background:#0f172a;padding:32px 16px;font-family:Arial,sans-serif;color:#e2e8f0;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:640px;margin:0 auto;background:#111827;border:1px solid #334155;border-radius:24px;overflow:hidden;box-shadow:0 20px 50px rgba(15,23,42,0.32);">
      <tr>
        <td style="background:#f8fafc;padding:28px 32px;">
          <div style="font-size:12px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#9a5a12;margin-bottom:14px;">${eyebrow}</div>
          <div style="font-size:34px;line-height:1.1;font-weight:800;color:#111827;margin-bottom:10px;">${headline}</div>
          <div style="font-size:16px;line-height:1.6;color:#475569;max-width:440px;">${intro}</div>
        </td>
      </tr>
      <tr>
        <td style="padding:28px 32px 8px 32px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#172033;border:1px solid #334155;border-radius:20px;padding:22px;">
            <tr>
              <td style="padding:0 0 10px 0;font-size:13px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#94a3b8;">When</td>
            </tr>
            <tr>
              <td style="padding:0 0 18px 0;font-size:18px;line-height:1.5;font-weight:700;color:#ffffff;">${escapeHtml(when)}</td>
            </tr>
            <tr>
              <td style="padding:0 0 10px 0;font-size:13px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#94a3b8;">${serviceLabel}</td>
            </tr>
            <tr>
              <td style="padding:0 0 18px 0;font-size:16px;line-height:1.6;color:#dbe4f0;">${escapeHtml(service)}</td>
            </tr>
            <tr>
              <td style="padding:0 0 10px 0;font-size:13px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#94a3b8;">Google Meet</td>
            </tr>
            <tr>
              <td style="padding:0;font-size:15px;line-height:1.6;color:#dbe4f0;word-break:break-all;">
                <a href="${safeMeetLink}" style="color:#fb923c;text-decoration:none;">${safeMeetLink}</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:24px 32px 32px 32px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="border-radius:999px;background:#f97316;">
                <a href="${safeMeetLink}" style="display:inline-block;padding:14px 22px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;">Join Google Meet</a>
              </td>
            </tr>
          </table>
          <div style="padding-top:18px;font-size:13px;line-height:1.7;color:#94a3b8;">Need to reschedule? Reply to this email and our team will help.</div>
        </td>
      </tr>
    </table>
  </div>`;
}

module.exports = {
  getMeetingEmailSubject,
  getSubscriberMeetingAdminSubject,
  getMeetingEmailText,
  buildMeetingEmailHtml
};
