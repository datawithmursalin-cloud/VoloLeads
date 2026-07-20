jest.mock('../config/db', () => ({ getPool: jest.fn() }));
jest.mock('../utils/mailer', () => ({ verifyEmailTransport: jest.fn() }));
jest.mock('../utils/googleCalendarClient', () => ({
  getCalendarClient: jest.fn(),
  getCalendarId: jest.fn(() => 'primary'),
  isGoogleMeetConfigured: jest.fn(() => true)
}));

const { getCalendarClient } = require('../utils/googleCalendarClient');
const { checkGoogleCalendar } = require('../utils/dependencyHealth');

describe('Google Calendar dependency health scope compatibility', () => {
  it('checks event access using the configured calendar.events OAuth scope', async () => {
    const list = jest.fn().mockResolvedValue({ data: { items: [] } });
    getCalendarClient.mockResolvedValue({ events: { list } });

    await expect(checkGoogleCalendar()).resolves.toEqual({ status: 'ok', configured: true });
    expect(list).toHaveBeenCalledTimes(1);
    expect(list).toHaveBeenCalledWith(expect.objectContaining({ calendarId: 'primary' }));
  });
});
