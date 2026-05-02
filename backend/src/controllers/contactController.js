const ContactForm = require('../models/ContactForm');
const axios = require('axios');
const { isValidEmail, validatePhone, getClientIP, sanitizeContactForm } = require('../utils/helpers');
const logger = require('../utils/logger');

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
    const existingSubmissions = await ContactForm.countDocuments({
      ipAddress: clientIP,
      createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) }
    });

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
    const contactForm = new ContactForm(contactFormData);
    const savedForm = await contactForm.save();
    logger.info(`Contact form saved: ${savedForm._id}`);

    // Forward to Web3Forms (or email provider)
    const web3formsKey = process.env.WEB3FORMS_API_KEY;
    const contactEmail = process.env.CONTACT_EMAIL;

    if (web3formsKey && contactEmail) {
      try {
        const payload = {
          api_key: web3formsKey,
          from_name: sanitized.name,
          from_email: sanitized.email,
          subject: `VoloLeads Contact: ${sanitized.service} - ${sanitized.name}`,
          message: `
Name: ${sanitized.name}
Email: ${sanitized.email}
Phone: ${sanitized.phone}
Company: ${sanitized.company || 'N/A'}
Service: ${sanitized.service}
Quantity: ${sanitized.quantity || 'N/A'}
Preferred Date: ${sanitized.preferredDate || 'N/A'}
Preferred Time: ${sanitized.preferredTime || 'N/A'}
Timezone: ${sanitized.preferredTimezone}
Referral Source: ${sanitized.referralSource}
Message: ${sanitized.message || '(no message)'}
          `,
          to_email: contactEmail
        };

        const response = await axios.post('https://api.web3forms.com/submit', payload, {
          timeout: 10000
        });

        if (!response.data.success) {
          logger.error(`Web3Forms error: ${response.data.message}`);
        } else {
          logger.info(`Web3Forms submission successful for ${sanitized.email}`);
        }
      } catch (providerError) {
        logger.error(`Email provider error: ${providerError.message}`);
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Form submitted successfully',
      data: {
        id: savedForm._id,
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

    const query = {};
    if (status) query.status = status;

    const forms = await ContactForm
      .find(query)
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .sort({ createdAt: -1 });

    const total = await ContactForm.countDocuments(query);

    return res.status(200).json({
      success: true,
      message: 'Contact forms retrieved',
      data: {
        forms,
        pagination: {
          total,
          limit: parseInt(limit),
          skip: parseInt(skip)
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

    const form = await ContactForm.findById(id);
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

    const form = await ContactForm.findByIdAndUpdate(
      id,
      { status, notes },
      { new: true, runValidators: true }
    );

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
