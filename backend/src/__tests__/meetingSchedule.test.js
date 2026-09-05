const {
  buildMeetingWindow,
  formatMeetingDisplay,
  hasScheduledMeeting,
  normalizePreferredDate,
  normalizePreferredTime,
  resolveTimezone,
  getMinimumBookingDate,
  isSunday,
  validateBookingDate
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

  test('requires the calendar day after the 24-hour cutoff date', () => {
    const now = new Date('2026-08-09T15:56:00.000Z'); // Sunday 11:56 AM Eastern

    expect(getMinimumBookingDate({ preferredTimezone: 'EST', now })).toBe('2026-08-11');
    expect(validateBookingDate({ preferredDate: '2026-08-10', preferredTimezone: 'EST', now })).toMatchObject({
      allowed: false,
      reason: 'insufficient_notice',
      minimumDate: '2026-08-11'
    });
    expect(validateBookingDate({ preferredDate: '2026-08-11', preferredTimezone: 'EST', now })).toMatchObject({
      allowed: true
    });
  });

  test('allows Monday when its first slot is outside the 24-hour window', () => {
    const now = new Date('2026-08-09T06:00:00.000Z'); // Sunday 2:00 AM Eastern
    expect(getMinimumBookingDate({ preferredTimezone: 'EST', now })).toBe('2026-08-10');
  });

  test('never allows Sunday meetings', () => {
    expect(isSunday('2026-08-16')).toBe(true);
    expect(validateBookingDate({
      preferredDate: '2026-08-16',
      preferredTimezone: 'EST',
      now: new Date('2026-08-10T12:00:00.000Z')
    })).toMatchObject({ allowed: false, reason: 'sunday_unavailable' });
  });

  test('moves the minimum date to Monday when it would land on Sunday', () => {
    const now = new Date('2026-08-14T18:00:00.000Z'); // Friday 2:00 PM Eastern
    expect(getMinimumBookingDate({ preferredTimezone: 'EST', now })).toBe('2026-08-17');
  });
});
