jest.mock('../repositories/contactForms', () => ({
  countBookedSlot: jest.fn().mockResolvedValue(0)
}));

jest.mock('../utils/googleCalendarClient', () => ({
  getCalendarClient: jest.fn(),
  isGoogleMeetConfigured: jest.fn(() => true),
  getMeetingDurationMinutes: jest.fn(() => 30),
  getCalendarId: jest.fn(() => 'primary')
}));

jest.mock('../utils/calendarAuthAlert', () => ({
  alertCalendarAuthFailure: jest.fn().mockResolvedValue(true)
}));

jest.mock('../utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}));

const { getCalendarClient } = require('../utils/googleCalendarClient');
const { alertCalendarAuthFailure } = require('../utils/calendarAuthAlert');
const { getAvailableMeetingSlots } = require('../utils/meetingAvailability');

describe('meeting availability Calendar auth alert integration', () => {
  beforeEach(() => jest.clearAllMocks());

  it('alerts the administrator when Google rejects the refresh token', async () => {
    const invalidGrant = Object.assign(new Error('invalid_grant'), {
      response: { data: { error: 'invalid_grant' } }
    });
    getCalendarClient.mockResolvedValue({
      events: { list: jest.fn().mockRejectedValue(invalidGrant) }
    });

    await expect(getAvailableMeetingSlots({
      preferredDate: '2026-07-21',
      preferredTimezone: 'EST'
    })).rejects.toBe(invalidGrant);

    expect(alertCalendarAuthFailure).toHaveBeenCalledTimes(1);
    expect(alertCalendarAuthFailure).toHaveBeenCalledWith(invalidGrant);
  });
});
