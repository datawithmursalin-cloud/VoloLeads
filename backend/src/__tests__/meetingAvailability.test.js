const {
  getStandardMeetingSlotTimes,
  rangesOverlap,
  meetingWindowToUtcRange,
  buildMeetingWindow
} = require('../utils/meetingSchedule');

describe('meeting availability helpers', () => {
  test('returns standard 30-minute booking slots through 4:30 PM', () => {
    const slots = getStandardMeetingSlotTimes();

    expect(slots[0]).toBe('09:00');
    expect(slots).toContain('16:00');
    expect(slots).toContain('16:30');
    expect(slots).not.toContain('17:00');
  });

  test('detects overlapping ranges', () => {
    const slot = meetingWindowToUtcRange(buildMeetingWindow({
      preferredDate: '2026-06-25',
      preferredTime: '16:00',
      preferredTimezone: 'EST'
    }));

    const existing = {
      start: new Date('2026-06-25T19:30:00.000Z'),
      end: new Date('2026-06-25T20:30:00.000Z')
    };

    expect(rangesOverlap(slot, existing)).toBe(true);
    expect(rangesOverlap(slot, {
      start: new Date('2026-06-25T21:00:00.000Z'),
      end: new Date('2026-06-25T21:30:00.000Z')
    })).toBe(false);
  });
});
