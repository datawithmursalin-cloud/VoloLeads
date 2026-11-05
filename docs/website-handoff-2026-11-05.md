# VoloLeads Website Handoff – November 5, 2026

**For:** the agent that builds the vololeads.com front end
**From:** Syed (VoloLeads owner)
**Priority:** complete before cold outreach starts. Outreach will send experienced real estate investors, wholesalers and agents to this site.
**This file replaces** the earlier separate handoffs (`website_update_nov_4.md`, `website_services_pages_nov_5.md`). Everything needed is in this folder.

**Assets in [`assets/`](assets/README.md):**

| File | Use |
|---|---|
| `Logo_Design_Orange.svg` / `.png` | The new company logo. The **only** logo version to use. |
| `one-caller-one-month.png` | Proof image: one caller, one month (Services menu card, Cold Callers page) |
| `four-month-consistency.png` | Proof image: four-month consistency chart (Who We Serve menu card, Cold Callers page) |
| `*.html` + `logo-orange.png` | Editable sources for the two proof images |

---

## Contents

1. Brand: logo, palette, wordmark
2. Homepage changes
3. Header and mega menu
4. Services hub and 9 service pages
5. Pricing rules
6. Proof images and data rules
7. Tech requirements
8. Do not change
9. Open owner decisions
10. Done-when checklist

---

## 1. Brand: logo, palette, wordmark

