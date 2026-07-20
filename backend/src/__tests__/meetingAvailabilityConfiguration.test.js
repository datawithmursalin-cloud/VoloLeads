jest.mock('../repositories/contactForms', () => ({
  countBookedSlot: jest.fn().mockResolvedValue(0)
}));

jest.mock('../utils/googleCalendarClient', () => ({
  getCalendarClient: jest.fn(),
  isGoogleMeetConfigured: jest.fn(() => false),
  getMeetingDurationMinutes: jest.fn(() => 30),
  getCalendarId: jest.fn(() => 'primary')
}));

jest.mock('../utils/calendarAuthAlert', () => ({
  alertCalendarAuthFailure: jest.fn()
}));

jest.mock('../utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}));

const ContactForms = require('../repositories/contactForms');
const { getAvailableMeetingSlots } = require('../utils/meetingAvailability');

describe('meeting availability configuration guard', () => {
  it('rejects when Google Calendar is not configured instead of advertising standard slots', async () => {
    await expect(getAvailableMeetingSlots({
      preferredDate: '2026-07-21',
      preferredTimezone: 'EST'
    })).rejects.toThrow(/calendar.*not configured/i);

    expect(ContactForms.countBookedSlot).not.toHaveBeenCalled();
  });
});
