jest.mock('../repositories/contactForms', () => ({ countRecentByIp: jest.fn(), create: jest.fn() }));
jest.mock('../utils/mailer', () => ({ sendEmail: jest.fn() }));
jest.mock('../utils/googleMeet', () => ({ createMeetEvent: jest.fn() }));
jest.mock('../utils/logger', () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn() }));
jest.mock('../middleware/turnstile', () => jest.fn((req, res, next) => next()));

const express = require('express');
const request = require('supertest');
const ContactForms = require('../repositories/contactForms');
const { sendEmail } = require('../utils/mailer');
const { createMeetEvent } = require('../utils/googleMeet');
const verifyTurnstile = require('../middleware/turnstile');
const contactRoutes = require('../routes/contact');

const app = express();
app.use(express.json());
app.use('/api', contactRoutes);

describe('POST /api/contact-form scheduling resilience', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.CONTACT_EMAIL = 'admin@example.com';
    ContactForms.countRecentByIp.mockResolvedValue(0);
    ContactForms.create.mockResolvedValue({ id: 'lead-123' });
    sendEmail.mockResolvedValue({ sent: true });
  });

  afterAll(() => delete process.env.CONTACT_EMAIL);

  it('passes Turnstile and saves a lead when a preferred date has no time', async () => {
    const response = await request(app).post('/api/contact-form').send({
      name: 'Potential Client',
      email: 'client@example.com',
      phone: '+1 212 555 0100',
      service: 'Standard',
      referral_source: 'Google',
      preferred_date: '2026-07-21',
      preferred_time: '',
      preferred_timezone: 'EST',
      message: 'Please call me to arrange a time.',
      'cf-turnstile-response': 'verified-test-token'
    });

    expect(response.statusCode).toBe(201);
    expect(verifyTurnstile).toHaveBeenCalled();
    expect(ContactForms.create).toHaveBeenCalledWith(expect.objectContaining({
      email: 'client@example.com',
      preferredDate: '2026-07-21'
    }));
    expect(ContactForms.create.mock.calls[0][0].preferredTime).toBeFalsy();
    expect(createMeetEvent).not.toHaveBeenCalled();
    expect(response.body).toEqual(expect.objectContaining({
      success: true,
      data: expect.objectContaining({ id: 'lead-123', meetScheduled: false })
    }));
  });
});
