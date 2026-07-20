jest.mock('../utils/dependencyHealth', () => ({ checkDependencies: jest.fn() }));

const express = require('express');
const request = require('supertest');
const { checkDependencies } = require('../utils/dependencyHealth');
const healthRoutes = require('../routes/health');

const app = express();
app.use('/api/health', healthRoutes);

describe('GET /api/health/dependencies', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 200 only when every dependency is healthy', async () => {
    checkDependencies.mockResolvedValue({
      database: { status: 'ok', configured: true },
      googleCalendar: { status: 'ok', configured: true },
      smtp: { status: 'ok', configured: true },
      turnstile: { status: 'ok', configured: true }
    });

    const response = await request(app).get('/api/health/dependencies');

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual(expect.objectContaining({
      success: true,
      status: 'OK',
      dependencies: {
        database: { status: 'ok', configured: true },
        googleCalendar: { status: 'ok', configured: true },
        smtp: { status: 'ok', configured: true },
        turnstile: { status: 'ok', configured: true }
      }
    }));
  });

  it('returns a sanitized 503 when a dependency is unhealthy', async () => {
    const secretMarker = 'must-not-leak-super-secret';
    checkDependencies.mockResolvedValue({
      database: { status: 'ok', configured: true },
      googleCalendar: { status: 'error', configured: true, error: `invalid_grant ${secretMarker}` },
      smtp: { status: 'ok', configured: true },
      turnstile: { status: 'ok', configured: true }
    });

    const response = await request(app).get('/api/health/dependencies');

    expect(response.statusCode).toBe(503);
    expect(response.body).toEqual(expect.objectContaining({ success: false, status: 'DEGRADED' }));
    expect(response.body.dependencies.googleCalendar).toEqual({ status: 'error', configured: true });
    expect(JSON.stringify(response.body)).not.toContain(secretMarker);
    expect(Number.isNaN(Date.parse(response.body.timestamp))).toBe(false);
  });
});
