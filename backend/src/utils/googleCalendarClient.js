const { google } = require('googleapis');
const {
  DEFAULT_MEETING_DURATION_MINUTES
} = require('./meetingSchedule');

function isGoogleMeetConfigured() {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID
    && process.env.GOOGLE_CLIENT_SECRET
    && process.env.GOOGLE_REFRESH_TOKEN
  );
}

function getMeetingDurationMinutes() {
  const configured = Number(process.env.GOOGLE_MEET_DURATION_MINUTES);
  if (Number.isFinite(configured) && configured > 0) {
    return configured;
  }

  return DEFAULT_MEETING_DURATION_MINUTES;
}

function getCalendarId() {
  return process.env.GOOGLE_CALENDAR_ID || 'primary';
}

async function getCalendarClient() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN
  });

  return google.calendar({ version: 'v3', auth: oauth2Client });
}

module.exports = {
  isGoogleMeetConfigured,
  getMeetingDurationMinutes,
  getCalendarId,
  getCalendarClient
};
