# Phase 6 implementation and validation

Completed and committed locally on `Rebranding`, November 5, 2026. Phase 4 and Phase 5 were committed together as `737b952` because the service pages depend on the clean URL work. No deployment was performed.

- Each page now supplies its own Open Graph and Twitter title/description, canonical URL and robots directives. The shared 1200×630 OG image is preserved. Homepage section aliases retain the homepage canonical and exclude query parameters.
- All nine draft Blueprint articles are `noindex, follow` until approved in `content/blueprint.json`. Existing legacy robots directives are preserved, including the FAQ, legal, checkout, subscription and onboarding pages. Review the older FAQ/legal noindex choices before launch if those pages should be searchable.
- The root layout renders one Organization JSON-LD record. Trustpilot uses the profile already linked from the homepage; social URLs match the footer. There are no rating or review claims in the structured data.
- The strategy-call form adds Cold email and Phone call. TikTok and College of Wholesale still require usernames.
- Attribution captures only `src`, `service`, and five standard UTM fields. It persists for the current tab across navigation; new campaign parameters clear stale campaign tags. Hidden `tracking_service` holds the referring service independently of the visitor's selected `service`. Storage failures still allow current-page capture. The same shared handler supports the custom-quote form.
- The backend accepts only these attribution fields as strings, strips control characters and limits each value to 200 characters. It stores them in `contact_forms.attribution` and includes them in admin notifications and admin API reads. The existing record source remains `website`.
- Schema initialization adds the JSONB column with `ADD COLUMN IF NOT EXISTS` and an empty-object default. No live database was connected or changed. Deploy the backend/schema change with the frontend tracking changes.

Validation: 26 frontend tests, 84 backend tests, production build (49 static pages), and local production-browser checks. Browser checks read server-rendered metadata and JSON-LD on every traced route, verify the OG image loads, follow a campaign landing page to the form, check referral username rules, intercept a form submission and inspect its payload, and exercise campaign reset and blocked storage. No live submissions, emails, Stripe requests or production writes were made.

External Rich Results and Facebook sharing validation remain for an approved deployed preview; these services cannot fetch localhost. Next.js implementation references: [metadata API](https://nextjs.org/docs/app/api-reference/functions/generate-metadata) and [JSON-LD guidance](https://nextjs.org/docs/app/guides/json-ld).

Phase 7 results are in `CODEX_PHASE7_REVIEW.md`. Claude's final review and the owner's release decision remain before merging into `NEXTJS` or deploying.
