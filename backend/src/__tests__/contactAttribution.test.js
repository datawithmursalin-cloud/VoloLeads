jest.mock('../config/db', () => ({ query: jest.fn() }));
jest.mock('../utils/mailer', () => ({ sendEmail: jest.fn().mockResolvedValue({}) }));
jest.mock('../utils/googleMeet', () => ({ createMeetEvent: jest.fn() }));
jest.mock('../utils/logger', () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn() }));

const { query } = require('../config/db');
const { submitContactForm } = require('../controllers/contactController');
const { sanitizeContactForm } = require('../utils/helpers');
const ContactForms = require('../repositories/contactForms');

const base = { name: 'Test Visitor', email: 'visitor@example.com', phone: '2025550100', service: 'Growth', referral_source: 'Cold email' };
const submit = async body => {
  const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
  await submitContactForm({ body, headers: {}, connection: { remoteAddress: '127.0.0.1' } }, res);
  return res;
};

beforeEach(() => {
  jest.clearAllMocks();
  query.mockImplementation(async (sql, values) => ({ rows: sql.includes('COUNT(*)') ? [{ count: 0 }] : [{ id: 1, service: values[4], source: values[16], attribution: JSON.parse(values[19]) }] }));
});

test('contact submission persists campaign attribution separately from the selected service and record source', async () => {
  const res = await submit({ ...base, src: 'email', tracking_service: 'cold-callers', utm_campaign: 'november', source: 'spoofed', attribution: { email: 'ignored@example.com' } });
  expect(res.status).toHaveBeenCalledWith(201);
  const values = query.mock.calls.find(([sql]) => sql.includes('INSERT INTO contact_forms'))[1];
  expect(values[4]).toBe('Growth');
  expect(values[16]).toBe('website');
  expect(JSON.parse(values[19])).toEqual({ src: 'email', service: 'cold-callers', utm_campaign: 'november' });
});

test.each(['Cold email', 'Phone call'])('%s referral does not require a username', async referral_source => {
  const res = await submit({ ...base, referral_source });
  expect(res.status).toHaveBeenCalledWith(201);
});

test.each(['TikTok', 'College of Wholesale'])('%s still requires a username', async referral_source => {
  expect((await submit({ ...base, referral_source })).status).toHaveBeenCalledWith(400);
  expect(query).not.toHaveBeenCalled();
  expect((await submit({ ...base, referral_source, referral_source_other: '@visitor' })).status).toHaveBeenCalledWith(201);
});

test('attribution accepts only known string fields, strips controls and bounds length', () => {
  const result = sanitizeContactForm({ ...base, src: ['email'], tracking_service: { name: 'cold-callers' }, utm_campaign: 'x'.repeat(250), utm_source: ' email\n ', utm_medium: '', email_tracking: 'ignored' });
  expect(result.attribution).toEqual({ utm_campaign: 'x'.repeat(200), utm_source: 'email' });
  expect(sanitizeContactForm(base).attribution).toEqual({});
});

test('stored attribution is returned to admin readers with a fallback for older rows', async () => {
  query.mockResolvedValueOnce({ rows: [{ id: 1, service: 'Growth', attribution: { src: 'email', service: 'cold-callers' } }] });
  expect((await ContactForms.findById(1)).attribution).toEqual({ src: 'email', service: 'cold-callers' });
  query.mockResolvedValueOnce({ rows: [{ id: 2 }] });
  expect((await ContactForms.findById(2)).attribution).toEqual({});
});
