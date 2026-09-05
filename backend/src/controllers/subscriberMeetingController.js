const getStripeClient = require('../config/stripe');
const { getPlanConfig } = require('../config/billing');
const SubscriptionStore = require('../repositories/subscriptions');
const ContactForms = require('../repositories/contactForms');
const { createMeetEvent } = require('../utils/googleMeet');
const {
  hasScheduledMeeting,
  formatMeetingDisplay,
  normalizePreferredDate,
  normalizePreferredTime
} = require('../utils/meetingSchedule');
const { validatePhone, escapeHtml, isValidEmail } = require('../utils/helpers');
const { sendEmail } = require('../utils/mailer');
const {
  isSubscriptionActive,
  issueBookingToken,
  verifyOnboardingAccessToken,
  delay
} = require('../utils/subscriptionAccess');
const {
  getMeetingEmailSubject,
  getMeetingEmailText,
  buildMeetingEmailHtml,
  getSubscriberMeetingAdminSubject
} = require('../emails/meetingConfirmationEmail');
const logger = require('../utils/logger');

const DEFAULT_SUBSCRIPTION_NOTIFY_EMAIL = 'vololeads@gmail.com';

function getPlanDisplayName(planCode) {
  const plan = getPlanConfig(planCode);
  return plan ? plan.displayName : planCode;
}

function getAdminNotifyRecipients() {
  const recipients = [
    process.env.SUBSCRIPTION_NOTIFY_EMAIL,
    process.env.CONTACT_EMAIL,
    DEFAULT_SUBSCRIPTION_NOTIFY_EMAIL
  ]
    .filter(Boolean)
    .map((email) => email.trim().toLowerCase());

  return [...new Set(recipients)];
}

function buildSubscriberMeetingAdminText({
  name,
  email,
  phone,
  planDisplayName,
  planCode,
  preferredDate,
  preferredTime,
  preferredTimezone,
  message,
  meetLink,
  stripeSubscriptionId,
  stripeCheckoutSessionId
}) {
  const when = formatMeetingDisplay({ preferredDate, preferredTime, preferredTimezone }) || 'N/A';

  return [
    'New VoloLeads subscriber onboarding form submitted.',
    '',
    `Name: ${name}`,
    `Email: ${email}`,
    `Phone: ${phone}`,
    `Subscription plan: ${planDisplayName} (${planCode})`,
    `Scheduled for: ${when}`,
    `Preferred Date: ${preferredDate || 'N/A'}`,
    `Preferred Time: ${preferredTime || 'N/A'}`,
    `Timezone: ${preferredTimezone || 'EST'}`,
    `Onboarding notes: ${message || '(no notes)'}`,
    `Stripe subscription: ${stripeSubscriptionId || 'N/A'}`,
    `Checkout session: ${stripeCheckoutSessionId || 'N/A'}`,
    meetLink ? `Google Meet: ${meetLink}` : 'Google Meet: not created',
    '',
    `Time (UTC): ${new Date().toISOString()}`
  ].join('\n');
}

function buildSubscriberMeetingAdminHtml(details) {
  const when = formatMeetingDisplay({
    preferredDate: details.preferredDate,
    preferredTime: details.preferredTime,
    preferredTimezone: details.preferredTimezone
  }) || 'N/A';

  const lines = [
    ['Name', details.name],
    ['Email', details.email],
    ['Phone', details.phone],
    ['Subscription plan', `${details.planDisplayName} (${details.planCode})`],
    ['Scheduled for', when],
    ['Preferred Date', details.preferredDate || 'N/A'],
    ['Preferred Time', details.preferredTime || 'N/A'],
    ['Timezone', details.preferredTimezone || 'EST'],
    ['Onboarding notes', details.message || '(no notes)'],
    ['Stripe subscription', details.stripeSubscriptionId || 'N/A'],
    ['Checkout session', details.stripeCheckoutSessionId || 'N/A'],
    ['Google Meet', details.meetLink || 'Not created'],
    ['Time (UTC)', new Date().toISOString()]
  ];

  const rows = lines.map(([label, value]) => (
    `<tr><td style="padding:8px 12px 8px 0;color:#94a3b8;vertical-align:top;">${escapeHtml(label)}</td>`
    + `<td style="padding:8px 0;color:#f8fafc;"><strong>${escapeHtml(value)}</strong></td></tr>`
  )).join('');

  return `<div style="font-family:Arial,sans-serif;background:#0f172a;color:#e2e8f0;padding:24px;">
    <h2 style="margin:0 0 16px;color:#ffffff;">Subscriber onboarding form</h2>
    <p style="margin:0 0 16px;line-height:1.6;">A paying subscriber submitted the onboarding scheduling form.</p>
    <table style="border-collapse:collapse;">${rows}</table>
  </div>`;
}