### 1.1 Logo
- Use **only** `assets/Logo_Design_Orange.svg` (PNG fallback alongside), on every background, light and dark.
- Replace the logo in the header, footer, favicon/app icons and the Open Graph image.
- Don't recolor, stretch, crop or add effects. The file is 1348×1345 with a transparent background and built-in padding of about 8% per side; trim visually with layout, not by editing the file.
- The SVG embeds a raster image (it isn't true vector paths). It's fine at header and footer sizes. For the favicon, export a 512×512 PNG from it and generate the icon sizes from that. Swap in a true vector file when the designer supplies one.

### 1.2 Palette (owner decision: brand orange = logo color)

| Token | Value | Use |
|---|---|---|
| `brand-orange` | **`#BC3823`** (was `#F97316`) | Buttons, fills, chart bars, large or bold headings, links on light backgrounds. White text on it: 5.6:1 contrast. |
| `brand-orange-tint` | **`#EF7A63`** (new) | **Small** orange text on navy/dark backgrounds (eyebrows, links, labels). `#BC3823` on navy is only 3.2:1, which is too low for small text. |
| `brand-orange-soft` | **`#F9E0DA`** (new) | Light orange backgrounds (badges, chips), with `#BC3823` text |
| `brand-navy` | `#0F172A` (unchanged) | Primary dark, text on light |
| `brand-light` | `#F8FAFC` (unchanged) | Light surfaces |

Replace every hard-coded Tailwind `orange-*` shade (for example `orange-50`, `orange-100`, `orange-700`) with these tokens so no bright orange is left. Font stays **Inter**.

### 1.3 Wordmark
- Mark plus the text **VoloLeads**, set **tight**: the mark nearly touching the text (about 2–4px at header size).
- **"Volo"** in navy `#0F172A` (white on dark backgrounds); **"Leads"** in `#BC3823`.
- Inter, extra-bold (800), letter-spacing about −0.01em.
- Always write the name **VoloLeads** (capital V and L, one word).

---

## 2. Homepage changes

### 2.1 Positioning: seller acquisitions for everyone
The site no longer targets wholesalers specifically. It serves anyone doing **seller acquisitions**: investors, wholesalers and agents equally, with no audience getting top billing.

| Element | Current | New |
|---|---|---|
| Hero eyebrow | COLD CALLING FOR REAL ESTATE WHOLESALERS | SELLER ACQUISITIONS FOR REAL ESTATE |
| Hero H1 | Fully Managed Acquisition Teams for US Real Estate Wholesalers. | Fully Managed Seller Acquisition Teams. |
| Hero subheading | Get trained cold callers with daily call reviews, KPI reports, and a dedicated manager. We handle the calling. You focus on closing. | For investors, wholesalers and agents. Trained callers find and qualify motivated sellers, with daily QA, KPI reports and a dedicated manager. 30+ seller leads a month, without babysitting a team. |
| Hero audience tags (new, under the subheading) | — | Investors · Wholesalers · Agents (equal weight; each links to its "Who we work with" card) |
| `<title>` | Real Estate Cold Callers & VAs for Wholesalers \| VoloLeads | Seller Acquisition Teams for Investors, Wholesalers & Agents \| VoloLeads |
| `<meta name="description">` | VoloLeads provides expert cold callers for real estate wholesalers. Our VAs specialize in objection handling and lead generation to fill your pipeline. Book a call today. | Managed seller-acquisition teams for real estate investors, wholesalers and agents. Trained callers, daily QA, KPI reports and 30+ seller leads a month. Book a free strategy call. |
| Hero badge | Wholesale-trained callers | Acquisitions-trained callers |
| Reviews heading | TRUSTED BY WHOLESALERS | TRUSTED BY REAL ESTATE INVESTORS |
| Team stat label | WHOLESALE FOCUSED | REAL ESTATE FOCUSED |

Also broaden any "wholesalers only" wording about *who we serve* on other pages, the FAQ and the footer. Leave wording about wholesaling *skills* (call examples, blog topics) as it is.

### 2.2 Lead promise (use exactly)
**"30+ seller leads a month"** (per caller). Don't add hot/warm counts or SMS figures, and don't put the word "qualified" next to the number. Where space allows, add: "Results vary by market and list type; this is a typical figure, not a guarantee."

### 2.3 Fix the stat counters that show 0
The raw HTML currently ships `0` for every counter, with the real value only in `data-target`. Search engines, link previews and anyone who doesn't scroll see "0+".

| Counter | Value | Label (new where changed) |
|---|---|---|
| Seller leads generated | 10,000+ | unchanged |
| Clients | 50+ | **"Clients Across the United States"** (was "Active Clients Nationwide") |
| Hot & warm leads generated | 10,000+ | unchanged |
| Real estate focused | 100% | "Real Estate Focused" (was "Wholesale Focused") |

**Fix:** render the final values in the HTML. Animate the count-up only when JavaScript runs and `prefers-reduced-motion` is off. A no-JavaScript fetch (`curl -s https://www.vololeads.com`) must show the real numbers.

### 2.4 Founder line
Near the team section: **"Our founder brings 4+ years of cold calling real estate sellers."**

### 2.4a Proof line and call length (owner, 2026-11-05)
- **$28K result:** VoloLeads-written copy may say **"One client closed a $28,000 deal within their first month."** Don't name the client in our own copy; the Trustpilot review stays verbatim.
- **Strategy calls are 30 minutes.** Change every "15 minutes" on the site to **30 minutes** (for example the Discovery step's "Expected timing: 15 minutes" and "15 minutes to identify the right fit for your business").

### 2.5 New "Who we work with" section
After the hero or after "How it works", three cards in the existing card style, each linking to its service page:

1. **Wholesalers**: Fill your pipeline with motivated sellers. We dial, qualify and hand you the seller's motivation, timeline, condition and price. → `/services/cold-callers`
2. **Investors and flippers**: Off-market deals without running a call floor yourself. Trained callers, daily QA and a manager who reports to you. → `/services/lead-generation`
3. **Agents**: Seller conversations that turn into listings. Callers work your expired, FSBO and pre-foreclosure lists and book appointments. → `/services/agent-appointment-setting`

No agent-specific results or testimonials until there's an agent client to cite.

### 2.6 Conversion extras
- **Open Graph:** add `og:title`, `og:description` and `og:image` (logo on navy plus the new headline, 1200×630) site-wide, and per page on the service pages.
- **Structured data:** JSON-LD `Organization` (name VoloLeads, URL, logo, `sameAs` Trustpilot).
- **Strategy-call form:** add **"Cold email"** and **"Phone call"** to "How did you hear about us?".
- **Tracking:** pass a `?src=` parameter (for example `?src=email`) and any `?service=` value into hidden fields of the strategy-call form.

---

## 3. Header and mega menu

Layout inspired by instantly.ai's header and dropdowns, in **VoloLeads colors, fonts and words only**: no Instantly text, logo, icons, illustrations or blue.

### 3.1 Announcement bar
- Full width above the header, dismissible (remembered per visitor in localStorage, wrapped in try/catch).
- Navy `#0F172A` background, white text, underlined link in `#EF7A63`.
- Text: "Seller acquisition teams for investors, wholesalers and agents. → Book a free strategy call"

### 3.2 Header bar
- White or `#F8FAFC` background, thin bottom border, sticky on scroll.
- **Left:** the logo and wordmark (section 1.3).
- **Center:** **Services ▾ · Who We Serve ▾ · Resources ▾ · Pricing**. The open item turns `#BC3823`, with its chevron flipped up.
- **Right:** **Manage subscription** (text link to the existing billing portal) · **Book a Call** (outlined pill, navy border) · **Get Started** (filled pill, `#BC3823` background, white text → plans section).

### 3.3 Dropdown panel layout
Full width, `#F8FAFC` background, soft shadow. Three zones:
1. **Left intro:** small gray eyebrow, bold headline, one or two lines of gray description, and an outlined pill button at the bottom.
2. **Middle list:** small gray group label, then items in **two columns**. Each item has a bold navy title (`#BC3823` on hover) and a one-line gray description.
3. **Right featured card:** rounded, navy-to-`#BC3823` gradient, proof image, bold white headline and a short line of copy. The whole card is a link.

### 3.4 Services panel
- Intro: eyebrow "Services" · **"Your done-for-you acquisitions team"** · "Callers, data, CRM and AI workflows that find and qualify motivated sellers for you." · pill **View all services** → `/services`
- Group label "What we do":

| Title | One-liner | Route |
|---|---|---|
| Cold Callers | Trained callers who qualify sellers on MTCP | `/services/cold-callers` |
| Lead Generation & Skip Tracing | Public-record lists, skip traced every month | `/services/lead-generation` |
| CRM Setup | GoHighLevel or Podio, built for acquisitions | `/services/crm-setup` |
| Comps & Deal Analysis | Comps, repair estimates and offer math | `/services/comps-deal-analysis` |
| Appointment Setting for Agents | Seller calls that turn into listing appointments | `/services/agent-appointment-setting` |
| Consulting | Market selection, deal analysis and 1-on-1 calls | `/services/consulting` |
| AI Workflows | AI connectors for your CRM, dialer and reporting | `/services/ai-workflows` |
| General VA Services | Data entry, follow-up, scheduling and inbox help | `/services/virtual-assistants` |
| Team Training | 3 one-hour sessions for teams of up to 5 VAs | `/services/team-training` |

- Featured card: `assets/one-caller-one-month.png` · **"35 seller leads in one month"** · "See what one VoloLeads caller delivers." → `/services/cold-callers`

### 3.5 Who We Serve panel
- Intro: eyebrow "Who we serve" · **"Built for seller acquisitions"** · "Whether you wholesale, flip, hold or list, we fill your pipeline with motivated sellers." · pill **Book a strategy call**
- Items: **Wholesalers** (Motivated sellers in your pipeline every week) · **Investors & flippers** (Off-market deals without running a call floor) · **Agents** (Seller conversations that turn into listings). Each links to its homepage card or service page.
- Featured card: `assets/four-month-consistency.png` · **"32+ seller leads, four months running"**

### 3.6 Resources panel
- Intro: eyebrow "Resources" · **"Learn how we work"** · pill **Read the FAQs** → `faqs.html`
- Items: **Call Recordings** (Hear our callers qualify real sellers; links to the homepage recordings section) · **Targeting by Intelligence** (`insights-intelligence.html`) · **Deal Structures** (`insights-deal.html`) · **Performance Analytics** (`insights-kpi.html`) · **Market Seasonality** (`insights-market.html`) · **Compliance** (`compliance.html`)
- Featured card: optional; use the Trustpilot rating only if it's current.

### 3.7 Behavior and accessibility
- One panel open at a time. Opens on hover (about 150ms delay) or click/tap; closes on mouse-out, a click outside, or Escape.
- Triggers are `<button>`s with `aria-expanded` and `aria-controls`. Panels are reachable with Tab; focus returns to the trigger on Escape.
- Respect `prefers-reduced-motion`.
- **Mobile (<1024px):** hamburger → full-screen sheet with each menu as an accordion (title + one-liner, no featured cards). **Book a Call** and **Get Started** are pinned at the bottom of the sheet.
- **Dark mode:** panel `#0F172A`, titles white, one-liners `#94A3B8`, small orange text `#EF7A63`.
- **Footer:** add a Services column with the 9 service links.

---

## 4. Services hub and 9 service pages

### 4.1 Structure
- **`/services` hub:** short intro plus a grid of 9 service cards, each linking to its page.
- **9 service pages** at the routes in 3.4. Follow the site's existing route convention if it differs (legal/info pages currently use `.html`).

### 4.2 Page template (same order on every page)
1. **Hero:** service name, one-line promise, audience tags (Investors / Wholesalers / Agents), an outlined **Book a Call** plus a filled **Get Started** or **Get a Quote** pill pair, with generous white space
2. **What's included:** two-column title-plus-one-liner list (preferred over dense bullet cards), small gray eyebrow above the heading
3. **How it works:** 3–4 steps (reuse the homepage step style)
4. **Tools we use:** text or logo chips, only where relevant (WAVV, GoHighLevel, Podio, XLeads, DealMachine)
5. **How you get it:** the plans that include it, **and** "Available on its own" with a custom quote (every service is sold on its own; section 5)
6. **Proof:** only the approved images in `assets/`, where noted; hide the slot otherwise
7. **Closing CTA (every page):** **"Book a strategy call"** → the existing strategy-call form, passing `?service=<slug>`

No FAQ section on these pages.

### 4.3 Page content
Plain, direct, operator to operator. Short sentences. Don't promise results beyond what's written here.

**Cold Callers** — *Trained acquisitions callers who qualify sellers so you only talk to the motivated ones.*
- Dedicated caller working Eastern time hours
- Trained on full MTCP qualification: **Motivation, Timeline, Condition, Price**
- WAVV triple-line dialer included (callers can also work in your dialer)
- Works in GoHighLevel or your CRM
- Daily QA: KPI monitoring, call reviews and coaching
- Daily reports and a dedicated VA manager
- Underperforming caller? We replace them with a new VA.
- How it works: Strategy call → onboarding (2–3 days) → calling and daily QA → seller leads with full MTCP notes delivered to your CRM
- Promise: **30+ seller leads a month** (plus the "results vary" line)
- Proof: both images in `assets/`
- Plans: Essential, Growth, Scale. On its own (a caller outside the standard plans): custom quote

**Lead Generation & Skip Tracing** — *Fresh, targeted seller lists pulled from public records and skip traced, so callers spend time on real owners.*
- Government and public-record lists: tax delinquencies, probates, code violations, vacant properties
- FSBO lists
- Skip tracing through XLeads and DealMachine (included in Growth and Scale)
- List cleaning, de-duplication; list stacking on Scale
- Automatic monthly list pulling
- Volume by plan:
  - Essential: one-time 10,000-lead signup bonus; you source ongoing leads
  - Growth: about 25,000 records a month
  - Scale: about **50,000 records a month** (also add this to the Scale plan card)
- On its own (lists and skip tracing without a caller): custom quote

**CRM Setup** — *A CRM built for acquisitions, so no lead falls through the cracks.*
- GoHighLevel or Podio: pipelines, custom fields, automations, lead routing, dialer and data integration, data import
- One-time build; ongoing support depending on subscription
- Plans: CRM support in Growth and Scale; on its own: custom quote

**Comps & Deal Analysis** — *Know your numbers before you make an offer.*
- Comparable sales; **standard repair estimates** by square footage using a rehab cost calculator; MAO/LAO offer math; deal recaps for your acquisitions team
- Scale includes comps plus targeted campaigns using Redfin market analysis
- Wording: "repair estimates based on square footage", never "inspection" or "contractor bid"
- **Turnaround:** "Comps are delivered as soon as a lead is qualified and submitted."
- Plans: Scale; on its own: custom quote

**Appointment Setting for Agents** — *Seller conversations that turn into listing appointments.*
- Callers work expired, FSBO and pre-foreclosure lists, qualify sellers and book appointments on the agent's calendar
- Plans: custom quote
- No results, numbers or testimonials on this page (new service)

**Consulting** — *Wholesaling and market know-how from operators who run acquisition teams every day.*
- 1-on-1 calls, market selection, deal analysis, Q&A sessions on our service
- Plans: 1-on-1 Q&A sessions included in Growth; on its own: custom quote

**AI Workflows** — *AI that connects your CRM, dialer and reporting so the busywork runs itself.*
- AI connectors that plug into your CRM and dialer, KPI tracking, skip tracing, call QA summaries and monitoring
- Scale includes AI automation for SMS and inbound voice reception
- Say "AI connectors" in public copy (not "MCP"), and don't claim integrations with tools we haven't connected
- Plans: SMS and inbound voice in Scale; other workflows: custom quote

**General VA Services** — *Trained VAs for the work that eats your day.*
- Data entry, list cleaning, follow-up, scheduling, social media, email inbox management and other admin by request
- Plans: custom quote

**Team Training** (new) — *Get your existing VAs calling like an acquisitions team.*
- For teams that **already have VAs** and want them trained the VoloLeads way
- **3 days, one 1-hour session per day**, covering MTCP qualification (Motivation, Timeline, Condition, Price), objection handling, call flow, dialer and CRM workflow, and daily KPI and QA habits
- Delivered by the VoloLeads team that trains and manages our own callers
- **Price: $200 per team**, covering **up to 5 VAs** (published price)
- How it works: book a strategy call → schedule the 3 days → training sessions → your team starts calling with our framework
- CTA: "Book a strategy call" (and "Get Started" if a checkout link is added later)
- Owner to confirm before publishing: delivery format (for example live online). Leave the format out until then.

---

## 5. Pricing rules

- **Plans (unchanged):** Essential $730/month plus a **$150 one-time setup fee (Essential only)**; Growth $1,535/month and Scale $2,685/month with a promo code (regular prices $1,699 and $2,999); **no setup fee** on Growth or Scale. Link to the existing plan cards and Stripe checkout rather than duplicating prices in a way that can drift.
- **Every service is sold on its own** (owner, 2026-11-05). Except Team Training, standalone services show **"Custom quote"** with a button to the existing `custom-quote.html` form, plus "Setup fee and minimum term are confirmed in your quote." Don't publish amounts for them.
- **Team Training: $200 per team (up to 5 VAs)** for three 1-hour sessions over 3 days, for teams with existing VAs. This is the one standalone price that's published.
- Keep the existing disclaimer that sourced records are not qualified opportunities or guaranteed results.

---

## 6. Proof images and data rules

- The two images in `assets/` use **real figures** from VoloLeads' daily KPI reports:
  - **Dave** (pseudonym), July 2026: 32,170 dials · 4,302 seller conversations · 35 seller leads
  - **Charlie** (pseudonym), May–August 2026: 33 · 32 · 32 · 32 seller leads (129 total, 136,656 dials)
- Use only the pseudonyms **Dave** and **Charlie** for callers. Never use real VA names, client names, seller details, phone numbers, addresses or internal IDs.
- **Never change the numbers** in these images or in copy to make them look better. If an image needs editing, edit its `.html` source in `assets/` and re-render; the numbers stay as they are.
- Any future illustrative sample must be labeled **"Sample report — illustrative data"** on the image itself.
- No named client results anywhere except the existing Trustpilot reviews, which stay verbatim.

Re-rendering a proof image (macOS, Chrome; run inside `assets/`):

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --hide-scrollbars --force-device-scale-factor=2 --window-size=1200,675 --virtual-time-budget=4000 --screenshot="$PWD/one-caller-one-month.png" "file://$PWD/one-caller-one-month.html"
```

For the web, export WebP/AVIF versions at display size and keep the PNGs as masters. Alt text:
- "One VoloLeads caller in July 2026: 32,170 dials, 4,302 seller conversations, 35 seller leads."
- "One VoloLeads caller's seller leads by month, May to August 2026: 33, 32, 32 and 32."

---

## 7. Tech requirements

- **Build in the existing Next.js app** (the site already serves `_next/` assets). Don't introduce Astro or a second framework.
- Reuse existing header, footer, card, button and section components and the Tailwind config. Update the brand tokens in the Tailwind theme (section 1.2) rather than hard-coding hex values.
- One shared service-page template with content in a data file (`services.ts` or MDX).
- Static generation; per-page `<title>` (pattern `{Service} for Real Estate Investors | VoloLeads`), meta description and Open Graph tags.
- All text in the server-rendered HTML; nothing important appears only after JavaScript runs.
- Light and dark mode both supported; mobile at about 375px with no horizontal scroll, readable text and tappable targets.

---

## 8. Do not change

- Plan names, prices, promo terms, Stripe checkout links and the plan recommender logic
- Customer review text and reviewer names
- Call recordings and their QA breakdowns
- The "No long-term contracts" line and the Essential plan disclaimer
- The logo file itself (use as supplied)

---

## 9. Owner decisions (answered 2026-11-05)

| Item | Decision |
|---|---|
| $28,000 deal timing | **Within the first month.** Use the line in 2.4a; the review stays verbatim |
| Strategy-call length | **30 minutes** everywhere (2.4a) |
| Comps turnaround | **Delivered as soon as a lead is qualified and submitted** (4.3) |
| Standalone services | **Every service is sold on its own** (section 5) |
| New service | **Team Training: $200 per team, up to 5 VAs, three 1-hour sessions over 3 days** (4.3) |
| 10,000+ counters | Owner keeps both values and labels (2.3) |

Still to confirm: Team Training delivery format. Leave it off until the owner answers.

---

## 10. Done-when checklist

**Brand**
- [ ] New orange logo in the header, footer, favicon and OG image; wordmark tight, with "Leads" in `#BC3823`
- [ ] Brand tokens updated (`#BC3823`, `#EF7A63`, `#F9E0DA`); no leftover bright orange (`#F97316` / `orange-*`)

**Homepage**
- [ ] Hero, `<title>` and meta description updated; badge, reviews heading and team stat relabeled
- [ ] Counters show real values without JavaScript (check with `curl`); clients counter reads "50+ Clients Across the United States"
- [ ] Founder line and $28K line added; every "15 minutes" changed to 30; "Who we work with" section live and linked
- [ ] OG tags, JSON-LD, the new "How did you hear" options and `?src` / `?service` tracking working

**Navigation and services**
- [ ] Announcement bar, header and three mega-menu panels live; keyboard accessible; mobile accordion; dark mode
- [ ] `/services` hub and all 9 service pages (including Team Training at $200) live from one template and a data file
- [ ] Every page ends with "Book a strategy call"; standalone services also show "Custom quote"
- [ ] Prices and setup fees match the plan cards exactly; Scale shows about 50,000 records a month

**Safety**
- [ ] Only approved proof images and figures used; pseudonyms only; no client or seller data
- [ ] Nothing in section 8 changed; section 9 decisions applied
- [ ] Checked at about 375px and on desktop, light and dark

**Report back with:** deployed URLs; desktop and mobile screenshots of the homepage hero and stats, one open mega-menu panel, the services hub and one service page; and the `curl` counter check output.
