const getStripeClient = require('../config/stripe');
const { getPlanCode, getPlanConfig, getPlanPriceIds, PLAN_CODES } = require('../config/billing');
const {
  getSubscriptionEmailSubject,
  getSubscriptionEmailText,
  getPlanEmailDetails,
  buildSubscriptionEmailHtml,
  resolveCheckoutDiscount
} = require('../emails/subscriptionConfirmationEmail');
const SubscriptionStore = require('../repositories/subscriptions');
const { sendEmail } = require('../utils/mailer');
const logger = require('../utils/logger');

function getAppBaseUrl() {
  return (process.env.APP_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
}

function getEmailBaseUrl() {
  const baseUrl = getAppBaseUrl();
  return /localhost|127\.0\.0\.1/i.test(baseUrl) ? 'https://vololeads.com' : baseUrl;
}

function buildCheckoutLineItems(planCode) {
  const priceIds = getPlanPriceIds(planCode);
  const plan = getPlanConfig(planCode);

  if (!plan || !priceIds || !priceIds.recurring) {
    throw new Error(`Missing Stripe price configuration for ${planCode}`);
  }

  const items = [
    {
      price: priceIds.recurring,
      quantity: 1
    }
  ];

  if (planCode === PLAN_CODES.ESSENTIAL_WEEKLY) {
    if (!priceIds.setup) {
      throw new Error('Missing setup Stripe price for starter plan');
    }

    items.unshift({
      price: priceIds.setup,
      quantity: 1
    });
  }

  return items;
}

function computeServiceAccessEnd(periodEnd, planCode) {
  if (!periodEnd) return null;

  const serviceEnd = new Date(periodEnd);
  const plan = getPlanConfig(planCode);
  if (!plan) return serviceEnd;

  serviceEnd.setUTCDate(serviceEnd.getUTCDate() + plan.graceDaysAfterCancel);
  return serviceEnd;
}

const DEFAULT_SUBSCRIPTION_NOTIFY_EMAIL = 'vololeads@gmail.com';

function getSubscriptionNotifyEmail() {
  return process.env.SUBSCRIPTION_NOTIFY_EMAIL || DEFAULT_SUBSCRIPTION_NOTIFY_EMAIL;
}

function buildAdminNewSubscriptionText({ email, planDisplayName, planCode, status, stripeSubscriptionId, stripeCustomerId, promoCode = null }) {
  return [
    'A new VoloLeads subscription was created.',
    '',
    `Customer email: ${email}`,
    `Plan: ${planDisplayName} (${planCode})`,
    `Status: ${status}`,
    promoCode ? `Promo code: ${promoCode}` : null,
    `Stripe subscription: ${stripeSubscriptionId || 'n/a'}`,
    `Stripe customer: ${stripeCustomerId || 'n/a'}`,
    '',
    `Time (UTC): ${new Date().toISOString()}`
  ].filter(Boolean).join('\n');
}

function buildAdminNewSubscriptionHtml({ email, planDisplayName, planCode, status, stripeSubscriptionId, stripeCustomerId, promoCode = null }) {
  const lines = [
    ['Customer email', email],
    ['Plan', `${planDisplayName} (${planCode})`],
    ['Status', status],
    promoCode ? ['Promo code', promoCode] : null,
    ['Stripe subscription', stripeSubscriptionId || 'n/a'],
    ['Stripe customer', stripeCustomerId || 'n/a'],
    ['Time (UTC)', new Date().toISOString()]
  ].filter(Boolean);

  const rows = lines.map(([label, value]) => (
    `<tr><td style="padding:8px 12px 8px 0;color:#94a3b8;vertical-align:top;">${label}</td>`
    + `<td style="padding:8px 0;color:#f8fafc;"><strong>${value}</strong></td></tr>`
  )).join('');

  return `<div style="font-family:Arial,sans-serif;background:#0f172a;color:#e2e8f0;padding:24px;">
    <h2 style="margin:0 0 16px;color:#ffffff;">New subscription</h2>
    <p style="margin:0 0 16px;line-height:1.6;">Someone just completed checkout on VoloLeads.</p>
    <table style="border-collapse:collapse;">${rows}</table>
  </div>`;
}

async function notifyAdminNewSubscription(details) {
  const notifyTo = getSubscriptionNotifyEmail();

  const plan = getPlanConfig(details.planCode);
  const planDisplayName = plan ? plan.displayName : details.planCode;

  try {
    const result = await sendEmail({
      to: notifyTo,
      subject: `New VoloLeads subscription: ${planDisplayName} — ${details.email}`,
      text: buildAdminNewSubscriptionText({ ...details, planDisplayName }),
      html: buildAdminNewSubscriptionHtml({ ...details, planDisplayName })
    });

    if (!result || !result.sent) {
      logger.warn(`Admin subscription notification was not sent to ${notifyTo}`);
      return;
    }

    logger.info(`Admin subscription notification sent to ${notifyTo} for ${details.email}`);
  } catch (error) {
    logger.error(`Admin subscription notification failed: ${error.message}`);
  }
}

function inferPlanCodeFromStripeSubscription(subscription) {
  if (!subscription || !subscription.items || !Array.isArray(subscription.items.data)) {
    return null;
  }

  const subscriptionPriceIds = new Set(
    subscription.items.data
      .map(item => item && item.price && item.price.id)
      .filter(Boolean)
  );

  for (const planCode of Object.values(PLAN_CODES)) {
    const priceIds = getPlanPriceIds(planCode);
    if (priceIds && priceIds.recurring && subscriptionPriceIds.has(priceIds.recurring)) {
      return planCode;
    }
  }

  return null;
}

function formatDate(dateValue) {
  if (!dateValue) return 'your next billing date';

  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date(dateValue));
}

