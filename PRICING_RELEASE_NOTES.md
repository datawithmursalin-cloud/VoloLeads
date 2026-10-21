# Pricing update, October 22, 2026

The user clarified that the lower Growth and Scale prices require annual billing.

| Plan | Monthly billing | Annual billing, paid upfront | Savings against monthly billing |
| --- | --- | --- | --- |
| Essential | $730/month | Not offered | Not applicable |
| Growth | $1,699/month | $18,420/year, equivalent to $1,535/month | $1,968/year |
| Scale | $2,999/month | $32,220/year, equivalent to $2,685/month | $3,768/year |

Essential includes WAVV Triple Line Dialer and a one-time signup bonus of 10,000 leads sourced using BatchLeads. Its card shows the short bold line requested by the user, "10,000 leads signup bonus." No delivery date, skip tracing, recurring free replenishment, or BatchLeads account access has been promised. The bonus has not been added to other plans.

The centered popup appears after 3 seconds, once per tab session. It can be closed with its close button, Not now, Escape, or the backdrop. It skips visitors using a form, viewing another dialog, checking out, or visiting the contact section. View Essential takes the visitor to the Essential card.

## Billing configuration before release

The local code and preview are updated. No cPanel deployment, Stripe price creation, subscription migration, or email sending was performed.

The backend must have these active USD prices configured:

- `STRIPE_PRICE_ESSENTIAL_MONTHLY_RECURRING`: 73000 cents, monthly.
- `STRIPE_PRICE_PREMIUM_MONTHLY`: 169900 cents, monthly.
- `STRIPE_PRICE_CUSTOM_PLUS_MONTHLY`: 299900 cents, monthly.
- `STRIPE_PRICE_PREMIUM_ANNUAL`: 1842000 cents, yearly.
- `STRIPE_PRICE_CUSTOM_PLUS_ANNUAL`: 3222000 cents, yearly.

Essential has no setup fee. New checkouts contain only the $730 monthly recurring price, even if old setup-price environment variables remain on the server. `STRIPE_PRICE_ESSENTIAL_MONTHLY_SETUP` and `STRIPE_PRICE_ESSENTIAL_WEEKLY_SETUP` can be removed from the backend environment after this release is deployed. The legacy recurring-price fallback remains supported but must pass the same monthly amount and interval checks. Existing Stripe prices and historical invoices are not deleted or changed.

The checkout endpoint verifies the selected amount, currency, and interval before creating a session. An annual checkout never falls back to a monthly price. Promotion-code entry remains disabled for new checkouts, preserving the newer remote policy. Existing customer subscriptions are not changed.

The historical database plan-code names are retained for compatibility. The separate `billingCycle` field is recorded in Stripe metadata and existing subscription metadata. Confirmation and onboarding emails use the actual Stripe interval when available.

## Billing selection inside Stripe Checkout

The website has no billing selector. Growth and Scale buttons start with their monthly prices and tell customers to choose monthly or annual billing in Stripe. Their cards and comparison table emphasize $1,535/month and $2,685/month with savings of $164/month and $314/month directly below, followed by struck-through monthly rates of $1,699 and $2,999. A short note by checkout explains that the annual rate is paid upfront.

Configure these Dashboard-only subscription upsells before deploying this version:

- Growth: open the $1,699/month Price details page. Under Upsells, select the $18,420/year price.
- Scale: open the $2,999/month Price details page. Under Upsells, select the $32,220/year price.

Each pair must belong to the same product and use the same currency and tax behavior. Stripe then presents both options in eligible hosted subscription checkouts. Creating two prices alone does not enable the chooser. Essential remains monthly only, without an upsell or setup fee.

The completion webhook retrieves the actual Checkout line items after purchase, so an annual selection inside Stripe produces annual confirmation pricing even though checkout started with monthly metadata. Keep all five configured price IDs; the deployment verification still checks them.

Reference: https://docs.stripe.com/payments/checkout/upsells

Run `node scripts/verifyCheckoutPrices.js` from the backend with the server's environment to verify all five prices. Live verification and a Stripe test-mode checkout could not be completed because Stripe credentials are not available locally. Do not deploy only the frontend and assume the billing amounts have changed. Follow `cpanelskill.md` for frontend deployment and keep the backend application separate.

After configuring those Stripe price IDs in the backend app's environment, pull `NEXTJS` and run `bash scripts/deploy-pricing-cpanel.sh` as the `vololead` account. The script checks prices using the new configuration and the existing backend environment before copying files. If the app variables are configured only in cPanel rather than in `backend/.env`, make those same variables available to the terminal process. Never print secrets to obtain them.

The script backs up both application directories without environment files or dependencies. It preserves the routing and existing applications, builds the frontend with the cPanel resource settings, copies only the six required backend files, restarts both apps, and checks the site and API. This is an explicit billing release, separate from the usual frontend-only `.cpanel.yml` hook. No environment files, database schemas, or existing subscriptions are changed by the script.

## Validation

- Production build uses webpack and the existing single-worker cPanel settings.
- Relevant billing, email, meeting, and subscription-access tests pass.
- Email previews include separate annual Growth and Scale examples.
- Browser checks cover billing selection, the dismissible popup, and mobile/desktop layouts.
