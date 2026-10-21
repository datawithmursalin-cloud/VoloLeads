# Pricing update, October 22, 2026

The user clarified that the lower Growth and Scale prices require annual billing.

| Plan | Monthly billing | Annual billing, paid upfront | Savings against monthly billing |
| --- | --- | --- | --- |
| Essential | $730/month | Not offered | Not applicable |
| Growth | $1,699/month | $18,420/year, equivalent to $1,535/month | $1,968/year |
| Scale | $2,999/month | $32,220/year, equivalent to $2,685/month | $3,768/year |

Essential includes WAVV Triple Line Dialer and a one-time signup bonus of 10,000 leads sourced using BatchLeads. Its card shows the short bold line requested by the user, "10,000 leads signup bonus." No delivery date, skip tracing, recurring free replenishment, or BatchLeads account access has been promised. The bonus has not been added to other plans.

The centered popup appears after 12 seconds, once per tab session. It can be closed with its close button, Not now, Escape, or the backdrop. It skips visitors using a form, viewing another dialog, checking out, or visiting the contact section. View Essential takes the visitor to the Essential card.

## Billing configuration before release

The local code and preview are updated. No cPanel deployment, Stripe price creation, subscription migration, or email sending was performed.

The backend must have these active USD prices configured:

- `STRIPE_PRICE_ESSENTIAL_MONTHLY_RECURRING`: 73000 cents, monthly.
- `STRIPE_PRICE_PREMIUM_MONTHLY`: 169900 cents, monthly.
- `STRIPE_PRICE_CUSTOM_PLUS_MONTHLY`: 299900 cents, monthly.
- `STRIPE_PRICE_PREMIUM_ANNUAL`: 1842000 cents, yearly.
- `STRIPE_PRICE_CUSTOM_PLUS_ANNUAL`: 3222000 cents, yearly.

The existing Essential setup price is preserved. Its amount was not changed or verified against a live account. Legacy Essential price-ID fallback remains supported but must pass the same monthly amount and interval checks.

The checkout endpoint verifies the selected amount, currency, and interval before creating a session. An annual checkout never falls back to a monthly price. Promotion-code entry remains disabled for new checkouts, preserving the newer remote policy. Existing customer subscriptions are not changed.

The historical database plan-code names are retained for compatibility. The separate `billingCycle` field is recorded in Stripe metadata and existing subscription metadata. Confirmation and onboarding emails use the actual Stripe interval when available.

Run `node scripts/verifyCheckoutPrices.js` from the backend with the server's environment to verify all five prices. Live verification and a Stripe test-mode checkout could not be completed because Stripe credentials are not available locally. Do not deploy only the frontend and assume the billing amounts have changed. Follow `cpanelskill.md` for frontend deployment and keep the backend application separate.

## Validation

- Production build uses webpack and the existing single-worker cPanel settings.
- Relevant billing, email, meeting, and subscription-access tests pass.
- Email previews include separate annual Growth and Scale examples.
- Browser checks cover billing selection, the dismissible popup, and mobile/desktop layouts.
