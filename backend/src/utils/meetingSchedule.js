const TIMEZONE_MAP = {
  EST: 'America/New_York',
  EDT: 'America/New_York',
  ET: 'America/New_York',
  CST: 'America/Chicago',
  CDT: 'America/Chicago',
  CT: 'America/Chicago',
  MST: 'America/Denver',
  MDT: 'America/Denver',
  MT: 'America/Denver',
  PST: 'America/Los_Angeles',
  PDT: 'America/Los_Angeles',
  PT: 'America/Los_Angeles',
  UTC: 'UTC'
};

const DEFAULT_MEETING_DURATION_MINUTES = 30;
const MEETING_SLOT_START_HOUR = 9;
const MEETING_SLOT_END_HOUR = 16;
const MEETING_SLOT_END_MINUTE = 30;
const MEETING_SLOT_INTERVAL_MINUTES = 30;
const MINIMUM_BOOKING_NOTICE_HOURS = 24;

function getZonedParts(utcMs, timeZone) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    })
      .formatToParts(new Date(utcMs))
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value])
  );

  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour === '24' ? '0' : parts.hour),
    minute: Number(parts.minute)
  };
}

function zonedDateTimeToUtcDate(date, time, timeZone) {
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  let utcMs = Date.UTC(year, month - 1, day, hour, minute, 0);

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const parts = getZonedParts(utcMs, timeZone);
    const diffMinutes = (
      ((year - parts.year) * 372)
      + ((month - parts.month) * 31)
      + ((day - parts.day) * 1440)
      + ((hour - parts.hour) * 60)
      + (minute - parts.minute)
    );

    if (diffMinutes === 0) {
      return new Date(utcMs);
    }

    utcMs += diffMinutes * 60 * 1000;
  }

  return new Date(utcMs);
}

function meetingWindowToUtcRange(meetingWindow) {
  const start = zonedDateTimeToUtcDate(meetingWindow.date, meetingWindow.time, meetingWindow.timeZone);
  const end = new Date(start.getTime() + (meetingWindow.durationMinutes * 60 * 1000));
  return { start, end };
}

function getStandardMeetingSlotTimes() {
  const slots = [];

  for (let hour = MEETING_SLOT_START_HOUR; hour <= MEETING_SLOT_END_HOUR; hour += 1) {
    for (let minute = 0; minute < 60; minute += MEETING_SLOT_INTERVAL_MINUTES) {
      if (hour === MEETING_SLOT_END_HOUR && minute > MEETING_SLOT_END_MINUTE) {
        continue;
      }

      slots.push(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
    }
  }

  return slots;
}

function rangesOverlap(rangeA, rangeB) {
  return rangeA.start < rangeB.end && rangeB.start < rangeA.end;
}

function resolveTimezone(timezone) {
  if (!timezone) return 'America/New_York';
  const normalized = String(timezone).trim().toUpperCase();
  return TIMEZONE_MAP[normalized] || timezone;
}

function formatDateInTimezone(date, timeZone) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
      .formatToParts(date)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value])
  );

  return `${parts.year}-${parts.month}-${parts.day}`;
}

function addCalendarDays(date, days) {
  const [year, month, day] = date.split('-').map(Number);
  const result = new Date(Date.UTC(year, month - 1, day + days));
  return result.toISOString().slice(0, 10);
}

function isSunday(date) {
  const normalized = normalizePreferredDate(date);
  if (!normalized) return false;
  const [year, month, day] = normalized.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay() === 0;
}

function getMinimumBookingDate({
  preferredTimezone = 'EST',
  now = new Date()
} = {}) {
  const noticeCutoff = new Date(now.getTime() + (MINIMUM_BOOKING_NOTICE_HOURS * 60 * 60 * 1000));
  let candidateDate = formatDateInTimezone(noticeCutoff, resolveTimezone(preferredTimezone));

  for (let attempt = 0; attempt < 8; attempt += 1) {
    if (!isSunday(candidateDate)) {
      const firstSlot = buildMeetingWindow({
        preferredDate: candidateDate,
        preferredTime: `${String(MEETING_SLOT_START_HOUR).padStart(2, '0')}:00`,
        preferredTimezone
      });
      const { start } = meetingWindowToUtcRange(firstSlot);

      if (start >= noticeCutoff) {
        return candidateDate;
      }
    }

    candidateDate = addCalendarDays(candidateDate, 1);
  }

  return candidateDate;
}