async function notifyAdminSubscriberMeeting(details) {
  const recipients = getAdminNotifyRecipients();
  const subject = getSubscriberMeetingAdminSubject(details.planDisplayName, details.name);
  const text = buildSubscriberMeetingAdminText(details);
  const html = buildSubscriberMeetingAdminHtml(details);

  for (const notifyTo of recipients) {
    try {
      const result = await sendEmail({ to: notifyTo, subject, text, html });

      if (!result || !result.sent) {
        logger.warn(`Subscriber onboarding notification was not sent to ${notifyTo}`);
        continue;
      }

      logger.info(`Subscriber onboarding notification sent to ${notifyTo} for ${details.email}`);
    } catch (error) {
      logger.error(`Subscriber onboarding notification failed for ${notifyTo}: ${error.message}`);
    }
  }
}

async function notifySubscriberMeeting(details, meeting) {
  if (!meeting || !meeting.meetLink) {
    return;
  }

  try {
    const result = await sendEmail({
      to: details.email,
      subject: getMeetingEmailSubject({ isSubscriber: true }),
      text: getMeetingEmailText({
        name: details.name,
        meetLink: meeting.meetLink,
        preferredDate: details.preferredDate,
        preferredTime: details.preferredTime,
        preferredTimezone: details.preferredTimezone,
        service: details.planDisplayName,
        isSubscriber: true
      }),
      html: buildMeetingEmailHtml({
        name: details.name,
        meetLink: meeting.meetLink,
        preferredDate: details.preferredDate,
        preferredTime: details.preferredTime,
        preferredTimezone: details.preferredTimezone,
        service: details.planDisplayName,
        isSubscriber: true
      })
    });

    if (!result || !result.sent) {
      logger.warn(`Subscriber meeting confirmation was not sent to ${details.email}`);
      return;
    }

    logger.info(`Subscriber meeting confirmation sent to ${details.email}`);
  } catch (error) {
    logger.error(`Subscriber meeting confirmation email failed: ${error.message}`);
  }
}

async function findSubscriptionForCheckoutSession(sessionId) {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const subscription = await SubscriptionStore.findByCheckoutSessionId(sessionId);
    if (subscription && isSubscriptionActive(subscription)) {
      return subscription;
    }

    if (attempt < 3) {
      await delay(750);
    }
  }

  return null;
}

async function resolveSubscriptionFromAccessPayload(payload) {
  let subscription = null;

  if (payload.stripeSubscriptionId) {
    subscription = await SubscriptionStore.findByStripeSubscriptionId(payload.stripeSubscriptionId);
  }

  if (!subscription && payload.subscriptionId) {
    subscription = await SubscriptionStore.findById(payload.subscriptionId);
  }

  if (!subscription || !isSubscriptionActive(subscription)) {
    return null;
  }

  if (subscription.email !== payload.email) {
    return null;
  }

  return subscription;
}

function buildVerifiedAccessResponse(subscription) {
  const planDisplayName = getPlanDisplayName(subscription.planCode);
  const bookingToken = issueBookingToken(subscription);

  return {
    status: 200,
    body: {
      success: true,
      message: 'Subscriber access verified.',
      data: {
        bookingToken,
        email: subscription.email,
        planCode: subscription.planCode,
        planDisplayName
      }
    }
  };
}

