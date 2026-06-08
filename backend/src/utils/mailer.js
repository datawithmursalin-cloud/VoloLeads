const nodemailer = require('nodemailer');
const logger = require('./logger');

let transport;

function getTransport() {
  if (transport) return transport;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_TLS_SERVERNAME } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    return null;
  }

  transport = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS
    },
    ...(SMTP_TLS_SERVERNAME ? {
      tls: {
        servername: SMTP_TLS_SERVERNAME
      }
    } : {})
  });

  return transport;
}

async function sendEmail({ to, subject, text, html }) {
  const transporter = getTransport();
  if (!transporter) {
    logger.warn('SMTP transport is not configured; skipping email send');
    return { sent: false, skipped: true };
  }

  const from = process.env.EMAIL_FROM || process.env.SMTP_USER;
  await transporter.sendMail({ from, to, subject, text, html });
  return { sent: true };
}

module.exports = {
  sendEmail
};
