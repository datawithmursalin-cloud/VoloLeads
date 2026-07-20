jest.mock('../config/db', () => jest.fn().mockResolvedValue(null));
jest.mock('../config/secrets', () => ({ validateProductionSecrets: jest.fn() }));

const express = require('express');
const request = require('supertest');

describe('Turnstile Content Security Policy', () => {
  let app;
  let listenSpy;

  beforeAll(() => {
    listenSpy = jest.spyOn(express.application, 'listen').mockImplementation(() => ({ close: jest.fn() }));
    app = require('../server');
  });

  afterAll(() => {
    listenSpy.mockRestore();
  });

  it('allows Cloudflare Turnstile scripts and frames', async () => {
    const response = await request(app).get('/api/health');
    const policy = response.headers['content-security-policy'];

    expect(response.statusCode).toBe(200);
    expect(policy).toEqual(expect.any(String));
    expect(policy).toMatch(/script-src[^;]*https:\/\/challenges\.cloudflare\.com/);
    expect(policy).toMatch(/frame-src[^;]*https:\/\/challenges\.cloudflare\.com/);
  });
});