function buildLifecycleEmailHtml({ eyebrow, headline, summary, email, accentLabel, accentBackground, accentColor, detailLines, ctaLabel, ctaHref, footerText }) {
  const detailMarkup = detailLines
    .map(line => `<tr><td style="padding:0 0 12px 0;font-size:15px;line-height:1.6;color:#dbe4f0;"><span style="display:inline-block;width:20px;color:#f97316;font-weight:700;">&#8226;</span>${line}</td></tr>`)
    .join('');

  return `
  <div style="margin:0;background:#0f172a;padding:32px 16px;font-family:Arial,sans-serif;color:#e2e8f0;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:640px;margin:0 auto;background:#111827;border:1px solid #334155;border-radius:24px;overflow:hidden;box-shadow:0 20px 50px rgba(15,23,42,0.32);">
      <tr>
        <td style="background:#f8fafc;padding:28px 32px;">
          <div style="font-size:12px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#9a5a12;margin-bottom:14px;">${eyebrow}</div>
          <div style="font-size:34px;line-height:1.1;font-weight:800;color:#111827;margin-bottom:10px;">${headline}</div>
          <div style="font-size:16px;line-height:1.6;color:#475569;max-width:440px;">${summary}</div>
        </td>
      </tr>
      <tr>
        <td style="padding:28px 32px 8px 32px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td style="padding:0 0 18px 0;"><div style="display:inline-block;padding:8px 12px;background:${accentBackground};border:1px solid ${accentColor};border-radius:999px;font-size:12px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:${accentColor};">${accentLabel}</div></td>
            </tr>
            <tr>
              <td style="padding:0 0 10px 0;font-size:16px;line-height:1.7;color:#dbe4f0;">Subscription email: <strong style="color:#ffffff;">${email}</strong></td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:0 32px 8px 32px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#172033;border:1px solid #334155;border-radius:20px;padding:22px;">
            <tr><td style="padding:0 0 14px 0;font-size:18px;font-weight:800;color:#ffffff;">Details</td></tr>
            ${detailMarkup}
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:24px 32px 32px 32px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td style="border-radius:999px;background:#f97316;"><a href="${ctaHref}" style="display:inline-block;padding:14px 22px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;">${ctaLabel}</a></td></tr></table>
          <div style="padding-top:18px;font-size:13px;line-height:1.7;color:#94a3b8;">${footerText}</div>
        </td>
      </tr>
    </table>
  </div>`;
}

