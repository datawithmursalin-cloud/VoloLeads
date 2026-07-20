const { v4: uuidv4 } = require('uuid');
const logger = require('./logger');
const {
  buildMeetingWindow,
  hasScheduledMeeting
} = require('./meetingSchedule');
const {
  isGoogleMeetConfigured,
  getMeetingDurationMinutes,
  getCalendarId,
  getCalendarClient
} = require('./googleCalendarClient');
const { isMeetingSlotAvailable } = require('./meetingAvailability');
const { alertCalendarAuthFailure } = require('./calendarAuthAlert');

function extractMeetLink(event) {
  if (event.hangoutLink) {
    return event.hangoutLink;
  }

  const entryPoints = event.conferenceData && event.conferenceData.entryPoints;
  if (!Array.isArray(entryPoints)) {
    return null;
  }

  const videoEntry = entryPoints.find((entry) => entry.entryPointType === 'video');
  return videoEntry ? videoEntry.uri : null;
}

async function createMeetEvent({
  name,
  email,
  service,
  preferredDate,
  preferredTime,
  preferredTimezone,
  message,
  sourceNote = 'Booked via the VoloLeads contact form.',
  summaryPrefix = 'VoloLeads Consultation'
}) {
  if (!isGoogleMeetConfigured()) {
    logger.warn('Google Meet is not configured; skipping calendar event creation');
    return { created: false, reason: 'not_configured' };
  }

  if (!hasScheduledMeeting({ preferredDate, preferredTime })) {
    return { created: false, reason: 'no_schedule' };
  }

  const availability = await isMeetingSlotAvailable({
    preferredDate,
    preferredTime,
    preferredTimezone,
    durationMinutes: getMeetingDurationMinutes()
  });

  if (!availability.available) {
    return { created: false, reason: availability.reason };
  }

  const meetingWindow = availability.meetingWindow;
  const calendar = await getCalendarClient();

  const event = {
    summary: `${summaryPrefix} — ${name}`,
    description: [
      `Service interest: ${service}`,
      message ? `Message: ${message}` : null,
      '',
      sourceNote
    ].filter(Boolean).join('\n'),
    start: {
      dateTime: meetingWindow.startDateTime,
      timeZone: meetingWindow.timeZone
    },
    end: {
      dateTime: meetingWindow.endDateTime,
      timeZone: meetingWindow.timeZone
    },
    attendees: [{ email, displayName: name }],
    conferenceData: {
      createRequest: {
        requestId: uuidv4(),
        conferenceSolutionKey: { type: 'hangoutsMeet' }
      }
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 60 },
        { method: 'popup', minutes: 15 }
      ]
    }
  };

  let response;
  try {
    response = await calendar.events.insert({
      calendarId: getCalendarId(),
      conferenceDataVersion: 1,
      sendUpdates: 'all',
      resource: event
    });
  } catch (error) {
    await alertCalendarAuthFailure(error);
    throw error;
  }

  const meetLink = extractMeetLink(response.data);

  return {
    created: true,
    meetLink,
    eventId: response.data.id,
    htmlLink: response.data.htmlLink,
    startDateTime: meetingWindow.startDateTime,
    endDateTime: meetingWindow.endDateTime,
    timeZone: meetingWindow.timeZone
  };
}

module.exports = {
  isGoogleMeetConfigured,
  createMeetEvent,
  extractMeetLink
};
