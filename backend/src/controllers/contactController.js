const ContactForms = require('../repositories/contactForms');
const { isValidEmail, validatePhone, getClientIP, sanitizeContactForm, escapeHtml } = require('../utils/helpers');
const { sendEmail } = require('../utils/mailer');
const { createMeetEvent } = require('../utils/googleMeet');
const {
  hasScheduledMeeting,
  normalizePreferredDate,
  normalizePreferredTime
} = require('../utils/meetingSchedule');
const {
  getMeetingEmailSubject,
  getMeetingEmailText,
  buildMeetingEmailHtml
} = require('../emails/meetingConfirmationEmail');
const logger = require('../utils/logger');

function buildContactFormNotificationText(sanitized, meeting = null) {
  const lines = [
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
  ];

  if (meeting && meeting.meetLink) {
    lines.splice(lines.length - 2, 0, '', `Google Meet: ${meeting.meetLink}`);
  }

  return lines.join('\n');
}

function buildContactFormNotificationHtml(sanitized, meeting = null) {
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

  if (meeting && meeting.meetLink) {
    lines.splice(lines.length - 1, 0, ['Google Meet', meeting.meetLink]);
  }

  const rows = lines.map(([label, value]) => (
    `<tr><td style="padding:8px 12px 8px 0;color:#94a3b8;vertical-align:top;">${escapeHtml(label)}</td>`
    + `<td style="padding:8px 0;color:#f8fafc;"><strong>${escapeHtml(value)}</strong></td></tr>`
  )).join('');

  return `<div style="font-family:Arial,sans-serif;background:#0f172a;color:#e2e8f0;padding:24px;">
    <h2 style="margin:0 0 16px;color:#ffffff;">New contact form submission</h2>
    <p style="margin:0 0 16px;line-height:1.6;">Someone submitted the VoloLeads contact form.</p>
    <table style="border-collapse:collapse;">${rows}</table>
  </div>`;
}

async function notifyAdminContactForm(sanitized, meeting = null) {
  const notifyTo = process.env.CONTACT_EMAIL;
  if (!notifyTo) {
    logger.warn('CONTACT_EMAIL is not set; skipping contact form notification');
    return;
  }

  try {
    const result = await sendEmail({
      to: notifyTo,
      subject: `VoloLeads Contact: ${sanitized.service} — ${sanitized.name}`,
      text: buildContactFormNotificationText(sanitized, meeting),
      html: buildContactFormNotificationHtml(sanitized, meeting)
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

async function notifyCustomerMeeting(sanitized, meeting) {
  if (!meeting || !meeting.meetLink) {
    return;
  }

  try {
    const result = await sendEmail({
      to: sanitized.email,
      subject: getMeetingEmailSubject(),
      text: getMeetingEmailText({
        name: sanitized.name,
        meetLink: meeting.meetLink,
        preferredDate: sanitized.preferredDate,
        preferredTime: sanitized.preferredTime,
        preferredTimezone: sanitized.preferredTimezone,
        service: sanitized.service
      }),
      html: buildMeetingEmailHtml({
        name: sanitized.name,
        meetLink: meeting.meetLink,
        preferredDate: sanitized.preferredDate,
        preferredTime: sanitized.preferredTime,
        preferredTimezone: sanitized.preferredTimezone,
        service: sanitized.service
      })
    });

    if (!result || !result.sent) {
      logger.warn(`Meeting confirmation was not sent to ${sanitized.email}`);
      return;
    }

    logger.info(`Meeting confirmation sent to ${sanitized.email}`);
  } catch (error) {
    logger.error(`Meeting confirmation email failed: ${error.message}`);
  }
}

async function scheduleMeetingIfRequested(sanitized) {
  if (!hasScheduledMeeting(sanitized)) {
    return null;
  }

  const slotDate = normalizePreferredDate(sanitized.preferredDate);
  const slotTime = normalizePreferredTime(sanitized.preferredTime);

  try {
    return await ContactForms.withMeetingSlotLock(slotDate, slotTime, async () => {
      const meeting = await createMeetEvent({
        name: sanitized.name,
        email: sanitized.email,
        service: sanitized.service,
        preferredDate: sanitized.preferredDate,
        preferredTime: sanitized.preferredTime,
        preferredTimezone: sanitized.preferredTimezone,
        message: sanitized.message
      });

      if (!meeting.created) {
        logger.warn(`Google Meet was not created for ${sanitized.email}: ${meeting.reason}`);
        return meeting;
      }

      return meeting;
    });
  } catch (error) {
    logger.error(`Google Meet creation failed for ${sanitized.email}: ${error.message}`);
    return { created: false, reason: 'calendar_error' };
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

    if (sanitized.preferredTime && !sanitized.preferredDate) {
      return res.status(400).json({
        success: false,
        message: 'Preferred date is required when a meeting time is selected'
      });
    }

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

    const meeting = await scheduleMeetingIfRequested(sanitized);

    const scheduledMeeting = meeting && meeting.created ? meeting : null;
    const schedulingFallback = Boolean(
      (sanitized.preferredDate && !sanitized.preferredTime)
      || (meeting && !meeting.created)
    );

    // Prepare contact form record
    const contactFormData = {
      ...sanitized,
      ipAddress: clientIP,
      userAgent: req.headers['user-agent'],
      source: 'website',
      meetLink: scheduledMeeting ? scheduledMeeting.meetLink : null,
      calendarEventId: scheduledMeeting ? scheduledMeeting.eventId : null
    };

    // Store in database for record-keeping
    const savedForm = await ContactForms.create(contactFormData);
    logger.info(`Contact form saved: ${savedForm.id}`);

    await notifyAdminContactForm(sanitized, scheduledMeeting);
    await notifyCustomerMeeting(sanitized, scheduledMeeting);

    return res.status(201).json({
      success: true,
      message: scheduledMeeting && scheduledMeeting.meetLink
        ? 'Form submitted successfully. Check your email for the Google Meet link.'
        : schedulingFallback
          ? 'Form submitted successfully. We’ll contact you to schedule.'
          : 'Form submitted successfully',
      data: {
        id: savedForm.id,
        email: sanitized.email,
        meetScheduled: Boolean(scheduledMeeting && scheduledMeeting.meetLink),
        schedulingFallback
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