async function verifySubscriberAccess(req, res) {
  try {
    const accessToken = (req.query.access_token || req.body?.access_token || '').trim();
    const sessionId = (req.query.session_id || req.body?.session_id || '').trim();
    const email = (req.query.email || req.body?.email || '').trim().toLowerCase();

    if (accessToken) {
      const payload = verifyOnboardingAccessToken(accessToken);
      if (!payload) {
        return res.status(403).json({
          success: false,
          message: 'Invalid or expired onboarding access.'
        });
      }

      const subscription = await resolveSubscriptionFromAccessPayload(payload);
      if (!subscription) {
        return res.status(403).json({
          success: false,
          message: 'No active subscription was found for this onboarding link.'
        });
      }

      if (subscription.onboardingMeetingScheduledAt) {
        return res.status(409).json({
          success: false,
          message: 'An onboarding meeting has already been scheduled for this subscription.',
          data: {
            alreadyScheduled: true,
            meetLink: subscription.onboardingMeetLink || null
          }
        });
      }

      const response = buildVerifiedAccessResponse(subscription);
      return res.status(response.status).json(response.body);
    }

    if (!sessionId || !email) {
      return res.status(400).json({
        success: false,
        message: 'A valid onboarding access link is required. Open the link from your subscription confirmation email.'
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'A valid email address is required.'
      });
    }

    const stripe = getStripeClient();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.mode !== 'subscription') {
      return res.status(403).json({
        success: false,
        message: 'This checkout session is not for a subscription.'
      });
    }

    if (session.payment_status !== 'paid' || session.status !== 'complete') {
      return res.status(403).json({
        success: false,
        message: 'Payment has not been completed for this checkout session.'
      });
    }

    const sessionEmail = (
      session.customer_details?.email
      || session.customer_email
      || ''
    ).trim().toLowerCase();

    if (!sessionEmail || sessionEmail !== email) {
      return res.status(403).json({
        success: false,
        message: 'The email address does not match this checkout session.'
      });
    }

    let subscription = await findSubscriptionForCheckoutSession(sessionId);

    if (!subscription && session.subscription) {
      subscription = await SubscriptionStore.findByStripeSubscriptionId(session.subscription);
    }

    if (!subscription || !isSubscriptionActive(subscription)) {
      return res.status(403).json({
        success: false,
        message: 'No active subscription was found for this checkout session.'
      });
    }

    if (subscription.email !== email) {
      return res.status(403).json({
        success: false,
        message: 'The email address does not match the subscription record.'
      });
    }

    if (subscription.onboardingMeetingScheduledAt) {
      return res.status(409).json({
        success: false,
        message: 'An onboarding meeting has already been scheduled for this subscription.',
        data: {
          alreadyScheduled: true,
          meetLink: subscription.onboardingMeetLink || null
        }
      });
    }

    const response = buildVerifiedAccessResponse(subscription);
    return res.status(response.status).json(response.body);
  } catch (error) {
    logger.error(`Verify subscriber access error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Unable to verify subscriber access.'
    });
  }
}

async function scheduleSubscriberMeeting(req, res) {
  try {
    const subscription = req.subscriber;
    const planDisplayName = getPlanDisplayName(subscription.planCode);

    if (subscription.onboardingMeetingScheduledAt) {
      return res.status(409).json({
        success: false,
        message: 'An onboarding meeting has already been scheduled for this subscription.'
      });
    }

    const name = (req.body?.name || '').trim();
    const phone = (req.body?.phone || '').trim();
    const preferredDate = req.body?.preferred_date || req.body?.preferredDate;
    const preferredTime = req.body?.preferred_time || req.body?.preferredTime;
    const preferredTimezone = req.body?.preferred_timezone || req.body?.preferredTimezone || 'EST';
    const message = (req.body?.message || '').trim();

    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Name and phone are required.'
      });
    }

    if (!validatePhone(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone format.'
      });
    }

    if (!hasScheduledMeeting({ preferredDate, preferredTime })) {
      return res.status(400).json({
        success: false,
        message: 'Preferred date and time are required.'
      });
    }

    const meetingDetails = {
      name,
      email: subscription.email,
      phone,
      planCode: subscription.planCode,
      planDisplayName,
      preferredDate,
      preferredTime,
      preferredTimezone,
      message,
      stripeSubscriptionId: subscription.stripeSubscriptionId,
      stripeCheckoutSessionId: subscription.stripeCheckoutSessionId
    };

    const meeting = await ContactForms.withMeetingSlotLock(
      normalizePreferredDate(preferredDate),
      normalizePreferredTime(preferredTime),
      async () => createMeetEvent({
        name,
        email: subscription.email,
        service: planDisplayName,
        preferredDate,
        preferredTime,
        preferredTimezone,
        message,
        sourceNote: `Booked via subscriber onboarding (${planDisplayName}).`,
        summaryPrefix: 'VoloLeads Onboarding'
      })
    );

    await notifyAdminSubscriberMeeting({
      ...meetingDetails,
      meetLink: meeting.created ? meeting.meetLink : null
    });

    if (!meeting.created) {
      logger.warn(`Subscriber meeting was not created for ${subscription.email}: ${meeting.reason}`);

      if (['slot_unavailable', 'availability_check_failed', 'insufficient_notice', 'sunday_unavailable'].includes(meeting.reason)) {
        return res.status(409).json({
          success: false,
          message: meeting.reason === 'insufficient_notice'
            ? 'Meetings require at least 24 hours notice. Please choose the next available day.'
            : meeting.reason === 'sunday_unavailable'
              ? 'Meetings are not available on Sundays.'
              : 'That meeting time is no longer available. Please choose another time.'
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Unable to schedule the meeting right now. Please try again or contact support.'
      });
    }

    await SubscriptionStore.markOnboardingMeetingScheduled(subscription.id, {
      meetLink: meeting.meetLink,
      calendarEventId: meeting.eventId
    });

    await notifySubscriberMeeting(meetingDetails, meeting);

    return res.status(201).json({
      success: true,
      message: 'Onboarding meeting scheduled. Check your email for the Google Meet link.',
      data: {
        email: subscription.email,
        planDisplayName,
        meetScheduled: true
      }
    });
  } catch (error) {
    logger.error(`Schedule subscriber meeting error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to schedule meeting. Please try again later.'
    });
  }
}

module.exports = {
  verifySubscriberAccess,
  scheduleSubscriberMeeting
};
