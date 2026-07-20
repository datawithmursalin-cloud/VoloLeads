jest.mock('../utils/mailer', () => ({ sendEmail: jest.fn() }));
jest.mock('../utils/logger', () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn() }));

const { sendEmail } = require('../utils/mailer');
const { isInvalidGrant, alertCalendarAuthFailure, resetCalendarAuthAlertStateForTests } = require('../utils/calendarAuthAlert');

describe('Google Calendar authorization alerts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetCalendarAuthAlertStateForTests();
    process.env.CONTACT_EMAIL = 'admin@example.com';
    sendEmail.mockResolvedValue({ sent: true });
  });

  afterAll(() => delete process.env.CONTACT_EMAIL);

  it('recognizes nested Google invalid_grant responses', () => {
    expect(isInvalidGrant({ response: { data: { error: 'invalid_grant' } } })).toBe(true);
    expect(isInvalidGrant(new Error('socket timeout'))).toBe(false);
  });

  it('alerts immediately, then rate limits repeated failures', async () => {
    const error = Object.assign(new Error('invalid_grant'), { response: { data: { error: 'invalid_grant' } } });
    const now = new Date('2026-07-20T12:00:00.000Z');

    await alertCalendarAuthFailure(error, { now });
    await alertCalendarAuthFailure(error, { now: new Date(now.getTime() + 60_000) });

    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({
      to: 'admin@example.com',
      subject: expect.stringMatching(/calendar|oauth|authorization/i),
      text: expect.stringContaining('invalid_grant')
    }));
  });

  it('does not alert for unrelated failures', async () => {
    await alertCalendarAuthFailure(new Error('socket timeout'), { now: new Date('2026-07-20T12:00:00.000Z') });
    expect(sendEmail).not.toHaveBeenCalled();
  });
});