function buildPaymentFailedEmailHtml({ email, planCode, appBaseUrl, invoiceUrl }) {
  const details = getPlanEmailDetails(planCode);

  return buildLifecycleEmailHtml({
    eyebrow: details.eyebrow,
    headline: 'We could not process your renewal',
    summary: 'Your latest Stripe payment did not go through, so we need you to review your billing details.',
    email,
    accentLabel: 'Payment failed',
    accentBackground: '#331b1b',
    accentColor: '#fca5a5',
    detailLines: [
      `${details.headline.replace(' is active', '')} needs an updated payment method.`,
      'Stripe marked the latest invoice as unpaid, so your subscription may become past due.',
      'Use the secure billing portal below to update your card and retry payment.'
    ],
    ctaLabel: invoiceUrl ? 'View Invoice' : 'Update Billing Method',
    ctaHref: invoiceUrl || `${appBaseUrl}/manage-subscription.html`,
    footerText: 'Once payment succeeds, VoloLeads will continue your service without interruption.'
  });
}

function buildPaymentReminderEmailHtml({ email, planCode, appBaseUrl, renewalDate }) {
  const details = getPlanEmailDetails(planCode);

  return buildLifecycleEmailHtml({
    eyebrow: details.eyebrow,
    headline: 'Your renewal is coming up soon',
    summary: `We are sending a quick reminder that your next VoloLeads renewal is scheduled for ${formatDate(renewalDate)}.`,
    email,
    accentLabel: 'Payment reminder',
    accentBackground: '#2b2118',
    accentColor: '#fb923c',
    detailLines: [
      `${details.headline.replace(' is active', '')} will renew automatically on ${formatDate(renewalDate)}.`,
      'Please make sure your card on file is current to avoid any interruption.',
      'You can review or change your payment method anytime from the billing portal.'
    ],
    ctaLabel: 'Review Billing Details',
    ctaHref: `${appBaseUrl}/manage-subscription.html`,
    footerText: 'If everything looks good, no action is needed.'
  });
}

function getInvoiceSubscriptionId(invoice) {
  return invoice.subscription
    || (invoice.parent
      && invoice.parent.subscription_details
      && invoice.parent.subscription_details.subscription)
    || null;
}

async function upsertSubscriptionFromStripe(stripeSubscriptionId, fallbackEmail = null) {
  const stripe = getStripeClient();
  const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
  const metadata = subscription.metadata || {};
  const planCode = metadata.planCode || inferPlanCodeFromStripeSubscription(subscription) || null;
  const currentPeriodStart = subscription.current_period_start ? new Date(subscription.current_period_start * 1000) : null;
  const currentPeriodEnd = subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : null;

  let customerEmail = fallbackEmail || null;
  if (!customerEmail && subscription.customer) {
    const customer = await stripe.customers.retrieve(subscription.customer);
    if (customer && !customer.deleted) {
      customerEmail = customer.email || null;
    }
  }

  await SubscriptionStore.upsertBySubscriptionId({
    email: customerEmail || 'unknown-subscription-email@local.invalid',
    stripeCustomerId: subscription.customer,
    stripeSubscriptionId,
    stripeCheckoutSessionId: null,
    planCode: planCode || 'unknown_plan',
    status: subscription.status,
    cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
    currentPeriodStart,
    currentPeriodEnd,
    serviceAccessEndsAt: currentPeriodEnd,
    canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null
  });

  return subscription;
}

async function processRenewalReminders(now = new Date(), options = {}) {
  const dryRun = Boolean(options.dryRun);
  const appBaseUrl = getEmailBaseUrl();
  const reminders = [
    { key: 'week3', subject: 'Your VoloLeads renewal is coming up' },
    { key: 'day3', subject: 'Reminder: your VoloLeads renewal is in 3 days' },
    { key: 'day1', subject: 'Final reminder: your VoloLeads renewal is tomorrow' }
  ];

  let sentCount = 0;
  const dueItems = [];

  for (const reminder of reminders) {
    const subscriptions = await SubscriptionStore.findDueRenewalReminders(reminder.key, now);

    for (const subscription of subscriptions) {
      dueItems.push({
        reminderKey: reminder.key,
        email: subscription.email,
        planCode: subscription.planCode,
        currentPeriodEnd: subscription.currentPeriodEnd
      });

      if (dryRun) {
        continue;
      }

      const emailResult = await sendEmail({
        to: subscription.email,
        subject: reminder.subject,
        text: `Your VoloLeads subscription is set to renew on ${formatDate(subscription.currentPeriodEnd)}. Review your billing details here: ${appBaseUrl}/manage-subscription.html`,
        html: buildPaymentReminderEmailHtml({
          email: subscription.email,
          planCode: subscription.planCode,
          appBaseUrl,
          renewalDate: subscription.currentPeriodEnd
        })
      });

      if (!emailResult || !emailResult.sent) {
        logger.warn(`Reminder email for ${subscription.email} (${reminder.key}) was not sent; leaving reminder marker unchanged`);
        continue;
      }

      await SubscriptionStore.markReminderSent(subscription.id, reminder.key, now);
      sentCount += 1;
    }
  }

  return {
    dryRun,
    sentCount,
    dueCount: dueItems.length,
    dueItems
  };
}

