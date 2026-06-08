const ContactForms = require('../repositories/contactForms');
const { isValidEmail, validatePhone, getClientIP, sanitizeContactForm } = require('../utils/helpers');
const { sendEmail } = require('../utils/mailer');
const logger = require('../utils/logger');

function buildContactFormNotificationText(sanitized) {
  return [
    'New VoloLeads contact form submission.',
    '',
    `Name: ${sanitized.name}`,
    `Email: ${sanitized.email}`,
    `Phone: ${sanitized.phone}`,
    `Company: ${sanitized.company || 'N/A'}`,
    `Service: ${sanitized.service}`,
    `Quantity: ${sanitized.quantity || 'N/A'}`,
    `Preferred Date: ${sanitized.preferredDate || 'N/A'}`,
    `Preferred Time: ${sanitized.preferredTime || 'N/A'}`,
    `Timezone: ${sanitized.preferredTimezone}`,
    `Referral Source: ${sanitized.referralSource}`,
    `Message: ${sanitized.message || '(no message)'}`,
    '',
    `Time (UTC): ${new Date().toISOString()}`
  ].join('\n');
}

function buildContactFormNotificationHtml(sanitized) {
  const lines = [
    ['Name', sanitized.name],
    ['Email', sanitized.email],
    ['Phone', sanitized.phone],
    ['Company', sanitized.company || 'N/A'],
    ['Service', sanitized.service],
    ['Quantity', sanitized.quantity || 'N/A'],
    ['Preferred Date', sanitized.preferredDate || 'N/A'],
    ['Preferred Time', sanitized.preferredTime || 'N/A'],
    ['Timezone', sanitized.preferredTimezone],
    ['Referral Source', sanitized.referralSource],
    ['Message', sanitized.message || '(no message)'],
    ['Time (UTC)', new Date().toISOString()]
  ];

  const rows = lines.map(([label, value]) => (
    `<tr><td style="padding:8px 12px 8px 0;color:#94a3b8;vertical-align:top;">${label}</td>`
    + `<td style="padding:8px 0;color:#f8fafc;"><strong>${value}</strong></td></tr>`
  )).join('');

  return `<div style="font-family:Arial,sans-serif;background:#0f172a;color:#e2e8f0;padding:24px;">
    <h2 style="margin:0 0 16px;color:#ffffff;">New contact form submission</h2>
    <p style="margin:0 0 16px;line-height:1.6;">Someone submitted the VoloLeads contact form.</p>
    <table style="border-collapse:collapse;">${rows}</table>
  </div>`;
}

async function notifyAdminContactForm(sanitized) {
  const notifyTo = process.env.CONTACT_EMAIL;
  if (!notifyTo) {
    logger.warn('CONTACT_EMAIL is not set; skipping contact form notification');
    return;
  }

  try {
    const result = await sendEmail({
      to: notifyTo,
      subject: `VoloLeads Contact: ${sanitized.service} — ${sanitized.name}`,
      text: buildContactFormNotificationText(sanitized),
      html: buildContactFormNotificationHtml(sanitized)
    });

    if (!result || !result.sent) {
      logger.warn(`Contact form notification was not sent to ${notifyTo}`);
      return;
    }

    logger.info(`Contact form notification sent to ${notifyTo} for ${sanitized.email}`);
  } catch (error) {
    logger.error(`Contact form notification failed: ${error.message}`);
  }
}

exports.submitContactForm = async (req, res) => {
  try {
    const { name, email, phone, service, referral_source } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !service || !referral_source) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, email, phone, service, referral_source'
      });
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Validate phone format
    if (!validatePhone(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone format'
      });
    }

    // Sanitize input data
    const sanitized = sanitizeContactForm(req.body);
    const clientIP = getClientIP(req);

    // Check for spam patterns
    const existingSubmissions = await ContactForms.countRecentByIp(clientIP, new Date(Date.now() - 60 * 60 * 1000));

    if (existingSubmissions >= 3) {
      logger.warn(`Rate limit exceeded for IP: ${clientIP}`);
      return res.status(429).json({
        success: false,
        message: 'Too many submissions. Please try again later.'
      });
    }

    // Prepare contact form record
    const contactFormData = {
      ...sanitized,
      ipAddress: clientIP,
      userAgent: req.headers['user-agent'],
      source: 'website'
    };

    // Store in database for record-keeping
    const savedForm = await ContactForms.create(contactFormData);
    logger.info(`Contact form saved: ${savedForm.id}`);

    await notifyAdminContactForm(sanitized);

    return res.status(201).json({
      success: true,
      message: 'Form submitted successfully',
      data: {
        id: savedForm.id,
        email: sanitized.email
      }
    });
  } catch (error) {
    logger.error(`Contact form submission error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit form. Please try again later.'
    });
  }
};

exports.getContactForms = async (req, res) => {
  try {
    const { limit = 50, skip = 0, status } = req.query;

    const numericLimit = parseInt(limit, 10);
    const numericSkip = parseInt(skip, 10);
    const filters = { status, limit: numericLimit, skip: numericSkip };

    const forms = await ContactForms.findAll(filters);
    const total = await ContactForms.countAll(filters);

    return res.status(200).json({
      success: true,
      message: 'Contact forms retrieved',
      data: {
        forms,
        pagination: {
          total,
          limit: numericLimit,
          skip: numericSkip
        }
      }
    });
  } catch (error) {
    logger.error(`Get contact forms error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve contact forms'
    });
  }
};

exports.getContactFormById = async (req, res) => {
  try {
    const { id } = req.params;

    const form = await ContactForms.findById(id);
    if (!form) {
      return res.status(404).json({
        success: false,
        message: 'Contact form not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Contact form retrieved',
      data: form
    });
  } catch (error) {
    logger.error(`Get contact form error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve contact form'
    });
  }
};

exports.updateContactFormStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!['new', 'contacted', 'converted', 'spam'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }

    const form = await ContactForms.updateStatus(id, { status, notes });

    if (!form) {
      return res.status(404).json({
        success: false,
        message: 'Contact form not found'
      });
    }

    logger.info(`Contact form status updated: ${id} -> ${status}`);

    return res.status(200).json({
      success: true,
      message: 'Contact form updated',
      data: form
    });
  } catch (error) {
    logger.error(`Update contact form error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to update contact form'
    });
  }
};
