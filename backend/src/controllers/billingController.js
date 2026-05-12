const getStripeClient = require('../config/stripe');
const { getPlanCode, getPlanConfig, getPlanPriceIds, PLAN_CODES } = require('../config/billing');
const Subscription = require('../models/Subscription');
const { sendEmail } = require('../utils/mailer');
const logger = require('../utils/logger');

function getAppBaseUrl() {
  return (process.env.APP_BASE_URL || process.env.API_BASE_URL || 'http://localhost:4173').replace(/\/$/, '');
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
      throw new Error('Missing setup Stripe price for essential weekly plan');
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

function getSubscriptionEmailText({ displayName, email }) {
  return `Thanks for choosing VoloLeads. Your ${displayName} payment was successful and your subscription is now active for ${email}.`;
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

    let subscriptionRecord = await Subscription.findOne({ email }).sort({ updatedAt: -1 });
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
      subscriptionRecord.metadata = subscriptionRecord.metadata || new Map();
      subscriptionRecord.metadata.set('lastPortalLinkSentAt', new Date().toISOString());
      await subscriptionRecord.save();
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

        const record = await Subscription.findOneAndUpdate(
          { stripeCheckoutSessionId: session.id },
          {
            email,
            stripeCustomerId: session.customer,
            stripeSubscriptionId: session.subscription,
            stripeCheckoutSessionId: session.id,
            planCode,
            status: 'active'
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        const plan = getPlanConfig(planCode);
        await sendEmail({
          to: email,
          subject: 'Your VoloLeads payment was successful',
          text: getSubscriptionEmailText({ displayName: plan.displayName, email }),
          html: `<p>${getSubscriptionEmailText({ displayName: plan.displayName, email })}</p>`
        });

        logger.info(`Stripe checkout completed for ${record.email}`);
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object;
        const stripeSubscriptionId = invoice.subscription;
        if (!stripeSubscriptionId) break;

        const subscription = await getStripeClient().subscriptions.retrieve(stripeSubscriptionId);
        const currentPeriodEnd = subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : null;
        const metadata = subscription.metadata || {};
        const planCode = metadata.planCode || null;

        await Subscription.findOneAndUpdate(
          { stripeSubscriptionId },
          {
            status: subscription.status,
            currentPeriodEnd,
            serviceAccessEndsAt: currentPeriodEnd,
            cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
            ...(planCode ? { planCode } : {})
          },
          { new: true }
        );
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        if (invoice.subscription) {
          await Subscription.findOneAndUpdate(
            { stripeSubscriptionId: invoice.subscription },
            { status: 'past_due' },
            { new: true }
          );
        }
        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const currentPeriodEnd = subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : null;
        const planCode = subscription.metadata && subscription.metadata.planCode;
        const serviceAccessEndsAt = subscription.cancel_at_period_end || event.type === 'customer.subscription.deleted'
          ? computeServiceAccessEnd(currentPeriodEnd, planCode)
          : currentPeriodEnd;

        await Subscription.findOneAndUpdate(
          { stripeSubscriptionId: subscription.id },
          {
            stripeCustomerId: subscription.customer,
            status: subscription.status,
            cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
            currentPeriodEnd,
            serviceAccessEndsAt,
            canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
            ...(planCode ? { planCode } : {})
          },
          { new: true }
        );
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
  requestManageLink,
  handleStripeWebhook
};