async function createCheckoutSession(req, res) {
  try {
    const planCode = getPlanCode(req.body && req.body.plan);
    if (!planCode) {
      return res.status(400).json({ success: false, message: 'Invalid subscription plan selected.' });
    }

    const stripe = getStripeClient();
    const plan = getPlanConfig(planCode);
    const appBaseUrl = getAppBaseUrl();

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: buildCheckoutLineItems(planCode),
      success_url: `${appBaseUrl}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appBaseUrl}/cancel.html`,
      billing_address_collection: 'auto',
      allow_promotion_codes: true,
      metadata: {
        planCode
      },
      subscription_data: {
        metadata: {
          planCode,
          graceDaysAfterCancel: String(plan.graceDaysAfterCancel)
        }
      }
    });

    return res.status(200).json({ success: true, url: session.url });
  } catch (error) {
    logger.error(`Stripe checkout session error: ${error.message}`);
    return res.status(500).json({ success: false, message: 'Unable to create checkout session.' });
  }
}

async function requestManageLink(req, res) {
  try {
    const email = (req.body && req.body.email || '').trim().toLowerCase();
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }

    const stripe = getStripeClient();
    const appBaseUrl = getAppBaseUrl();

    let subscriptionRecord = await SubscriptionStore.findLatestByEmail(email);
    let stripeCustomerId = subscriptionRecord && subscriptionRecord.stripeCustomerId;

    if (!stripeCustomerId) {
      const customers = await stripe.customers.list({ email, limit: 1 });
      stripeCustomerId = customers.data[0] && customers.data[0].id;
    }

    if (!stripeCustomerId) {
      return res.status(404).json({ success: false, message: 'No subscription was found for that email address.' });
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${appBaseUrl}/manage-subscription.html`
    });

    const subject = 'Your VoloLeads subscription management link';
    const text = `Use this secure link to manage your subscription: ${portalSession.url}`;
    await sendEmail({ to: email, subject, text, html: `<p>Use this secure link to manage your subscription:</p><p><a href="${portalSession.url}">${portalSession.url}</a></p>` });

    if (subscriptionRecord) {
      await SubscriptionStore.touchPortalLinkSentAt(subscriptionRecord.id);
    }

    return res.status(200).json({
      success: true,
      message: 'Manage subscription link sent successfully.',
      ...(process.env.NODE_ENV !== 'production' ? { debugUrl: portalSession.url } : {})
    });
  } catch (error) {
    logger.error(`Request manage link error: ${error.message}`);
    return res.status(500).json({ success: false, message: 'Unable to send manage subscription link.' });
  }
}

async function handleStripeWebhook(req, res) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    logger.error('STRIPE_WEBHOOK_SECRET is not configured');
    return res.status(500).send('Webhook secret is not configured');
  }

  let event;
  try {
    const stripe = getStripeClient();
    const signature = req.headers['stripe-signature'];
    event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
  } catch (error) {
    logger.error(`Stripe webhook signature verification failed: ${error.message}`);
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        if (session.mode !== 'subscription') break;

        const planCode = session.metadata && session.metadata.planCode;
        const email = session.customer_details && session.customer_details.email;
        if (!planCode || !email) break;

        const stripe = getStripeClient();
        const stripeSubscription = session.subscription
          ? await stripe.subscriptions.retrieve(session.subscription, {
            expand: ['discount.promotion_code', 'discount.coupon']
          })
          : null;
        const discountInfo = await resolveCheckoutDiscount(stripe, session, stripeSubscription);
        const currentPeriodStart = stripeSubscription && stripeSubscription.current_period_start
          ? new Date(stripeSubscription.current_period_start * 1000)
          : null;
        const currentPeriodEnd = stripeSubscription && stripeSubscription.current_period_end
          ? new Date(stripeSubscription.current_period_end * 1000)
          : null;

        const record = await SubscriptionStore.upsertBySubscriptionId({
          email,
          stripeCustomerId: session.customer,
          stripeSubscriptionId: session.subscription,
          stripeCheckoutSessionId: session.id,
          planCode,
          status: stripeSubscription ? stripeSubscription.status : 'active',
          cancelAtPeriodEnd: stripeSubscription ? Boolean(stripeSubscription.cancel_at_period_end) : false,
          currentPeriodStart,
          currentPeriodEnd,
          serviceAccessEndsAt: currentPeriodEnd,
          canceledAt: stripeSubscription && stripeSubscription.canceled_at
            ? new Date(stripeSubscription.canceled_at * 1000)
            : null
        });

        const plan = getPlanConfig(planCode);
        const appBaseUrl = getEmailBaseUrl();
        const emailSubject = getSubscriptionEmailSubject(discountInfo);

        await sendEmail({
          to: email,
          subject: emailSubject,
          text: getSubscriptionEmailText({
            displayName: plan.displayName,
            email,
            discountInfo,
            planCode
          }),
          html: buildSubscriptionEmailHtml({ email, planCode, appBaseUrl, discountInfo })
        });

        await notifyAdminNewSubscription({
          email,
          planCode,
          status: record.status,
          stripeSubscriptionId: session.subscription,
          stripeCustomerId: session.customer,
          promoCode: discountInfo.hasDiscount ? discountInfo.promoCode : null
        });

        logger.info(`Stripe checkout completed for ${record.email}`);
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object;
        const stripeSubscriptionId = getInvoiceSubscriptionId(invoice);
        if (!stripeSubscriptionId) break;

        const customerEmail = invoice.customer_email || (invoice.customer_details && invoice.customer_details.email) || null;
        await upsertSubscriptionFromStripe(stripeSubscriptionId, customerEmail);

        await SubscriptionStore.updateBySubscriptionId(stripeSubscriptionId, {
          reminderWeek3SentAt: null,
          reminderDay3SentAt: null,
          reminderDay1SentAt: null
        });
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const stripeSubscriptionId = getInvoiceSubscriptionId(invoice);
        if (stripeSubscriptionId) {
          await SubscriptionStore.updateBySubscriptionId(stripeSubscriptionId, { status: 'past_due' });

          const subscription = await getStripeClient().subscriptions.retrieve(stripeSubscriptionId);
          const appBaseUrl = getEmailBaseUrl();
          const planCode = subscription.metadata && subscription.metadata.planCode;
          const recipient = invoice.customer_email || null;

          if (recipient) {
            await sendEmail({
              to: recipient,
              subject: 'Your VoloLeads payment needs attention',
              text: `We could not process your latest VoloLeads renewal. Update your payment method here: ${invoice.hosted_invoice_url || `${appBaseUrl}/manage-subscription.html`}`,
              html: buildPaymentFailedEmailHtml({
                email: recipient,
                planCode,
                appBaseUrl,
                invoiceUrl: invoice.hosted_invoice_url
              })
            });
          }
        }
        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const eventSubscription = event.data.object;
        const customerEmail = eventSubscription.customer_email || null;
        const subscription = await upsertSubscriptionFromStripe(eventSubscription.id, customerEmail);
        const currentPeriodEnd = subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : null;
        const planCode = subscription.metadata && subscription.metadata.planCode;
        const serviceAccessEndsAt = subscription.cancel_at_period_end || event.type === 'customer.subscription.deleted'
          ? computeServiceAccessEnd(currentPeriodEnd, planCode)
          : currentPeriodEnd;

        await SubscriptionStore.updateBySubscriptionId(subscription.id, {
          stripeCustomerId: subscription.customer,
          status: subscription.status,
          cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
          currentPeriodStart: subscription.current_period_start ? new Date(subscription.current_period_start * 1000) : null,
          currentPeriodEnd,
          serviceAccessEndsAt,
          canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
          ...(planCode ? { planCode } : {})
        });
        break;
      }

      default:
        logger.debug(`Unhandled Stripe event type: ${event.type}`);
    }

    return res.json({ received: true });
  } catch (error) {
    logger.error(`Stripe webhook handler error: ${error.message}`);
    return res.status(500).send('Webhook handler failed');
  }
}

module.exports = {
  createCheckoutSession,
  processRenewalReminders,
  requestManageLink,
  handleStripeWebhook
};
