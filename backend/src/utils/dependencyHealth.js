const axios = require('axios');
const { getPool } = require('../config/db');
const { getCalendarClient, getCalendarId, isGoogleMeetConfigured } = require('./googleCalendarClient');
const { verifyEmailTransport } = require('./mailer');
const { alertCalendarAuthFailure } = require('./calendarAuthAlert');

const ok = (configured = true) => ({ status: 'ok', configured });
const failed = (configured = true) => ({ status: 'error', configured });

async function checkDatabase() {
  if (!process.env.DATABASE_URL) return failed(false);
  try {
    await getPool().query('SELECT 1');
    return ok();
  } catch (_) {
    return failed();
  }
}

async function checkGoogleCalendar() {
  if (!isGoogleMeetConfigured()) return failed(false);
  try {
    const calendar = await getCalendarClient();
    await calendar.events.list({
      calendarId: getCalendarId(),
      timeMin: new Date().toISOString(),
      maxResults: 1,
      singleEvents: true
    });
    return ok();
  } catch (error) {
    await alertCalendarAuthFailure(error);
    return failed();
  }
}

async function checkSmtp() {
  const configured = Boolean(
    process.env.SMTP_HOST
    && process.env.SMTP_PORT
    && process.env.SMTP_USER
    && process.env.SMTP_PASS
  );
  if (!configured) return failed(false);

  try {
    return await verifyEmailTransport() ? ok() : failed();
  } catch (_) {
    return failed();
  }
}

async function checkTurnstileConfig() {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return failed(false);

  try {
    const body = new URLSearchParams({
      secret,
      response: 'dependency-health-check'
    });
    const response = await axios.post(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      body.toString(),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 8000,
        validateStatus: () => true
      }
    );
    if (response.status < 200 || response.status >= 300) return failed();

    const result = response.data || {};
    const errorCodes = Array.isArray(result['error-codes']) ? result['error-codes'] : [];
    const invalidSecret = errorCodes.some((code) => (
      code === 'invalid-input-secret' || code === 'missing-input-secret'
    ));
    return invalidSecret ? failed() : ok();
  } catch (_) {
    return failed();
  }
}

async function checkDependencies() {
  const [database, googleCalendar, smtp, turnstile] = await Promise.all([
    checkDatabase(),
    checkGoogleCalendar(),
    checkSmtp(),
    checkTurnstileConfig()
  ]);

  return { database, googleCalendar, smtp, turnstile };
}

module.exports = {
  checkDependencies,
  checkDatabase,
  checkGoogleCalendar,
  checkSmtp,
  checkTurnstileConfig
};
