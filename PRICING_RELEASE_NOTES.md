# Pricing update, October 22, 2026

All new subscriptions are billed monthly. Annual billing has been removed from the website and the checkout endpoint. The user will remove the Growth and Scale subscription upsells in Stripe.

| Plan | Regular monthly price | Advertised price with a valid promo code | Monthly savings |
| --- | --- | --- | --- |
| Essential | $730/month | No advertised coupon offer | Not applicable |
| Growth | $1,699/month | $1,535/month | $164/month |
| Scale | $2,999/month | $2,685/month | $314/month |

Growth and Scale cards show the crossed-out regular price, prominent discounted monthly price, and a savings badge. The front and reverse sides, comparison table, plan finder, and FAQ describe monthly billing. The offer requires a valid Stripe promotion code; it is not applied automatically. The user manages codes and discount terms in Stripe, and requested that the cards avoid a fixed coupon duration.

Essential includes WAVV Triple Line Dialer and a one-time signup bonus of 10,000 leads sourced using BatchLeads. Its card shows "10,000 leads signup bonus." No delivery date, skip tracing, recurring free replenishment, or BatchLeads account access has been promised. The bonus has not been added to other plans.

The centered popup appears after 3 seconds, once per tab session. It closes with its close button, Not now, Escape, or the backdrop. It skips visitors using a form, viewing another dialog, checking out, or visiting the contact section. View Essential takes the visitor to the Essential card.

## Stripe configuration

The backend requires these active USD prices:

- `STRIPE_PRICE_ESSENTIAL_MONTHLY_RECURRING`: 73000 cents, monthly.
- `STRIPE_PRICE_PREMIUM_MONTHLY`: 169900 cents, monthly.
- `STRIPE_PRICE_CUSTOM_PLUS_MONTHLY`: 299900 cents, monthly.

Growth and Scale Checkout sessions enable customer-entered promotion codes. Create a customer-facing promotion code for each coupon and restrict the coupon to its matching product in Stripe. New sessions start at the regular monthly price; Stripe applies and validates the code. Essential promotion-code entry stays disabled.

Remove the Growth and Scale upsell configurations from their monthly Price details pages in Stripe. This Dashboard-only setting must be removed by the user, as requested. Annual Checkout API requests are rejected, and the deployment verifier checks only the three monthly prices. Old annual price variables can remain for historical subscription lookup, but are not required for deployment. Historical annual billing information remains available to webhook and email handling for existing subscriptions or in-flight sessions.

Essential has no setup fee. Old setup-price environment variables are ignored. The legacy Essential recurring-price fallback remains supported but must pass the same monthly amount and interval checks.

The historical database plan-code names are retained. New Checkout metadata records monthly billing. Stripe discounts are not hardcoded or automatically attached from a request-body promo code. Existing subscriptions, Stripe prices, and invoices are not migrated or deleted.

## Deployment

No cPanel deployment, Stripe price or coupon creation, subscription migration, or email sending was performed locally. Live Stripe verification requires the server environment.

After configuring the three monthly price IDs and removing the Stripe upsells, pull `NEXTJS` and run `bash scripts/deploy-pricing-cpanel.sh` as the `vololead` account. The script verifies the monthly prices using the existing backend environment before copying files. If variables are configured only in cPanel rather than `backend/.env`, make them available to the terminal process without printing secrets.

The script backs up both app directories without environment files or dependencies. It preserves routing, builds the frontend with the cPanel resource settings, copies only the six billing backend files, restarts both apps, and checks the site and API. This billing release is separate from the usual frontend-only `.cpanel.yml` hook. No environment files, database schemas, or existing subscriptions are changed by the script.

## Copy and local preview

Applied the unslop skill to homepage marketing copy, campaign setup explanations, plan descriptions, and the plan finder. Kept customer testimonials unchanged. Simplified vague or inflated wording into concrete service descriptions. Savings badges and offer notes support light and dark themes.

## Validation

- Production build uses webpack and the existing single-worker cPanel settings.
- Billing regression tests cover monthly checkout, Growth and Scale promotion-code entry, Essential without a setup fee, and rejection of annual requests even with old annual price variables present.
- Historical subscription and email handling retains support for already-created annual subscriptions.
- Browser checks cover both themes and mobile/desktop pricing layouts.
