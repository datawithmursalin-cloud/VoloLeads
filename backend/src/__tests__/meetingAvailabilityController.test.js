jest.mock('../utils/meetingAvailability', () => ({ getAvailableMeetingSlots: jest.fn() }));
jest.mock('../utils/logger', () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn() }));

const { getAvailableMeetingSlots } = require('../utils/meetingAvailability');
const { getMeetingAvailability } = require('../controllers/meetingAvailabilityController');

function mockResponse() {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
}

describe('meeting availability failure contract', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns an explicit retryable outage instead of an empty successful calendar', async () => {
    getAvailableMeetingSlots.mockRejectedValue(new Error('invalid_grant'));
    const res = mockResponse();

    await getMeetingAvailability({ query: { date: '2026-07-21', timezone: 'EST' } }, res);

    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      code: 'SCHEDULING_UNAVAILABLE',
      message: 'Online scheduling is temporarily unavailable. Submit the form and we\u2019ll contact you to schedule.',
      data: {
        date: '2026-07-21',
        timezone: 'EST',
        schedulingAvailable: false,
        slots: []
      }
    });
  });
});
