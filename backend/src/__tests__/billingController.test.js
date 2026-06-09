jest.mock('../repositories/subscriptions', () => ({
  findDueRenewalReminders: jest.fn(),
  markReminderSent: jest.fn()
}));

jest.mock('../utils/mailer', () => ({
  sendEmail: jest.fn()
}));

const SubscriptionStore = require('../repositories/subscriptions');
const { sendEmail } = require('../utils/mailer');
const { processRenewalReminders } = require('../controllers/billingController');

describe('processRenewalReminders', () => {
  const now = new Date('2026-06-01T00:00:00.000Z');
  const dueSubscription = {
    id: '1',
    email: 'same@example.com',
    planCode: 'premium_monthly',
    currentPeriodEnd: new Date('2026-06-21T00:00:00.000Z')
  };

  beforeEach(() => {
    jest.clearAllMocks();
    SubscriptionStore.findDueRenewalReminders.mockResolvedValue([]);
  });

  it('returns due reminders without sending or marking in dry-run mode', async () => {
    SubscriptionStore.findDueRenewalReminders
      .mockResolvedValueOnce([dueSubscription])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const result = await processRenewalReminders(now, { dryRun: true });

    expect(result).toMatchObject({
      dryRun: true,
      sentCount: 0,
      dueCount: 1
    });
    expect(result.dueItems).toEqual([
      expect.objectContaining({
        reminderKey: 'week3',
        email: dueSubscription.email,
        planCode: dueSubscription.planCode
      })
    ]);
    expect(sendEmail).not.toHaveBeenCalled();
    expect(SubscriptionStore.markReminderSent).not.toHaveBeenCalled();
  });

  it('does not mark reminders sent when email transport skips delivery', async () => {
    SubscriptionStore.findDueRenewalReminders
      .mockResolvedValueOnce([dueSubscription])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    sendEmail.mockResolvedValue({ sent: false, skipped: true });

    const result = await processRenewalReminders(now);

    expect(result).toMatchObject({
      dryRun: false,
      sentCount: 0,
      dueCount: 1
    });
    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(SubscriptionStore.markReminderSent).not.toHaveBeenCalled();
  });
});
