# Website plan and pricing changes

Date: October 21, 2026
Status: Change brief prepared; website implementation pending.

## Confirmed changes

| Item | Current repository content | Planned change |
| --- | --- | --- |
| Essential monthly price | $680/month | **$730/month**, a $50 increase |
| Lead data | Customer supplies lead lists and data | Include a **one-time signup bonus of 10,000 leads sourced using BatchLeads** at no additional charge within Essential |
| Dialer | Customer supplies and pays for the dialer | **WAVV Triple Line Dialer included in Essential** |
| Growth monthly pricing | $1,535/month | Show **$1,699/month original price** and **$1,535/month discounted price**; savings of $164/month |
| Scale monthly pricing | $2,999/month | Show **$2,999/month original price** and **$2,685/month discounted price**; savings of $314/month |

The 10,000 leads are a one-time signup bonus, not a monthly allowance. BatchLeads is the lead source; customer access to a BatchLeads account has not been specified. The included dialer is WAVV Triple Line Dialer. The owner confirms there are no calling limits and requests that calling-limit copy be omitted from the website.

## Proposed customer-facing copy

> **Essential — $730/month**  
> Dedicated cold calling support with WAVV Triple Line Dialer included, plus a one-time signup bonus of 10,000 leads sourced using BatchLeads.

Retain the existing dedicated caller, 80 hours/month, manager, setup and training, CRM integration, ongoing management, and daily reporting benefits. Clearly label the leads as a one-time signup bonus wherever the offer appears. Describe the leads as sourced records, without implying 10,000 qualified opportunities or guaranteed results. Omit calling-limit language.

### Growth and Scale discount display

| Plan | Original price (struck through) | Discounted price (prominent) | Savings |
| --- | --- | --- | --- |
| Growth | ~~$1,699/month~~ | **$1,535/month** | $164/month |
| Scale | ~~$2,999/month~~ | **$2,685/month** | $314/month |

Label the original and discounted prices clearly. Keep monthly billing units visible for both prices. No discount expiration date or additional eligibility requirement has been specified.

## Website updates

- **Essential pricing card, front and back:** Update the price, add the one-time 10,000-lead BatchLeads signup bonus and included WAVV Triple Line Dialer, and replace language such as “in your dialer,” “existing tech stack,” and “You manage: dialer, software, leads, and data.” State any remaining customer responsibilities accurately.
- **Growth and Scale pricing cards:** Show each original price struck through beside or above the prominent discounted monthly price. Use Growth $1,699 → $1,535 and Scale $2,999 → $2,685 consistently on both sides wherever prices appear.
- **Plan comparison table:** Update Essential’s price, included features, best-fit description, and customer responsibilities. Show Growth and Scale original and discounted prices consistently with their cards.
- **Plan advisor:** Update both its initial display and JavaScript-generated recommendations. Revisit the logic that recommends Essential based on customers already owning a dialer and data, while keeping meaningful distinctions between Essential and Growth.
- **FAQs and pricing notes:** Explain that Essential includes WAVV Triple Line Dialer and a one-time 10,000-lead BatchLeads signup bonus. Reconcile statements that reserve the dialer for Growth and Scale or imply all Essential lead data costs are separate. Do not imply ongoing free lead replenishment. Review the FAQ claim that every supplied property is visually verified; do not automatically apply that claim to BatchLeads records.
- **Higher-tier comparisons:** Review “Everything in Essential” claims for consistency with the new benefits; confirm how the signup bonus carries through to those plans before adding new promises.

## Checkout and confirmation updates

- Align the Essential recurring checkout price with **$730/month**. The backend uses `STRIPE_PRICE_ESSENTIAL_MONTHLY_RECURRING` to select the Stripe price; editing website text alone will not change the charged amount. Verify the configured price and any legacy fallback during implementation.
- Align Growth checkout and confirmation pricing with **$1,535/month**, with **$1,699/month** as the original price. Verify the configured `STRIPE_PRICE_PREMIUM_MONTHLY` price.
- Align Scale checkout and confirmation pricing with **$2,685/month**, with **$2,999/month** as the original price. Verify the configured `STRIPE_PRICE_CUSTOM_PLUS_MONTHLY` price.
- Reconcile existing Growth and Scale partner-promotion settings with these public discounts. Current backend promotional displays are $1,135/month for Growth and $2,699/month for Scale; these are separate existing values and must not be substituted for the newly requested discounted prices. Confirm whether partner discounts can stack before applying additional discounts.
- Update backend price labels and confirmation-email content to match the new price and inclusions. Prefer the monthly package price over the current `$8.50/hour` label, which no longer describes the full package accurately.
- Review the existing `COW2026E` promotion. The repository currently specifies a $50 discount and a $630/month promotional display. If the $50 discount is retained, the new promotional display should be **$680/month**; confirm the intended promotion treatment and checkout behavior.
- Confirm the setup fee before changing it. Current copy describes a one-week setup fee; the requested $50 monthly increase does not establish a new setup-fee amount.
- Update relevant email previews, preview scripts, and existing pricing/email assertions after implementation.

## Files identified for implementation

| File | Relevant area |
| --- | --- |
| `frontend/index.html` | Essential card, advisor default, comparisons, FAQs, and pricing notes |
| `frontend/app.js` | Plan advisor content and recommendation logic |
| `frontend/faqs.html` | Lead sourcing and verification descriptions |
| `backend/src/config/billing.js` | All plan pricing labels, promotion displays, Stripe price configuration |
| `backend/src/emails/subscriptionConfirmationEmail.js` | Plan confirmation prices and Essential benefits |
| `backend/scripts/sendPlanPreviewEmails.js` | Manually defined plan email preview content |
| `backend/scripts/previewSubscriptionEmails.js` and `backend/email-previews/` | Regenerated confirmation previews |
| `backend/src/__tests__/subscriptionConfirmationEmail.test.js` | Existing price and email expectations |

## Clarifications before publication

1. When is the one-time signup bonus delivered, and does it include phone/contact data or skip tracing?
2. Does the new price apply only to new customers, or also to existing subscribers? What is the effective date?
3. Should the existing $50 partner discount and setup fee stay as they are?
4. Can existing Growth and Scale partner discounts stack with the newly specified public discounts?

## Completion checks for implementation

- Essential consistently displays $730/month across the website, checkout, and confirmation emails, with any agreed discount clearly reflected.
- Growth shows an original price of $1,699/month and a discounted price of $1,535/month; Scale shows an original price of $2,999/month and a discounted price of $2,685/month. Original prices are struck through and discounted prices are prominent.
- Checkout and confirmation emails match the discounted Growth and Scale amounts, with any separately agreed partner promotion handled consistently.
- Both sides of the card, the comparison table, FAQs, and advisor agree that WAVV Triple Line Dialer and a one-time 10,000-lead BatchLeads signup bonus are included.
- Old Essential claims requiring customers to supply the included dialer and signup leads are removed or corrected.
- The lead bonus is consistently described as one-time, delivery details match the confirmed offer, and calling-limit copy is omitted.
- Updated card content fits on desktop and mobile, including the reverse side, and the advisor remains usable.
- Existing relevant billing/email tests pass and a test-mode checkout confirms the agreed recurring price, promotion, and setup fee.

This document records the proposed work. No website, billing configuration, or customer subscription changes have been made as part of preparing it.
