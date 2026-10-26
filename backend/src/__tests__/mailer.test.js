describe('SMTP mailer compatibility', () => {
  const savedEnv = { ...process.env };
  let transport;
  let nodemailer;

  beforeEach(() => {
    jest.resetModules();
    Object.assign(process.env, {
      SMTP_HOST: 'smtp.example.test',
      SMTP_PORT: '465',
      SMTP_USER: 'notifications@example.test',
      SMTP_PASS: 'test-only-password',
      SMTP_TLS_SERVERNAME: 'smtp.example.test',
      EMAIL_FROM: 'VoloLeads <notifications@example.test>'
    });
    nodemailer = require('nodemailer');
    // Use the real MIME/message pipeline without connecting to an SMTP server.
    transport = nodemailer.createTransport({ streamTransport: true, buffer: true });
    jest.spyOn(transport, 'sendMail');
    jest.spyOn(nodemailer, 'createTransport').mockReturnValue(transport);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    process.env = { ...savedEnv };
  });

  test('preserves SMTP authentication/TLS options and renders transactional messages', async () => {
    const { sendEmail } = require('../utils/mailer');
    await expect(sendEmail({
      to: 'Customer <customer@example.test>',
      subject: 'Your VoloLeads meeting',
      text: 'Your meeting is confirmed.',
      html: '<p>Your meeting is confirmed.</p>'
    })).resolves.toEqual({ sent: true });
    expect(nodemailer.createTransport).toHaveBeenCalledWith({
      host: 'smtp.example.test', port: 465, secure: true,
      auth: { user: 'notifications@example.test', pass: 'test-only-password' },
      tls: { servername: 'smtp.example.test' }
    });
    const result = await transport.sendMail.mock.results[0].value;
    expect(result.envelope.to).toEqual(['customer@example.test']);
    expect(result.message.toString()).toContain('Subject: Your VoloLeads meeting');
    expect(result.message.toString()).toContain('multipart/alternative');
  });

  test('preserves STARTTLS configuration for port 587', async () => {
    process.env.SMTP_PORT = '587';
    delete process.env.SMTP_TLS_SERVERNAME;
    await require('../utils/mailer').sendEmail({
      to: 'customer@example.test', subject: 'Receipt', text: 'Thank you.'
    });
    expect(nodemailer.createTransport).toHaveBeenCalledWith(expect.objectContaining({
      port: 587, secure: false
    }));
  });

  test('skips delivery when SMTP credentials are missing', async () => {
    delete process.env.SMTP_PASS;
    await expect(require('../utils/mailer').sendEmail({
      to: 'customer@example.test', subject: 'Receipt', text: 'Thank you.'
    })).resolves.toEqual({ sent: false, skipped: true });
    expect(transport.sendMail).not.toHaveBeenCalled();
  });
});
