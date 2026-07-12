const {
  buildMeetingWindow,
  formatMeetingDisplay,
  hasScheduledMeeting,
  normalizePreferredDate,
  normalizePreferredTime,
  resolveTimezone
} = require('../utils/meetingSchedule');

describe('meetingSchedule', () => {
  test('resolves common timezone labels', () => {
    expect(resolveTimezone('EST')).toBe('America/New_York');
    expect(resolveTimezone('America/Chicago')).toBe('America/Chicago');
  });

  test('builds a 30-minute meeting window in Eastern time', () => {
    const window = buildMeetingWindow({
      preferredDate: '2026-06-15',
      preferredTime: '09:00',
      preferredTimezone: 'EST'
    });

    expect(window).toEqual({
      date: '2026-06-15',
      time: '09:00',
      timeZone: 'America/New_York',
      startDateTime: '2026-06-15T09:00:00',
      endDateTime: '2026-06-15T09:30:00',
      durationMinutes: 30
    });
  });

  test('detects when a meeting is scheduled', () => {
    expect(hasScheduledMeeting({ preferredDate: '2026-06-15', preferredTime: '10:30' })).toBe(true);
    expect(hasScheduledMeeting({ preferredDate: '2026-06-15', preferredTime: '' })).toBe(false);
  });

  test('normalizes date and time values', () => {
    expect(normalizePreferredDate('2026-06-15T00:00:00.000Z')).toBe('2026-06-15');
    expect(normalizePreferredTime('9:00')).toBe('09:00');
  });

  test('formats a readable meeting label', () => {
    const label = formatMeetingDisplay({
      preferredDate: '2026-06-15',
      preferredTime: '09:00',
      preferredTimezone: 'EST'
    });

    expect(label).toContain('June 15, 2026');
    expect(label).toContain('9:00 AM EST');
  });
});