function validateBookingDate({ preferredDate, preferredTimezone = 'EST', now = new Date() }) {
  const date = normalizePreferredDate(preferredDate);
  if (!date) {
    return { allowed: false, reason: 'invalid_schedule' };
  }

  if (isSunday(date)) {
    return { allowed: false, reason: 'sunday_unavailable' };
  }

  const minimumDate = getMinimumBookingDate({ preferredTimezone, now });
  if (date < minimumDate) {
    return { allowed: false, reason: 'insufficient_notice', minimumDate };
  }

  return { allowed: true, minimumDate };
}

function normalizePreferredDate(preferredDate) {
  if (!preferredDate) return null;

  const value = String(preferredDate).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  const yyyy = parsed.getUTCFullYear();
  const mm = String(parsed.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(parsed.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function normalizePreferredTime(preferredTime) {
  if (!preferredTime) return null;

  const value = String(preferredTime).trim();
  const match = value.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function hasScheduledMeeting({ preferredDate, preferredTime }) {
  return Boolean(normalizePreferredDate(preferredDate) && normalizePreferredTime(preferredTime));
}

function buildMeetingWindow({
  preferredDate,
  preferredTime,
  preferredTimezone,
  durationMinutes = DEFAULT_MEETING_DURATION_MINUTES
}) {
  const date = normalizePreferredDate(preferredDate);
  const time = normalizePreferredTime(preferredTime);
  if (!date || !time) {
    return null;
  }

  const timeZone = resolveTimezone(preferredTimezone);
  const [hours, minutes] = time.split(':').map(Number);
  const totalStartMinutes = (hours * 60) + minutes;
  const totalEndMinutes = totalStartMinutes + durationMinutes;

  const endHours = Math.floor(totalEndMinutes / 60);
  const endMinutes = totalEndMinutes % 60;

  return {
    date,
    time,
    timeZone,
    startDateTime: `${date}T${time}:00`,
    endDateTime: `${date}T${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}:00`,
    durationMinutes
  };
}

function formatMeetingDisplay({ preferredDate, preferredTime, preferredTimezone }) {
  const window = buildMeetingWindow({ preferredDate, preferredTime, preferredTimezone });
  if (!window) return null;

  const [year, month, day] = window.date.split('-').map(Number);
  const [hours, minutes] = window.time.split(':').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, hours, minutes));

  const dateLabel = date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC'
  });

  const hour12 = ((hours + 11) % 12) + 1;
  const ampm = hours < 12 ? 'AM' : 'PM';
  const timeLabel = `${hour12}:${String(minutes).padStart(2, '0')} ${ampm}`;
  const timezoneLabel = preferredTimezone || 'EST';

  return `${dateLabel} at ${timeLabel} ${timezoneLabel}`;
}

module.exports = {
  DEFAULT_MEETING_DURATION_MINUTES,
  MEETING_SLOT_START_HOUR,
  MEETING_SLOT_END_HOUR,
  MEETING_SLOT_END_MINUTE,
  MEETING_SLOT_INTERVAL_MINUTES,
  MINIMUM_BOOKING_NOTICE_HOURS,
  resolveTimezone,
  normalizePreferredDate,
  normalizePreferredTime,
  hasScheduledMeeting,
  buildMeetingWindow,
  formatMeetingDisplay,
  getStandardMeetingSlotTimes,
  meetingWindowToUtcRange,
  rangesOverlap,
  zonedDateTimeToUtcDate,
  getMinimumBookingDate,
  isSunday,
  validateBookingDate
};
