const { sendEmail } = require('./mailer');
const logger = require('./logger');

const DEFAULT_COOLDOWN_MS = 60 * 60 * 1000;
let lastAlertAt = 0;

function isInvalidGrant(error) {
  const googleError = error && error.response && error.response.data && error.response.data.error;
  const code = error && error.code;
  const message = error && error.message;

  return [googleError, code, message]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes('invalid_grant'));
}

function getCooldownMs() {
  const configured = Number(process.env.CALENDAR_AUTH_ALERT_COOLDOWN_MS);
  return Number.isFinite(configured) && configured >= 0 ? configured : DEFAULT_COOLDOWN_MS;
}

async function alertCalendarAuthFailure(error, { now = new Date() } = {}) {
  if (!isInvalidGrant(error)) return false;

  const nowMs = now instanceof Date ? now.getTime() : Number(now);
  if (lastAlertAt && nowMs - lastAlertAt < getCooldownMs()) return false;

  // Set before sending so a mail-server failure cannot create an alert storm.
  lastAlertAt = nowMs;
  const notifyTo = process.env.CONTACT_EMAIL;
  if (!notifyTo) {
    logger.error('Google Calendar returned invalid_grant, but CONTACT_EMAIL is not configured');
    return false;
  }

  try {
    const result = await sendEmail({
      to: notifyTo,
      subject: 'URGENT: VoloLeads Google Calendar authorization failed',
      text: [
        'Google Calendar returned invalid_grant.',
        'Online scheduling is unavailable until GOOGLE_REFRESH_TOKEN is replaced.',
        `Detected at: ${new Date(nowMs).toISOString()}`,
        'Contact-form submissions will continue and will be flagged for manual scheduling.'
      ].join('\n'),
      html: '<p><strong>Google Calendar returned invalid_grant.</strong></p>'
        + '<p>Online scheduling is unavailable until <code>GOOGLE_REFRESH_TOKEN</code> is replaced.</p>'
        + `<p>Detected at: ${new Date(nowMs).toISOString()}</p>`
        + '<p>Contact-form submissions will continue and require manual scheduling.</p>'
    });

    if (!result || !result.sent) {
      logger.error('Google Calendar invalid_grant alert email was not sent');
      return false;
    }

    logger.info('Google Calendar invalid_grant alert email sent');
    return true;
  } catch (mailError) {
    logger.error(`Google Calendar invalid_grant alert failed: ${mailError.message}`);
    return false;
  }
}

function resetCalendarAuthAlertStateForTests() {
  lastAlertAt = 0;
}

module.exports = {
  isInvalidGrant,
  alertCalendarAuthFailure,
  resetCalendarAuthAlertStateForTests
};
