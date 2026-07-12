const logger = require('./logger');
const ContactForms = require('../repositories/contactForms');
const {
  buildMeetingWindow,
  getStandardMeetingSlotTimes,
  meetingWindowToUtcRange,
  rangesOverlap,
  resolveTimezone,
  normalizePreferredDate,
  DEFAULT_MEETING_DURATION_MINUTES
} = require('./meetingSchedule');
const { getCalendarClient, isGoogleMeetConfigured, getMeetingDurationMinutes, getCalendarId } = require('./googleCalendarClient');

function parseEventRange(event) {
  if (event.start?.dateTime && event.end?.dateTime) {
    return {
      start: new Date(event.start.dateTime),
      end: new Date(event.end.dateTime)
    };
  }

  if (event.start?.date && event.end?.date) {
    return {
      start: new Date(`${event.start.date}T00:00:00Z`),
      end: new Date(`${event.end.date}T00:00:00Z`)
    };
  }

  return null;
}

async function listCalendarEventRangesForDay({ preferredDate, preferredTimezone }) {
  if (!isGoogleMeetConfigured()) {
    return [];
  }

  const date = normalizePreferredDate(preferredDate);
  if (!date) {
    return [];
  }

  const timeZone = resolveTimezone(preferredTimezone);
  const dayStart = buildMeetingWindow({
    preferredDate: date,
    preferredTime: '00:00',
    preferredTimezone,
    durationMinutes: 1
  });
  const dayEnd = buildMeetingWindow({
    preferredDate: date,
    preferredTime: '23:59',
    preferredTimezone,
    durationMinutes: 1
  });

  if (!dayStart || !dayEnd) {
    return [];
  }

  const { start: timeMin } = meetingWindowToUtcRange(dayStart);
  const { end: timeMax } = meetingWindowToUtcRange(dayEnd);
  const calendar = await getCalendarClient();

  const response = await calendar.events.list({
    calendarId: getCalendarId(),
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    singleEvents: true,
    orderBy: 'startTime'
  });

  return (response.data.items || [])
    .map(parseEventRange)
    .filter(Boolean);
}

function isWindowBlocked(meetingWindow, eventRanges) {
  const slotRange = meetingWindowToUtcRange(meetingWindow);
  return eventRanges.some((eventRange) => rangesOverlap(slotRange, eventRange));
}

async function isMeetingSlotAvailable({
  preferredDate,
  preferredTime,
  preferredTimezone,
  durationMinutes = getMeetingDurationMinutes()
}) {
  const meetingWindow = buildMeetingWindow({
    preferredDate,
    preferredTime,
    preferredTimezone,
    durationMinutes
  });

  if (!meetingWindow) {
    return { available: false, reason: 'invalid_schedule' };
  }

  const bookedInDb = await ContactForms.countBookedSlot({
    preferredDate: meetingWindow.date,
    preferredTime: meetingWindow.time
  });

  if (bookedInDb > 0) {
    return { available: false, reason: 'slot_unavailable', meetingWindow };
  }

  if (!isGoogleMeetConfigured()) {
    return { available: true, meetingWindow };
  }

  try {
    const eventRanges = await listCalendarEventRangesForDay({
      preferredDate: meetingWindow.date,
      preferredTimezone
    });

    if (isWindowBlocked(meetingWindow, eventRanges)) {
      return { available: false, reason: 'slot_unavailable', meetingWindow };
    }
  } catch (error) {
    logger.error(`Meeting availability check failed: ${error.message}`);
    return { available: false, reason: 'availability_check_failed', meetingWindow };
  }

  return { available: true, meetingWindow };
}

async function getAvailableMeetingSlots({
  preferredDate,
  preferredTimezone = 'EST',
  durationMinutes = getMeetingDurationMinutes()
}) {
  const date = normalizePreferredDate(preferredDate);
  if (!date) {
    return { date: null, slots: [], timezone: resolveTimezone(preferredTimezone) };
  }

  const timeZone = resolveTimezone(preferredTimezone);
  const standardSlots = getStandardMeetingSlotTimes();
  let eventRanges = [];

  if (isGoogleMeetConfigured()) {
    try {
      eventRanges = await listCalendarEventRangesForDay({ preferredDate: date, preferredTimezone });
    } catch (error) {
      logger.error(`Failed to load calendar availability for ${date}: ${error.message}`);
      throw error;
    }
  }

  const availableSlots = [];

  for (const slotTime of standardSlots) {
    const meetingWindow = buildMeetingWindow({
      preferredDate: date,
      preferredTime: slotTime,
      preferredTimezone,
      durationMinutes
    });

    if (!meetingWindow) {
      continue;
    }

    const bookedInDb = await ContactForms.countBookedSlot({
      preferredDate: date,
      preferredTime: slotTime
    });

    if (bookedInDb > 0 || isWindowBlocked(meetingWindow, eventRanges)) {
      continue;
    }

    availableSlots.push(slotTime);
  }

  return {
    date,
    timezone: timeZone,
    slots: availableSlots
  };
}

module.exports = {
  isMeetingSlotAvailable,
  getAvailableMeetingSlots,
  DEFAULT_MEETING_DURATION_MINUTES
};
