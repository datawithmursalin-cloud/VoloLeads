# Codex Handoff: VoloLeads Website Rebrand (Phases 4–7)

**Written:** 2026-11-05, by Claude, at the end of Phase 3
**Branch:** `Rebranding` (created from `NEXTJS`, pushed to `origin`)
**Owner:** Syed (VoloLeads)
**Next step after Codex:** a final review with Claude before anything is merged or deployed.

Read this whole file before changing anything. Section 3 (owner decisions) **overrides** the original requirements in [`website-handoff-2026-11-05.md`](website-handoff-2026-11-05.md) wherever they conflict.

---

## Contents

1. Where things stand
2. How the site is built (read before editing)
3. Owner decisions that override the original handoff
4. Gotchas already hit (don't repeat them)
5. Phase 4: Clean URLs
6. Phase 5: Services hub and 9 service pages
7. Phase 6: Open Graph, structured data, form tracking
8. Phase 7: Wording sweep and QA
9. Open questions for the owner
10. Final-review checklist (for the Claude review before deploy)

---

## 1. Where things stand

Commits on `Rebranding` (newest first):

| Commit | What |
|---|---|
| `a28ef01` | **Phase 3:** shared header/footer partials, 4 mega menus (Services, Who We Serve, Resources, Pricing), mobile sheet, announcement bar, theme follows device; merged proof + software section; short plan cards in a swipe carousel; Custom+ team builder; `/plans/*` pages; `/resources` hub + 9 draft Blueprint articles; original logo/favicon restored; DIY row hover |
| `8863d17` | **Phase 2:** homepage repositioning (investors, wholesalers, agents), real counter values in HTML, founder line, 30-minute calls, "Who we work with" section |
| `e8bb3e3` | **Phase 1:** wordmark ("Volo" navy/white + "Leads" `#F97316`), brand-src image sources |

Not committed on purpose: `.claude/` (local preview config) and `frontend/modifications/` (the owner's handoff zip and logo files).

**Deploy safety:** `.github/workflows/frontend-build.yml` only builds and deploys on pushes to `NEXTJS`. Work and push freely on `Rebranding`. **Never merge into `NEXTJS` or push to it** without the owner's explicit go-ahead after the final review.

### Done vs. remaining (against the original handoff)

| Original handoff section | Status |
|---|---|
| 1. Brand (logo, palette, wordmark) | Done, but with owner overrides (section 3) |
| 2. Homepage changes | Done, except 2.6 (OG per page, JSON-LD, form options, `?src`/`?service` tracking) → **Phase 6** |
| 3. Header and mega menu | Done (expanded: Resources and Pricing dropdowns) |
| 4. Services hub and 9 service pages | **Phase 5** (menu and footer already link to them; they 404 today) |
| 5. Pricing rules | Plan cards and pages done; standalone "Custom quote" on service pages → **Phase 5** |
| 6. Proof images | Re-rendered in `#F97316`; not shown anywhere yet; use on Cold Callers page → **Phase 5** |
| 7. Tech requirements | Partly: per-page titles done for plans and Blueprint pages; rest in Phases 5–6 |
| 10. Done-when checklist | **Phase 7** |
| Owner: clean URLs (no `.html`, no `#`) | **Phase 4** |

---

## 2. How the site is built (read before editing)

The production app is **Next.js 16** (`frontend/`), but almost all pages are **legacy HTML files** rendered through one catch-all route. There are no React page components to edit.

```
frontend/
  app/[[...slug]]/page.js        catch-all route; generateStaticParams + metadata
  app/layout.js                  <html>, head metadata (OG image, favicon), early theme/announcement script
  app/legacy-assets/[...]/route.js  serves /legacy-assets/png/* and /legacy-assets/audio/* (1-year immutable cache!)
  app/legacy-runtime/[name]/route.js serves app.js and icons.js (60-second cache)
  components/LegacyPage.js       injects page body HTML (dangerouslySetInnerHTML)
  components/LegacyRuntime.js    loads icons.js then app.js, calls initializeVoloLeadsPage()
  lib/legacy-pages.js            THE LOADER (see below)
  *.html                         legacy pages (body is extracted; <head> is ignored except <title>/<meta description>)
  partials/                      shared chrome and templates
    site-header.html             header, 4 mega panels, mobile sheet ({{blueprintMenu}}, {{pricingMenu}} tokens)
    site-header-minimal.html     logo + theme toggle (schedule-onboarding only)
    site-footer.html             footer ({{year}})
    plan-page.html               template for /plans/<slug>
    blueprint-page.html          template for /resources/<slug>
    resources-hub.html           template for /resources
  content/
    plans.json                   plan facts, card points, plan page content (single source of truth)
    blueprint.json               Resources menu groups, hub, Blueprint articles
  app.js                         all client behavior (one big file, init functions)
  icons.js                       inline SVG icon set (only names listed in its `paths` object exist)
  styles.css                     hand-written CSS (~8,500 lines; new rules appended at the end)
  tailwind.css                   PRE-BUILT, committed. CI does not rebuild it (see gotchas)
  png/                           images (served via /legacy-assets/png/...)
  brand-src/                     HTML sources for generated images (OG, proof images) + README with render commands
```

### The loader (`frontend/lib/legacy-pages.js`)

- `pages` maps a route → HTML file; `readPages` holds **literal** `fs.readFileSync(path.join(process.cwd(), '<file>'))` calls. Keep reads literal: Next's file tracing (`@vercel/nft`) only bundles files it can see statically. A test enforces this.
- `insertPartials()` swaps HTML comment placeholders (`<!-- site:header -->`, `<!-- site:header:minimal -->`, `<!-- site:footer -->`) for partial files, then fills `{{blueprintMenu}}`, `{{blueprintMobile}}`, `{{pricingMenu}}`, `{{pricingMobile}}`, `{{year}}`.
- After partials, it strips `<script>` tags and rewrites `src|href|data-src="(./)png/..."` and `audio/...` to `/legacy-assets/...`. **This rewrite only applies to server-rendered HTML**, not to HTML built inside `app.js`; use `/legacy-assets/png/...` paths there.
- Data-driven routes: `plans/<slug>` → `renderPlanPage()`, `resources` → `renderResourcesHub()`, `resources/<slug>` → `renderBlueprintPage()`.
- `legacyRouteParams` is built at **import time**, before any working directory is known, so it uses fixed lists: `PLAN_SLUGS` and `BLUEPRINT_SLUGS`. **When you add a plan, Blueprint page or service, update the fixed list too.**
- The module must stay self-contained (no local imports). The tests load it as a `data:` URL.

### Run and test

```bash
cd frontend && npm ci --ignore-scripts
```

```bash
npm --prefix frontend run dev -- -p 3005
```

```bash
node --test scripts/__tests__/frontendDeployment.test.js scripts/__tests__/frontendTracing.test.js scripts/__tests__/frontendPrebuilt.test.js scripts/__tests__/frontendLogging.test.js
```

```bash
cd frontend && npm run build
```

- `npm ci` **without** `--ignore-scripts` triggers a full production build through `postinstall`.
- All 22 tests must pass. `frontendTracing.test.js` loads **every** route from `legacyRouteParams` (multi-segment routes are joined with `/`).
- Playwright is a dev dependency. Use the system Chrome with `chromium.launch({ channel: 'chrome' })`; no browser download is needed. For homepage tests, set `sessionStorage['vololeads-essential-offer-seen'] = 'true'` and the cookie `cookie_consent=declined`, or the offer dialog and cookie banner get in the way.
- `.claude/launch.json` (uncommitted) runs the dev server on port 3005.

### Checkout (do not break)

- Buttons: `.subscribe-btn[data-plan]`, handled by `initSubscriptionCheckout()` in `app.js` → `POST /api/create-checkout-session { plan }`.
- **Backend plan keys:** `essential` = Essential, **`premium` = Growth**, **`custom_plus` = Scale** (see `backend/src/config/billing.js`). The `checkout` field in `content/plans.json` holds these keys. Using `growth` or `scale` breaks checkout.
- To test without Stripe, intercept the route in Playwright (`page.route('**/api/create-checkout-session', ...)`) and assert the posted `plan`.

---

## 3. Owner decisions that override the original handoff

These came from the owner during the session. Where the original handoff says otherwise, **these win**.

| Topic | Decision |
|---|---|
| Brand orange | **`#F97316`** (hover `#EA580C`), Tailwind's orange palette. **Not** the handoff's `#BC3823` / `#EF7A63` / `#F9E0DA`. |
| Logo and favicon | The **original** 3D orange bolt, `frontend/png/logo.webp` (unchanged file). **Not** the handoff's new logo. The favicon is the same file (`app/layout.js`). |
| Wordmark | "Volo" navy (white on dark) + "Leads" `#F97316`, Inter 800, centered on the bolt (verified to within 0.2px) |
| Lead counts | **No lead counts anywhere** (no "30+ seller leads a month"). Use "Consistent seller leads every month". The owner gives numbers on calls. |
| Counter label | "10,000+ Qualified Leads Generated" (the owner chose "Qualified", against the handoff's advice) |
| $28K line | **Removed** from the site. The Trustpilot review that mentions it stays verbatim. |
| Plan recommender | **Removed** ("Find the right plan"). |
| "Compare the plans" table | **Removed.** The "DIY vs VoloLeads" table stays. |
| "Your campaign, step by step" (How it works) | **Removed** from the homepage. |
| Homepage order | Hero → proof + software section → Who we work with → Plans → … |
| Plan cards | Short cards (Option A) in a **swipe carousel** with arrows (about 3 visible on desktop, 1 on phones). Each card links to `/plans/<slug>`. |
| Custom+ | Team builder (callers, lead sourcing, add-ons) that pre-fills `custom-quote.html` via GET params. **No price calculator** until the owner provides a per-caller rate card. |
| $2,235 | "2 callers, client sources leads: $2,235/month". **Removed from the Scale card** at the owner's request; still on `/plans/scale` (from `ownLeads` in `plans.json`). See open questions. |
| Manage subscription | **Footer only** (not in the header or the mobile sheet). |
| Theme | Follows the device `prefers-color-scheme` until the visitor uses the toggle (saved as `localStorage['dark-mode']`). |
| Clean URLs | **No `.html` and no `#` in the address bar** (Phase 4). |
| Pricing and Call Recordings | Stay as homepage sections; the menu reaches them without a `#` in the URL (Phase 4). |
| Team Training | Coaching based on the team's **live call recordings**; $200 per team (up to 5 VAs), 3 one-hour sessions over 3 days; **includes one month of the acquisitions training app**: https://vololeads-acquisitions-training.onrender.com/ (separate repo, don't touch). |
| Resources | Menu = "The Acquisition Blueprint" with 4 columns (Wholesalers, Investors, Agents, How we work) + a row: Call Recordings, Compliance, Terms of Service, FAQs. Text only, no image cards. |
| Mega menu images | No proof-image cards in any menu. |

---

## 4. Gotchas already hit (don't repeat them)

1. **Year-long image cache.** `/legacy-assets/*` is served `Cache-Control: public, max-age=31536000, immutable`. **Never overwrite an image in place with different content**: returning visitors keep the old one for a year. Give changed images a new filename.
2. **`tailwind.css` is pre-built and committed.** CI doesn't rebuild it. A Tailwind class that isn't already in `tailwind.css` does nothing. Either write the style in `styles.css` (preferred, which is what Phase 3 did), or rebuild with `npx -y tailwindcss@3.4.17 -c tailwind.config.js -i tailwind.input.css -o tailwind.css --minify` from `frontend/` and commit it.
3. **Old global CSS fights new sections.** Known offenders:
   - `section { box-shadow: ... }` and `section:not(#home) { padding: ... !important }`: the `:not(#home)` counts as an ID, so overrides need `X section:not(#home)`. See `.plan-page section` / `.blueprint-page section` at the end of `styles.css`.
   - `#plans h3 { font-size: .85rem !important }` on mobile.
   - `html.dark .comparison-table tbody th, td strong { color: ... !important }`.
   - `#home p { font-size: ... !important }`.
   Inspect computed styles in the browser before assuming your rule applies.
4. **Animations pin properties.** `.site-loaded nav` used to leave a transform on `<nav>` (moved to `.site-header`). The table reveal animation `table-row-flash` (fill `both`) pins cell `box-shadow` and row `transform`; the DIY hover uses `translate` and a background stripe instead.
5. **Icons.** Only names defined in `icons.js` (`paths`) render; anything else renders as a dot. Check the list before using a Font Awesome class.
6. **`#mobile-menu-btn` and friends live in the header partial.** Don't add duplicate IDs in pages. The old in-page navs were removed.
7. **Editing partials with string slicing.** Phase 3 once cut a mega panel at the wrong `</li>` and broke the mobile header. After editing `partials/site-header.html`, check the mobile header height (about 61px at 375px) and that the menu opens.
8. **`app.js` caching.** `/legacy-runtime/app.js` has a 60-second cache, so the browser can run the old file right after an edit. Hard-reload.
9. **The essential-offer dialog** pops up on the homepage after a delay and intercepts clicks in automated tests (see section 2).
10. **Hydration warning in dev.** React warns that the legacy-root HTML differs (app.js mutates the DOM). This predates Phase 3, is dev-only, and React does not patch anything. Not a bug to chase.

---

## 5. Phase 4: Clean URLs

**Goal:** no `.html` and no `#` in the address bar, anywhere. Old URLs keep working through **301 redirects**.

### 5.1 Route map

Add clean routes in `lib/legacy-pages.js` (keep the `.html` keys temporarily or replace them with redirects):

| Old | New |
|---|---|
| `/index.html` | `/` |
| `/faqs.html` | `/faqs` |
| `/compliance.html` | `/compliance` |
| `/terms-condition.html` | `/terms` (owner may prefer `/terms-of-service`; ask) |
| `/privacy-policy.html` | `/privacy-policy` |
| `/refund-policy.html` | `/refund-policy` |
| `/disclaimer.html` | `/disclaimer` |
| `/custom-quote.html` | `/custom-quote` |
| `/manage-subscription.html` | `/manage-subscription` |
| `/schedule-onboarding.html` | `/schedule-onboarding` |
| `/success.html` | `/success` |
| `/cancel.html` | `/cancel` |
| `/thank-you.html` | `/thank-you` |
| `/404.html` | (not-found page; no public route needed) |
| `/insights-intelligence.html` | `/resources/targeting-by-intelligence` |
| `/insights-deal.html` | `/resources/deal-structures` |
| `/insights-kpi.html` | `/resources/performance-analytics` |
| `/insights-market.html` | `/resources/market-seasonality` |
| `/maintenance.html` | leave as is (served standalone by cPanel during maintenance; check `scripts/deploy-frontend-cpanel.*`) |

Then update `content/blueprint.json` items that use `href: "/insights-*.html"`, and the `/resources/<slug>` collision logic (the 4 insight pages are HTML files, not Blueprint JSON pages; route them in `pages`/`readPages` or add a mapping).

### 5.2 Redirects

- Add `async redirects()` in `frontend/next.config.js` with `permanent: true` for every old `.html` path → new path.
- **Deploy health check:** `scripts/deploy-frontend-cpanel.js` (around lines 76 and 110) probes `/`, `/compliance.html` and `/terms-condition.html` and expects Next.js markup. Update those probes to the clean URLs **and** make sure the probe follows or accepts redirects. Check `probeCandidate` and its test in `scripts/__tests__/frontendDeployment.test.js`.
- Also check `frontend/server.js` (legacy Express server, `start:legacy`) and any `.htaccess` the deploy writes. Clean URLs must work on cPanel's Node app, not only in `next dev`.

### 5.3 Update every internal link

- `partials/*.html`, `content/*.json`, every `*.html` page, `app.js` (e.g. `/custom-quote.html` at around line 268, `/thank-you.html` at around line 2182), and `brand-src` if relevant.
- **Backend links (must change together with redirects):**
  - `backend/src/controllers/billingController.js`: Stripe `success_url` / `cancel_url` and return URLs (`success.html`, `cancel.html`, `manage-subscription.html` at around lines 231, 253, 361, 408, 456, 497–527, 704).
  - `backend/src/emails/subscriptionConfirmationEmail.js`: `schedule-onboarding.html`, `success.html`, `manage-subscription.html` (around lines 188–236).
  - Run the backend tests after changing them (`backend/src/__tests__/`).
- Grep afterwards: `grep -rnE '\.html' frontend/*.html frontend/partials frontend/content frontend/app.js backend/src | grep -v __tests__` should show only intentional ones (e.g. maintenance).

### 5.4 Remove `#` from the address bar

There are about 25 hash links today: `/#plans` (6), `/#contact` (7), `/#insights` (4), `/#testimonials`, `/#about`, `#who-wholesalers|investors|agents`, `#main-content` (skip link, keep it), `#plan-builder`.

Recommended approach:
- Add clean paths that render the **homepage** and scroll to the section: `/pricing` → `#plans`, `/call-recordings` → `#insights`, `/contact` → `#contact`, `/testimonials` → `#testimonials`, `/about` → `#about`. Implement as routes in the loader that return the homepage plus a `data-scroll-target` on the body/root, and have `app.js` scroll there on load. Set the canonical to `/`, or give each its own title.
- On the homepage itself, intercept same-page anchor clicks in `app.js`: `preventDefault`, smooth-scroll (respect `prefers-reduced-motion`), move focus to the section for accessibility, and `history.replaceState` to the clean path, or leave the URL alone. No `#` should ever appear.
- Keep the in-page `id`s; only the URLs change.
- The `.mobile-sticky-cta` and `.prefooter-cta` links point at `#contact`; update them.

### 5.5 Done when

- No address-bar `#` or `.html` when clicking any link in the header, footer, mobile sheet, cards or CTAs.
- Every old URL 301s to its new URL (check with `curl -sI`).
- Stripe success/cancel and the confirmation email links land on the right pages.
- Deploy probe test passes; all frontend tests and backend tests pass; `npm run build` passes.
- Add a test to `frontendTracing.test.js` (or a new test) that every old path in the redirect list maps to a real route.

---

## 6. Phase 5: Services hub and 9 service pages

The original spec is in `website-handoff-2026-11-05.md` §4 (page template order, per-service content) and §5 (pricing rules). The menu, footer and homepage cards already link to these routes:

`/services`, `/services/cold-callers`, `/services/lead-generation`, `/services/crm-setup`, `/services/comps-deal-analysis`, `/services/agent-appointment-setting`, `/services/consulting`, `/services/ai-workflows`, `/services/virtual-assistants`, `/services/team-training`

### 6.1 Build it like the plan pages

- `content/services.json` (one entry per service) + `partials/service-page.html` + `partials/services-hub.html`, rendered by new `renderServicePage(slug)` / `renderServicesHub()` in the loader, with a fixed `SERVICE_SLUGS` list in `legacyRouteParams`. Copy the patterns of `renderPlanPage` / `renderBlueprintPage` (escape every string with `escapeHtml`).
- Reuse the plan-page CSS classes where possible (`.plan-page-*`, `.resources-more`, `.plan-page-other`), and add the same `section:not(#home)` override for the new page class.
- Page order (handoff §4.2): hero (name, promise, audience tags, outlined "Book a Call" + filled "Get Started" / "Get a Quote") → What's included (two-column title + one-liner) → How it works (3–4 steps) → Tools we use (only where relevant) → How you get it (plans that include it **and** "Available on its own: custom quote") → Proof (only where noted) → closing CTA "Book a strategy call" → `/?service=<slug>` (after Phase 4, the clean contact path).
- Per-page title pattern: `{Service} for Real Estate Investors | VoloLeads`.

### 6.2 Content notes and overrides

- **No lead counts** (owner override). Drop "30+ seller leads a month" from the Cold Callers content.
- **Cold Callers:** show both proof images from `frontend/png/proof/` (`one-caller-one-month.webp`, `four-month-consistency.webp`; PNG masters alongside) with the exact alt text from handoff §6. Figures must never change. Pseudonyms Dave and Charlie only.
- **Standalone pricing (§5):** every service except Team Training shows "Custom quote" → `/custom-quote` + "Setup fee and minimum term are confirmed in your quote." Don't publish amounts.
- **Team Training:** $200 per team, up to 5 VAs, 3 one-hour sessions over 3 days, for teams that already have VAs; delivered as **coaching based on the team's live call recordings**; **includes one month of access to the acquisitions training app** (https://vololeads-acquisitions-training.onrender.com/). CTA: "Book a strategy call". No checkout link exists yet.
- **AI Workflows:** say "AI connectors", never "MCP"; outbound seller calls are always human. Don't claim integrations that aren't connected. A Resources article already exists at `/resources/ai-workflows` (draft); link between them.
- **Comps:** "repair estimates based on square footage", never "inspection" or "contractor bid". Turnaround: "Comps are delivered as soon as a lead is qualified and submitted."
- **Agent appointment setting:** no results, numbers or testimonials (new service).
- **Lead Generation:** Essential = one-time 10,000-lead signup bonus; Growth ≈ 25,000 records/month (15K XLeads + 10K DealMachine); Scale ≈ 50,000 records/month.
- **Plan facts** must match `content/plans.json`. Read from it rather than duplicating prices.

### 6.3 Done when

All 10 routes return 200 and appear in `legacyRouteParams`; the menu, footer and homepage links resolve; light/dark/375px checked; tests and build pass.

---

## 7. Phase 6: Open Graph, structured data, form tracking

Original spec: handoff §2.6 and §7.

### 7.1 Per-page metadata

- `app/[[...slug]]/page.js` `generateMetadata` currently returns only `title` and `description`. Extend `getLegacyPage()` to return `canonical`, an optional `ogImage` and `robots`, and pass `openGraph` / `alternates.canonical` through.
- Site-wide OG image already exists: `/legacy-assets/png/logo/og-image.png` (1200×630, original bolt; source `brand-src/og-image.html`). Note the cache rule: if you re-render it with different content, give it a new filename.
- Service and plan pages: their own `og:title` / `og:description`.
- Consider `robots: noindex` for Blueprint pages while `status: "draft"` (see section 9), and for `success`, `cancel`, `thank-you`, `manage-subscription`, `schedule-onboarding`. Several legacy pages already carry `noindex` in their (ignored) `<head>`; carry that over intentionally.

### 7.2 JSON-LD

- `Organization`: name VoloLeads, url `https://www.vololeads.com`, logo (absolute URL to `png/logo.webp` via `/legacy-assets/`), `sameAs` = the Trustpilot profile URL (ask the owner for the exact URL) plus the socials in the footer.
- Inject it in `app/layout.js` as `<script type="application/ld+json">`. Remember the loader strips `<script>` from page bodies.

### 7.3 Strategy-call form

- The form is `#contact-form` in `frontend/index.html`; the referral select is `#referral-source` (`name="referral_source"`, currently: Discord, Facebook, Skool, Instagram, TikTok, College of Wholesale, LinkedIn, Other).
- **Add options:** "Cold email" and "Phone call".
- **Check the referral username rule** (latest NEXTJS commit `b00e20e` requires referral usernames for TikTok and College of Wholesale; see `initContactForm` / the referral-other row) so the new options don't trigger it.
- **Tracking:** read `?src=` and `?service=` (and any `utm_*` if wanted) on load, store them in hidden inputs inside the form, and make sure the backend accepts them (find the contact endpoint in `backend/src`, then whitelist and store the fields, and add a test). Note: plan pages and Blueprint CTAs already link to `/?service=<Name>#contact`. After Phase 4 they'll use the clean contact path, so keep the query string.
- Don't put personal data in URLs.

### 7.4 Done when

View-source shows correct OG tags and JSON-LD per page; validators show no errors (Rich Results Test, the Facebook sharing debugger, from a deployed preview if possible); a test form submission includes `src` and `service`; backend tests pass.

---

## 8. Phase 7: Wording sweep and QA

### 8.1 Wording sweep

- Broaden "wholesalers only" wording about **who we serve** on every page, the FAQ and legal-adjacent copy. Keep wording about wholesaling **skills** (call examples, the existing Wholesaler articles).
- Known leftovers: `insights-*` page intros, the FAQ page, the `custom-quote` intro, success/thank-you copy, the `cover.html` profile, the `meta description` of inner pages. Grep for "wholesaler", "Wholesale", "VA" claims and "15 minutes" (should be 30), and run `grep -rn "30+"`, which should stay empty.
- Always write "VoloLeads" (capital V and L).

### 8.2 QA matrix

For each page type (home, a plan page, `/resources`, a Blueprint article, a service page, FAQ, custom-quote, manage-subscription, success): desktop 1440, tablet 1024, phone 375; light and dark; keyboard-only navigation of the mega menus (Enter opens, Tab enters, Escape closes and returns focus) and the mobile sheet; `prefers-reduced-motion`; no horizontal scroll; no console errors; no 404s in the network panel.

- Counters: `curl -s http://localhost:3005/ | grep counter-animate` shows real values (10,000 / 50 / 10,000 / 100).
- Checkout: intercepted test, posting `essential` / `premium` / `custom_plus`.
- Team builder → custom-quote pre-fill (seat count + message).
- A light/dark consistency sweep: no dark slabs in light mode or bright slabs in dark mode. Phase 3 used a Playwright script that checks background luminance per element; recreate it if useful.

### 8.3 Report back (for the final review)

Clean-URL redirect list with `curl -sI` results; screenshots (home hero + proof section, one open mega menu, services hub, one service page, one plan page, mobile sheet) in both themes; test and build output.

---

## 9. Open questions for the owner

1. **Draft Blueprint pages (9):** `content/blueprint.json` pages with `"status": "draft"` show a "Draft for review" note. The owner must review the copy: fix-and-flip, buy-and-hold, seller-finance, seller-listing-opportunities, buyer-opportunities, listing-marketing-support, how-we-operate, tcpa-compliance, ai-workflows. Approve by removing `"status": "draft"`. Until then, consider `noindex` (Phase 6).
2. **Video editing:** "Listing Marketing Support" says listing video editing is "by request", but it isn't in the current service list. Confirm, or remove it.
3. **$2,235 (2 callers, client-sourced):** flat price or a promo price? Is there a Stripe checkout for it? Should it stay on `/plans/scale`?
4. **Custom+ team builder ranges** (3 / 4–5 / 6–9 / 10+ callers; add-ons CRM setup, Comps, AI workflows, Multiple markets): OK?
5. **Terms URL:** `/terms` or `/terms-of-service`?
6. **Trustpilot URL** for `sameAs`, and whether the 4.9★ "Average Client Rating" tile is current.

---

## 10. Final-review checklist (for the Claude review before deploy)

- [ ] Every section 3 decision holds (orange `#F97316`, original logo/favicon, no lead counts, removed sections stay removed, Manage subscription footer-only)
- [ ] Clean URLs: no `.html` or `#` in the address bar; old URLs 301; Stripe and email links updated; deploy probe updated
- [ ] `/services` + 9 service pages live from one template and data file; Team Training at $200 with the trainer app; Cold Callers proof images with correct alt text and unchanged figures
- [ ] Prices and setup fees match `content/plans.json` and Stripe everywhere; checkout keys correct
- [ ] OG tags + JSON-LD + form options + `src`/`service` tracking working end to end
- [ ] Draft Blueprint pages approved or noindexed
- [ ] Nothing from handoff §8 "Do not change" was changed (plan names, prices, promo terms, Stripe links, review text, call recordings, "No long-term contracts", Essential disclaimer)
- [ ] Light/dark/375px/keyboard/reduced-motion QA done; no console errors; no 404s
- [ ] All frontend and backend tests pass; `npm run build` passes
- [ ] Only then: open a PR from `Rebranding` → `NEXTJS` for the owner to approve. **Do not merge or deploy without the owner.**
