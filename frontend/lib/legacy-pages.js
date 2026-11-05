import fs from 'node:fs';
import path from 'node:path';

const pages = {
  "": "index.html",
  "404.html": "404.html",
  "maintenance.html": "maintenance.html",
  "cancel": "cancel.html",
  "compliance": "compliance.html",
  "custom-quote": "custom-quote.html",
  "disclaimer": "disclaimer.html",
  "faqs": "faqs.html",
  "manage-subscription": "manage-subscription.html",
  "privacy-policy": "privacy-policy.html",
  "refund-policy": "refund-policy.html",
  "schedule-onboarding": "schedule-onboarding.html",
  "success": "success.html",
  "thank-you": "thank-you.html",
  "terms": "terms-condition.html",
  "resources/deal-structures": "insights-deal.html",
  "resources/targeting-by-intelligence": "insights-intelligence.html",
  "resources/performance-analytics": "insights-kpi.html",
  "resources/market-seasonality": "insights-market.html",
  "pricing": "index.html",
  "call-recordings": "index.html",
  "contact": "index.html",
  "testimonials": "index.html",
  "about": "index.html"
};

// Literal read paths keep Next.js file tracing out of node_modules and build output.
const readPages = {
  'index.html': () => fs.readFileSync(path.join(process.cwd(), 'index.html'), 'utf8'),
  '404.html': () => fs.readFileSync(path.join(process.cwd(), '404.html'), 'utf8'),
  'cancel.html': () => fs.readFileSync(path.join(process.cwd(), 'cancel.html'), 'utf8'),
  'compliance.html': () => fs.readFileSync(path.join(process.cwd(), 'compliance.html'), 'utf8'),
  'custom-quote.html': () => fs.readFileSync(path.join(process.cwd(), 'custom-quote.html'), 'utf8'),
  'disclaimer.html': () => fs.readFileSync(path.join(process.cwd(), 'disclaimer.html'), 'utf8'),
  'faqs.html': () => fs.readFileSync(path.join(process.cwd(), 'faqs.html'), 'utf8'),
  'insights-deal.html': () => fs.readFileSync(path.join(process.cwd(), 'insights-deal.html'), 'utf8'),
  'insights-intelligence.html': () => fs.readFileSync(path.join(process.cwd(), 'insights-intelligence.html'), 'utf8'),
  'insights-kpi.html': () => fs.readFileSync(path.join(process.cwd(), 'insights-kpi.html'), 'utf8'),
  'insights-market.html': () => fs.readFileSync(path.join(process.cwd(), 'insights-market.html'), 'utf8'),
  'maintenance.html': () => fs.readFileSync(path.join(process.cwd(), 'maintenance.html'), 'utf8'),
  'manage-subscription.html': () => fs.readFileSync(path.join(process.cwd(), 'manage-subscription.html'), 'utf8'),
  'privacy-policy.html': () => fs.readFileSync(path.join(process.cwd(), 'privacy-policy.html'), 'utf8'),
  'refund-policy.html': () => fs.readFileSync(path.join(process.cwd(), 'refund-policy.html'), 'utf8'),
  'schedule-onboarding.html': () => fs.readFileSync(path.join(process.cwd(), 'schedule-onboarding.html'), 'utf8'),
  'success.html': () => fs.readFileSync(path.join(process.cwd(), 'success.html'), 'utf8'),
  'terms-condition.html': () => fs.readFileSync(path.join(process.cwd(), 'terms-condition.html'), 'utf8'),
  'thank-you.html': () => fs.readFileSync(path.join(process.cwd(), 'thank-you.html'), 'utf8'),
};

// Shared chrome. Pages mark where it goes with an HTML comment placeholder,
// e.g. <!-- site:header -->, so the header and footer live in one place.
const readPartials = {
  'site:header': () => fs.readFileSync(path.join(process.cwd(), 'partials', 'site-header.html'), 'utf8'),
  'site:header:minimal': () => fs.readFileSync(path.join(process.cwd(), 'partials', 'site-header-minimal.html'), 'utf8'),
  'site:footer': () => fs.readFileSync(path.join(process.cwd(), 'partials', 'site-footer.html'), 'utf8'),
};

function insertPartials(html) {
  return html
    .replace(/<!--\s*(site:[a-z:]+)\s*-->/g, (placeholder, name) => {
      const read = readPartials[name];
      if (!read) throw new Error(`Unknown page partial: ${name}`);
      return read().replace(/^<!--[\s\S]*?-->\s*/, '');
    })
    .replace(/\{\{blueprintMenu\}\}/g, () => blueprintMenuHtml())
    .replace(/\{\{blueprintMobile\}\}/g, () => blueprintMobileHtml())
    .replace(/\{\{pricingMenu\}\}/g, () => pricingMenuHtml())
    .replace(/\{\{pricingMobile\}\}/g, () => pricingMobileHtml())
    .replace(/\{\{year\}\}/g, String(new Date().getFullYear()));
}

// Plan pages (/plans/<slug>) are rendered from content/plans.json and one template.
const readPlanData = () => JSON.parse(fs.readFileSync(path.join(process.cwd(), 'content', 'plans.json'), 'utf8'));
const readPlanTemplate = () => fs.readFileSync(path.join(process.cwd(), 'partials', 'plan-page.html'), 'utf8');

const escapeHtml = value => String(value ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Shared Custom+ team builder. A plain GET form, so it works without JavaScript;
// app.js pre-fills the custom-quote form from these (non-personal) choices.
export function teamBuilderHtml(idPrefix) {
  const radios = (name, options, checked) => options.map(([value, label]) => `<label class="team-chip"><input type="radio" name="${name}" value="${value}"${value === checked ? ' checked' : ''}><span>${label}</span></label>`).join('');
  const boxes = (name, options) => options.map(([value, label]) => `<label class="team-chip"><input type="checkbox" name="${name}" value="${value}"><span>${label}</span></label>`).join('');
  return `<form class="team-builder" action="/custom-quote" method="get" data-team-builder aria-labelledby="${idPrefix}-title">
    <p class="team-builder-title" id="${idPrefix}-title">Build your team</p>
    <fieldset><legend>Callers</legend><div class="team-chips">${radios('callers', [['3', '3'], ['4-5', '4–5'], ['6-9', '6–9'], ['10+', '10+']], '4-5')}</div></fieldset>
    <fieldset><legend>Lead sourcing</legend><div class="team-chips">${radios('sourcing', [['voloLeads', 'We source'], ['client', 'You source']], 'voloLeads')}</div></fieldset>
    <fieldset><legend>Add-ons</legend><div class="team-chips">${boxes('addons', [['crm', 'CRM setup'], ['comps', 'Comps'], ['ai', 'AI workflows'], ['markets', 'Multiple markets']])}</div></fieldset>
    <button type="submit" class="team-builder-submit">Get my custom quote</button>
  </form>`;
}

// Pricing menu (desktop panel + mobile accordion), from the same plan data as the cards.
function planMenuPrice(plan) {
  const p = plan.price;
  return p.unit ? `${p.amount}${p.unit === '/ hour' ? ' / hour' : p.unit}` : p.amount;
}

function planMenuNote(plan) {
  if (!plan.checkout) return 'Quote after a strategy call';
  return plan.price.was ? `With promo code · regular ${plan.price.was}` : 'Billed $730 monthly + $150 setup';
}

function pricingMenuHtml() {
  return readPlanData().plans.map(plan => `<li><a href="/plans/${plan.slug}" class="mega-plan${plan.popular ? ' mega-plan--popular' : ''}">
      ${plan.popular ? '<span class="mega-plan-badge">Most popular</span>' : ''}
      <strong>${escapeHtml(plan.name)}</strong>
      <span class="mega-plan-for">${escapeHtml(plan.audience)}</span>
      <span class="mega-plan-price">${escapeHtml(planMenuPrice(plan))}</span>
      <span class="mega-plan-note">${escapeHtml(planMenuNote(plan))}</span>
    </a></li>`).join('');
}

function pricingMobileHtml() {
  return readPlanData().plans.map(plan => `<li><a href="/plans/${plan.slug}"><strong>${escapeHtml(plan.name)} · ${escapeHtml(planMenuPrice(plan))}</strong><span>${escapeHtml(plan.audience)}</span></a></li>`).join('');
}

function planPriceHtml(plan) {
  const p = plan.price;
  return [
    p.was ? `<p class="plan-was"><s>${escapeHtml(p.was)}</s></p>` : '',
    `<p class="plan-amount"><b>${escapeHtml(p.amount)}</b>${p.unit ? `<span>${escapeHtml(p.unit)}</span>` : ''}</p>`,
    p.save ? `<p class="plan-save">${escapeHtml(p.save)}</p>` : '',
    `<p class="plan-terms">${escapeHtml(p.terms)}</p>`
  ].join('');
}

function renderPlanPage(slug) {
  const data = readPlanData();
  const plan = data.plans.find(item => item.slug === slug);
  if (!plan) return null;
  const isCustom = !plan.checkout;
  const ctas = isCustom
    ? '<a href="/plans/custom-plus" data-scroll-target="plan-builder" class="site-pill site-pill--filled plan-page-cta">Build your team</a><a href="/custom-quote" class="site-pill site-pill--outline plan-page-cta">Request a custom quote</a>'
    : `<button type="button" class="subscribe-btn site-pill site-pill--filled plan-page-cta" data-plan="${escapeHtml(plan.checkout)}">Subscribe now</button><p class="plan-stripe-note">${plan.price.save ? 'Enter your promo code in Stripe checkout.' : 'Secure checkout powered by Stripe'}</p><a href="/contact?service=${encodeURIComponent(plan.name)}" class="site-pill site-pill--outline plan-page-cta">Book a strategy call</a>`;
  const fill = {
    title: `${plan.name} Plan for Real Estate Investors | VoloLeads`,
    description: `${plan.tagline} See what's included in VoloLeads ${plan.name}, how it works and what to expect in your first month.`,
    name: escapeHtml(plan.name),
    eyebrow: plan.popular ? 'Most popular plan' : (isCustom ? 'Custom build' : 'VoloLeads plan'),
    tagline: escapeHtml(plan.tagline),
    priceBlock: planPriceHtml(plan),
    ctas: `<div class="plan-page-ctas">${ctas}</div>`,
    ownLeads: plan.ownLeads ? `<aside class="plan-page-callout reveal-on-scroll"><p><strong>${escapeHtml(plan.ownLeads)}</strong> Ask about it on your strategy call.</p><a href="/contact?service=${encodeURIComponent(plan.name)}" class="site-pill site-pill--outline">Ask on a strategy call</a></aside>` : '',
    included: plan.included.map(item => `<li><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.text)}</span></li>`).join(''),
    steps: data.howItWorks.map((step, index) => `<li><span class="plan-step-index">${String(index + 1).padStart(2, '0')}</span><strong>${escapeHtml(step.title)}</strong><span>${escapeHtml(step.text)}</span></li>`).join(''),
    firstMonth: data.firstMonth.map(item => `<li><strong>${escapeHtml(item.when)}</strong><span>${escapeHtml(item.text)}</span></li>`).join(''),
    youHandle: plan.youHandle.map(item => `<li>${escapeHtml(item)}</li>`).join(''),
    fineprint: escapeHtml(plan.fineprint),
    builder: isCustom ? `<section class="plan-page-section reveal-on-scroll" id="plan-builder"><p class="plan-page-kicker">Build your team</p><h2>Tell us what you need</h2><p class="plan-page-lead">Pick your team size and add-ons. We'll pre-fill the quote form, and you'll get a quote after a short strategy call.</p>${teamBuilderHtml('plan-builder')}</section>` : '',
    others: data.plans.filter(item => item.slug !== slug).map(item => `<a href="/plans/${item.slug}" class="plan-page-other"><strong>${escapeHtml(item.name)}</strong><span>${escapeHtml(item.audience)}</span></a>`).join(''),
    serviceParam: encodeURIComponent(plan.name)
  };
  return readPlanTemplate().replace(/\{\{(\w+)\}\}/g, (token, key) => (key in fill ? fill[key] : token));
}

// Acquisition Blueprint (/resources hub, /resources/<slug> articles and the Resources
// menu columns) all come from content/blueprint.json.
const readBlueprint = () => JSON.parse(fs.readFileSync(path.join(process.cwd(), 'content', 'blueprint.json'), 'utf8'));
const readBlueprintTemplate = () => fs.readFileSync(path.join(process.cwd(), 'partials', 'blueprint-page.html'), 'utf8');
const readResourcesHubTemplate = () => fs.readFileSync(path.join(process.cwd(), 'partials', 'resources-hub.html'), 'utf8');

function blueprintGroups() {
  const data = readBlueprint();
  return data.groups.map(group => ({
    ...group,
    items: group.items.map(item => {
      if (!item.slug) return item;
      const page = data.pages.find(p => p.slug === item.slug);
      if (!page) throw new Error(`Blueprint item has no page: ${item.slug}`);
      return { title: page.title, summary: page.summary, href: `/resources/${page.slug}` };
    })
  }));
}

function blueprintMenuHtml() {
  return blueprintGroups().map(group => `<div class="mega-column">
      <p class="mega-group-label">${escapeHtml(group.label)}</p>
      <ul class="mega-column-items">${group.items.map(item => `<li><a href="${item.href}"><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.summary)}</span></a></li>`).join('')}</ul>
    </div>`).join('');
}

function blueprintMobileHtml() {
  return blueprintGroups().map(group => `<li class="mobile-accordion-group">${escapeHtml(group.label)}</li>${group.items.map(item => `<li><a href="${item.href}"><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.summary)}</span></a></li>`).join('')}`).join('');
}

function renderResourcesHub() {
  const groups = blueprintGroups().map((group, index) => `<section class="resources-group reveal-on-scroll" aria-labelledby="resources-${group.id}">
      <div class="resources-group-head"><h2 id="resources-${group.id}">${escapeHtml(group.label)}</h2><p>${escapeHtml(group.intro)}</p></div>
      <div class="resources-cards">${group.items.map(item => `<a href="${item.href}" class="resources-card"><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.summary)}</span><em>Read the playbook <span aria-hidden="true">&rarr;</span></em></a>`).join('')}</div>
    </section>`).join('');
  return readResourcesHubTemplate().replace(/\{\{groups\}\}/g, () => groups);
}

function renderBlueprintPage(slug) {
  const data = readBlueprint();
  const page = data.pages.find(p => p.slug === slug);
  if (!page) return null;
  const group = blueprintGroups().find(g => g.id === page.group);
  const sections = page.sections.map((section, index) => `<section class="blueprint-section">
      <h2><span>${index + 1}.</span> ${escapeHtml(section.title)}</h2>
      <p>${escapeHtml(section.text)}</p>
      ${section.points ? `<ul>${section.points.map(point => `<li>${escapeHtml(point)}</li>`).join('')}</ul>` : ''}
    </section>`).join('');
  const fill = {
    pageTitle: page.pageTitle || `${page.title} for Real Estate ${group.label} | VoloLeads Resources`,
    description: `${page.lede}`,
    title: escapeHtml(page.title),
    eyebrow: escapeHtml(page.eyebrow),
    headline: escapeHtml(page.headline),
    lede: escapeHtml(page.lede),
    intro: escapeHtml(page.intro),
    sections,
    takeaways: page.takeaways ? `<aside class="blueprint-takeaways" aria-labelledby="blueprint-takeaways-title"><p class="plan-page-kicker" id="blueprint-takeaways-title">Key takeaways</p><ul>${page.takeaways.map(point => `<li>${escapeHtml(point)}</li>`).join('')}</ul></aside>` : '',
    disclaimer: page.disclaimer ? `<p class="blueprint-disclaimer">${escapeHtml(page.disclaimer)}</p>` : '',
    draftNotice: page.status === 'draft' ? '<p class="blueprint-draft" role="note">Draft for review: this page is awaiting VoloLeads approval.</p>' : '',
    helps: page.helps.map(help => `<a href="${help.href}" class="plan-page-other"><strong>${escapeHtml(help.title)}</strong><span>See the service <span aria-hidden="true">&rarr;</span></span></a>`).join(''),
    ctaTitle: escapeHtml(page.ctaTitle),
    ctaText: escapeHtml(page.ctaText),
    moreLabel: escapeHtml(group.moreLabel || `More for ${group.label.toLowerCase()}`),
    related: group.items.filter(item => item.href !== `/resources/${slug}`).map(item => `<a href="${item.href}" class="plan-page-other"><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.summary)}</span></a>`).join('')
  };
  return readBlueprintTemplate().replace(/\{\{(\w+)\}\}/g, (token, key) => (key in fill ? fill[key] : token));
}

// Service routes share templates and use the existing plan facts for package details.
const readServices = () => JSON.parse(fs.readFileSync(path.join(process.cwd(), 'content', 'services.json'), 'utf8'));
const readServiceTemplate = () => fs.readFileSync(path.join(process.cwd(), 'partials', 'service-page.html'), 'utf8');
const readServicesHubTemplate = () => fs.readFileSync(path.join(process.cwd(), 'partials', 'services-hub.html'), 'utf8');
const SERVICE_SLUGS = ['cold-callers', 'lead-generation', 'crm-setup', 'comps-deal-analysis', 'agent-appointment-setting', 'consulting', 'ai-workflows', 'virtual-assistants', 'team-training'];

function renderServicesHub() {
  const cards = readServices().services.map(service => `<a class="service-card" href="/services/${escapeHtml(service.slug)}">
    <i class="fa-solid fa-${escapeHtml(service.icon)}" aria-hidden="true"></i>
    <h2>${escapeHtml(service.name)}</h2><p>${escapeHtml(service.promise)}</p>
    <span class="service-card-link">Explore service <span aria-hidden="true">&rarr;</span></span>
  </a>`).join('');
  return readServicesHubTemplate().replace('{{cards}}', () => cards);
}

function renderServicePage(slug) {
  const service = readServices().services.find(item => item.slug === slug);
  if (!service) return null;
  const planData = readPlanData().plans;
  const contactUrl = `/contact?service=${encodeURIComponent(slug)}`;
  const quoteUrl = `/custom-quote?service=${encodeURIComponent(slug)}`;
  const cta = service.price
    ? `<a href="${contactUrl}" class="site-pill site-pill--filled">Book a strategy call</a>`
    : `<a href="${quoteUrl}" class="site-pill site-pill--filled">Get a Quote</a>`;
  const plans = service.plans.map(planSlug => {
    const plan = planData.find(item => item.slug === planSlug);
    if (!plan) throw new Error(`Unknown plan for service: ${planSlug}`);
    const features = (service.planFeatures?.[planSlug] || []).map(title => {
      const feature = plan.included.find(item => item.title === title);
      if (!feature) throw new Error(`Missing plan fact: ${planSlug}/${title}`);
      return `<p><strong>${escapeHtml(feature.title)}</strong> ${escapeHtml(feature.text)}</p>`;
    }).join('');
    return `<a href="/plans/${escapeHtml(plan.slug)}" class="plan-page-other"><strong>${escapeHtml(plan.name)}</strong><span>${escapeHtml(plan.audience)}</span>${features}<span class="service-card-link">View plan details &rarr;</span></a>`;
  }).join('');
  const fill = {
    title: escapeHtml(service.seoTitle || `${service.name} for Real Estate Investors | VoloLeads`),
    description: escapeHtml(service.seoDescription || service.promise),
    keywords: escapeHtml((service.keywords || []).join(', ')),
    name: escapeHtml(service.name),
    promise: escapeHtml(service.promise),
    slug: escapeHtml(slug),
    audiences: service.audiences.map(audience => `<li>${escapeHtml(audience)}</li>`).join(''),
    // Services sold inside a plan start at the plans; the rest start with a quote.
    primaryCta: service.price
      ? `<a href="${contactUrl}" class="site-pill site-pill--filled">Get Started</a>`
      : service.plans.length ? '<a href="/pricing" class="site-pill site-pill--filled">Get Started</a>' : cta,
    overview: service.overview ? `<section class="plan-page-section"><p class="plan-page-kicker">Why it matters</p><h2>${escapeHtml(service.overviewTitle)}</h2><div class="service-overview">${service.overview.map(text => `<p>${escapeHtml(text)}</p>`).join('')}</div></section>` : '',
    fit: service.fit ? `<section class="plan-page-section service-fit"><div><p class="plan-page-kicker">Is it right for you?</p><h2>A good fit if</h2><ul class="service-checklist">${service.fit.map(text => `<li>${escapeHtml(text)}</li>`).join('')}</ul></div>${service.youProvide ? `<div><p class="plan-page-kicker">Getting started</p><h2>What we need from you</h2><ul class="service-checklist">${service.youProvide.map(text => `<li>${escapeHtml(text)}</li>`).join('')}</ul></div>` : ''}</section>` : '',
    included: service.included.map(item => `<li><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.text)}</span></li>`).join(''),
    note: service.note ? `<p class="service-note">${escapeHtml(service.note)}</p>` : '',
    steps: service.steps.map((step, index) => `<li><span class="plan-step-index">${String(index + 1).padStart(2, '0')}</span><strong>${escapeHtml(step.title)}</strong><span>${escapeHtml(step.text)}</span></li>`).join(''),
    tools: service.tools.length ? `<section class="plan-page-section"><p class="plan-page-kicker">Tools we use</p><h2>Part of your workflow</h2><ul class="service-tags">${service.tools.map(tool => `<li>${escapeHtml(tool)}</li>`).join('')}</ul></section>` : '',
    plans: plans ? `<p class="service-note">${escapeHtml(service.planNote || 'Available within these plans. Review each plan for its scope and current pricing.')}</p><div class="service-plan-links">${plans}</div>` : '',
    standalonePrice: escapeHtml(service.price || 'Custom quote'),
    standaloneNote: escapeHtml(service.priceNote || 'Setup fee and minimum term are confirmed in your quote.'),
    standaloneCta: cta,
    proof: service.proof ? `<section class="plan-page-section"><p class="plan-page-kicker">From the calling floor</p><h2>Real campaign activity</h2><div class="service-proof">${service.proof.map(proof => `<figure><img src="/legacy-assets/png/proof/${escapeHtml(proof.file)}" alt="${escapeHtml(proof.alt)}" width="1200" height="675" loading="lazy"></figure>`).join('')}</div><p class="service-note">Historical campaign reports. Results vary by market and list type.</p></section>` : '',
    resource: service.resource ? `<p class="service-resource"><a href="${escapeHtml(service.resource.href)}">${escapeHtml(service.resource.label)} <span aria-hidden="true">&rarr;</span></a></p>` : ''
  };
  return readServiceTemplate().replace(/\{\{(\w+)\}\}/g, (token, key) => key in fill ? fill[key] : token);
}

// Who We Serve routes (/who-we-serve, /who-we-serve/<slug>) link services, plans and
// Blueprint playbooks by slug, so names and plan facts come from their own data files.
const readAudiences = () => JSON.parse(fs.readFileSync(path.join(process.cwd(), 'content', 'audiences.json'), 'utf8'));
const readAudienceTemplate = () => fs.readFileSync(path.join(process.cwd(), 'partials', 'audience-page.html'), 'utf8');
const readAudiencesHubTemplate = () => fs.readFileSync(path.join(process.cwd(), 'partials', 'audiences-hub.html'), 'utf8');
const AUDIENCE_SLUGS = ['wholesalers', 'investors', 'agents'];

function renderAudiencesHub() {
  const cards = readAudiences().audiences.map(audience => `<a class="service-card" href="/who-we-serve/${escapeHtml(audience.slug)}">
    <i class="fa-solid fa-${escapeHtml(audience.icon)}" aria-hidden="true"></i>
    <h2>${escapeHtml(audience.name)}</h2><p>${escapeHtml(audience.lede)}</p>
    <span class="service-card-link">See how we help <span aria-hidden="true">&rarr;</span></span>
  </a>`).join('');
  return readAudiencesHubTemplate().replace('{{cards}}', () => cards);
}

function renderAudiencePage(slug) {
  const audience = readAudiences().audiences.find(item => item.slug === slug);
  if (!audience) return null;
  const services = readServices().services;
  const plans = readPlanData().plans;
  const group = blueprintGroups().find(item => item.id === audience.playbooks);
  if (!group) throw new Error(`Unknown Blueprint group for audience: ${audience.playbooks}`);
  const serviceCards = audience.services.map(entry => {
    const service = services.find(item => item.slug === entry.slug);
    if (!service) throw new Error(`Unknown service for audience: ${entry.slug}`);
    return `<a href="/services/${escapeHtml(service.slug)}" class="plan-page-other"><strong>${escapeHtml(service.name)}</strong><span>${escapeHtml(entry.text)}</span><span class="service-card-link">Explore service &rarr;</span></a>`;
  }).join('');
  const planCards = audience.plans.map(entry => {
    const plan = plans.find(item => item.slug === entry.slug);
    if (!plan) throw new Error(`Unknown plan for audience: ${entry.slug}`);
    return `<a href="/plans/${escapeHtml(plan.slug)}" class="plan-page-other"><strong>${escapeHtml(plan.name)}</strong><span>${escapeHtml(entry.text)}</span><span class="service-card-link">View plan details &rarr;</span></a>`;
  }).join('');
  const hasPlans = audience.plans.length > 0;
  const fill = {
    title: escapeHtml(audience.title),
    description: escapeHtml(audience.description),
    keywords: escapeHtml((audience.keywords || []).join(', ')),
    name: escapeHtml(audience.name),
    nameLower: escapeHtml(audience.name.toLowerCase()),
    slug: escapeHtml(audience.slug),
    eyebrow: escapeHtml(audience.eyebrow),
    headline: audience.headline, // trusted content: allows one <span> accent
    lede: escapeHtml(audience.lede),
    secondaryCta: hasPlans
      ? '<a href="/pricing" class="site-pill site-pill--outline">Explore the plans</a>'
      : `<a href="/custom-quote?service=${escapeHtml(audience.slug)}" class="site-pill site-pill--outline">Get a Quote</a>`,
    challengeTitle: escapeHtml(audience.challengeTitle),
    challenges: audience.challenges.map(item => `<li><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.text)}</span></li>`).join(''),
    services: serviceCards,
    steps: audience.steps.map((step, index) => `<li><span class="plan-step-index">${String(index + 1).padStart(2, '0')}</span><strong>${escapeHtml(step.title)}</strong><span>${escapeHtml(step.text)}</span></li>`).join(''),
    plansTitle: hasPlans ? 'Plans that fit' : 'Priced around your market',
    plans: hasPlans
      ? `<div class="service-plan-links">${planCards}</div>`
      : `<div class="service-standalone"><div><p class="plan-page-kicker">Available on its own</p><h3>Custom quote</h3><p>${escapeHtml(audience.planNote)}</p></div><a href="/custom-quote?service=${escapeHtml(audience.slug)}" class="site-pill site-pill--filled">Get a Quote</a></div>`,
    playbooks: group.items.map(item => `<a href="${item.href}" class="resources-card"><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.summary)}</span><em>Read the playbook <span aria-hidden="true">&rarr;</span></em></a>`).join('')
  };
  return readAudienceTemplate().replace(/\{\{(\w+)\}\}/g, (token, key) => (key in fill ? fill[key] : token));
}

const BLUEPRINT_SLUGS = ['fix-and-flip', 'buy-and-hold', 'seller-finance', 'seller-listing-opportunities', 'buyer-opportunities', 'listing-marketing-support', 'how-we-operate', 'tcpa-compliance', 'ai-workflows'];

// Route list is fixed (it is built at import time, before any cwd is known); page content
// comes from content/plans.json at render. Keep in sync with the slugs in that file.
const PLAN_SLUGS = ['essential', 'growth', 'scale', 'custom-plus'];

export const legacyRouteParams = [
  { slug: ['services'] },
  ...SERVICE_SLUGS.map(slug => ({ slug: ['services', slug] })),
  { slug: ['who-we-serve'] },
  ...AUDIENCE_SLUGS.map(slug => ({ slug: ['who-we-serve', slug] })),
  ...Object.keys(pages).filter(route => route && route !== '404.html').map(route => ({ slug: route.split('/') })),
  ...PLAN_SLUGS.map(slug => ({ slug: ['plans', slug] })),
  { slug: ['resources'] },
  ...BLUEPRINT_SLUGS.map(slug => ({ slug: ['resources', slug] }))
];

function decodeMetadata(text) {
  const entities = { amp: '&', quot: '"', lt: '<', gt: '>', '#39': "'" };
  return text.replace(/&(amp|quot|lt|gt|#39);/g, (_, entity) => entities[entity]);
}

function getMatch(source, expression) {
  return source.match(expression)?.[1]?.trim() || '';
}

export function getLegacyPage(route) {
  let source;
  const planMatch = /^plans\/([a-z-]+)$/.exec(route);
  const blueprintMatch = /^resources\/([a-z-]+)$/.exec(route);
  if (route === 'services') {
    source = renderServicesHub();
  } else if (route.startsWith('services/')) {
    source = renderServicePage(route.slice('services/'.length));
    if (!source) return null;
  } else if (route === 'who-we-serve') {
    source = renderAudiencesHub();
  } else if (route.startsWith('who-we-serve/')) {
    source = renderAudiencePage(route.slice('who-we-serve/'.length));
    if (!source) return null;
  } else if (Object.hasOwn(pages, route)) {
    source = readPages[pages[route]]();
  } else if (planMatch) {
    source = renderPlanPage(planMatch[1]);
    if (!source) return null;
  } else if (route === 'resources') {
    source = renderResourcesHub();
  } else if (blueprintMatch) {
    source = renderBlueprintPage(blueprintMatch[1]);
    if (!source) return null;
  } else {
    return null;
  }
  const bodyMatch = source.match(/<body([^>]*)>([\s\S]*?)<\/body>/i);
  if (!bodyMatch) return null;

  const bodyAttributes = bodyMatch[1] || '';
  const bodyClass = getMatch(bodyAttributes, /\bclass=["']([^"']*)["']/i);
  const headStyles = [...source.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)]
    .map(match => match[1].trim())
    .filter(Boolean)
    .join('\n');

  let bodyHtml = insertPartials(bodyMatch[2])
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/((?:src|href|data-src)=["'])(?:\.\/)?(png|audio)\//gi, '$1/legacy-assets/$2/');

  // Keep legacy layout IDs intact; give every page a keyboard skip target.
  const contentTag = ['main', 'article', 'section'].find(tag => new RegExp(`<${tag}\\b`, 'i').test(bodyHtml));
  if (contentTag) {
    let target;
    bodyHtml = bodyHtml.replace(new RegExp(`<${contentTag}\\b([^>]*)>`, 'i'), (tag, attributes) => {
      target = getMatch(attributes, /\bid=["']([^"']+)["']/i) || 'page-content';
      return `<${contentTag}${attributes}${/\bid=/.test(attributes) ? '' : ` id="${target}"`} tabindex="-1">`;
    });
    bodyHtml = `<a href="#${target}" class="site-skip-link">Skip to main content</a>${bodyHtml}`;
  }

  const robots = getMatch(source, /<meta[^>]+name=["']robots["'][^>]+content=["']([^"']*)["']/i).toLowerCase().split(/[,\s]+/);
  const draft = blueprintMatch && readBlueprint().pages.some(page => page.slug === blueprintMatch[1] && page.status === 'draft');

  const canonical = pages[route] === 'index.html' ? '/' : `/${route}`;
  const title = decodeMetadata(getMatch(source, /<title[^>]*>([\s\S]*?)<\/title>/i)) || 'VoloLeads';
  const description = decodeMetadata(getMatch(source, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i));

  return {
    bodyClass,
    canonical,
    keywords: decodeMetadata(getMatch(source, /<meta[^>]+name=["']keywords["'][^>]+content=["']([^"']*)["']/i)) || undefined,
    jsonLd: buildJsonLd(route, canonical, title, description, source, bodyHtml),
    ogImage: decodeMetadata(getMatch(source, /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']*)["']/i)) || undefined,
    robots: {
      index: !draft && route !== '404.html' && !robots.includes('noindex') && !robots.includes('none'),
      follow: !robots.includes('nofollow') && !robots.includes('none')
    },
    bodyHtml,
    headStyles,
    title,
    description
  };
}

// Structured data (JSON-LD) for search engines and AI answer engines. Built from the
// same content files as the pages, so it never says anything the page doesn't.
const SITE_URL = 'https://www.vololeads.com';
const ORG_ID = `${SITE_URL}/#organization`;
const stripTags = html => decodeMetadata(html.replace(/<[^>]+>/g, ' ').replace(/&rarr;|&nbsp;/g, ' ').replace(/\s+/g, ' ').replace(/\s+([.,;:!?])/g, '$1').trim());

function breadcrumbLd(bodyHtml, canonical) {
  const nav = getMatch(bodyHtml, /<nav class="resources-breadcrumb"[^>]*>([\s\S]*?)<\/nav>/i);
  if (!nav) return null;
  const items = [...nav.matchAll(/<a href="([^"]+)">([\s\S]*?)<\/a>/g)].map(([, href, name]) => ({ href, name: stripTags(name) }));
  const current = [...nav.matchAll(/<span>([\s\S]*?)<\/span>/g)].pop();
  if (current) items.push({ href: canonical, name: stripTags(current[1]) });
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({ '@type': 'ListItem', position: index + 1, name: item.name, item: `${SITE_URL}${item.href === '/' ? '' : item.href}` }))
  };
}

function faqLd(source) {
  const questions = [...source.matchAll(/<button class="accordion-trigger[\s\S]*?<span[^>]*>([\s\S]*?)<\/span>[\s\S]*?<div class="accordion-content">([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/g)];
  if (!questions.length) return null;
  return {
    '@type': 'FAQPage',
    mainEntity: questions.map(([, question, answer]) => ({ '@type': 'Question', name: stripTags(question), acceptedAnswer: { '@type': 'Answer', text: stripTags(answer) } }))
  };
}

function buildJsonLd(route, canonical, title, description, source, bodyHtml) {
  const url = `${SITE_URL}${canonical === '/' ? '' : canonical}`;
  const page = { '@type': 'WebPage', '@id': `${url}#webpage`, url, name: title, description: description || undefined, isPartOf: { '@id': `${SITE_URL}/#website` }, about: { '@id': ORG_ID } };
  const graph = [page];
  const serviceMatch = /^services\/([a-z-]+)$/.exec(route);
  const blueprintMatch = /^resources\/([a-z-]+)$/.exec(route);
  if (serviceMatch) {
    const service = readServices().services.find(item => item.slug === serviceMatch[1]);
    if (service) graph.push({
      '@type': 'Service',
      '@id': `${url}#service`,
      name: service.name,
      serviceType: service.name,
      description: service.seoDescription || service.promise,
      url,
      provider: { '@id': ORG_ID },
      areaServed: { '@type': 'Country', name: 'United States' },
      audience: service.audiences.map(name => ({ '@type': 'BusinessAudience', name: `Real estate ${name.toLowerCase()}` })),
      ...(service.price ? { offers: { '@type': 'Offer', price: '200', priceCurrency: 'USD', description: `${service.price}. ${service.priceNote}` } } : {}),
      hasOfferCatalog: { '@type': 'OfferCatalog', name: `${service.name}: what's included`, itemListElement: service.included.map(item => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: item.title, description: item.text } })) }
    });
  } else if (blueprintMatch && readBlueprint().pages.some(item => item.slug === blueprintMatch[1])) {
    const article = readBlueprint().pages.find(item => item.slug === blueprintMatch[1]);
    graph.push({ '@type': 'Article', '@id': `${url}#article`, headline: article.headline, description: article.lede, url, author: { '@id': ORG_ID }, publisher: { '@id': ORG_ID }, mainEntityOfPage: { '@id': `${url}#webpage` }, keywords: (article.takeaways || []).join(', ') || undefined });
  } else if (route === 'faqs') {
    const faq = faqLd(source);
    if (faq) { page['@type'] = ['WebPage', 'FAQPage']; page.mainEntity = faq.mainEntity; }
  }
  const crumbs = breadcrumbLd(bodyHtml, canonical);
  if (crumbs) graph.push(crumbs);
  return { '@context': 'https://schema.org', '@graph': graph };
}

// Every indexable page, once, at its canonical URL (homepage section aliases and
// noindex pages are left out). Used by app/sitemap.js.
export function sitemapRoutes() {
  const seen = new Set();
  return ['', ...legacyRouteParams.map(param => param.slug.join('/'))].flatMap(route => {
    const page = getLegacyPage(route);
    if (!page || !page.robots.index || seen.has(page.canonical)) return [];
    seen.add(page.canonical);
    return [page.canonical];
  });
}

// /llms.txt: a plain-language summary for AI answer engines (llmstxt.org format),
// built from the same content files as the pages so facts never drift.
export function buildLlmsTxt() {
  const services = readServices().services;
  const plans = readPlanData().plans;
  const audiences = readAudiences().audiences;
  const groups = blueprintGroups();
  const drafts = new Set(readBlueprint().pages.filter(page => page.status === 'draft').map(page => `/resources/${page.slug}`));
  const link = (label, href, text) => `- [${label}](${SITE_URL}${href})${text ? `: ${text}` : ''}`;
  const planLine = plan => {
    const price = plan.price.amount === 'Custom' ? 'custom quote' : `${plan.price.amount}${plan.price.unit ? ` ${plan.price.unit.replace('/ ', 'per ').replace('/', 'per ')}` : ''}${plan.price.terms ? ` (${plan.price.terms})` : ''}`;
    return link(`${plan.name} plan`, `/plans/${plan.slug}`, `${plan.tagline} Price: ${price}`);
  };
  return [
    '# VoloLeads',
    '',
    '> VoloLeads builds managed seller acquisition teams for real estate wholesalers, investors and agents in the United States: trained real estate cold callers and acquisition VAs, skip-traced seller lead generation, CRM setup, comps and deal analysis, and AI workflow automation. Every caller is overseen by a VA manager with daily QA and KPI reports.',
    '',
    'Key facts:',
    '- Callers qualify motivated sellers on Motivation, Timeline, Condition and Price (MTCP) and deliver leads to the client CRM with full notes.',
    '- Most campaigns generate 30–50+ seller leads per month, depending on list quality and whether SMS workflows are used. Results vary by market and list type.',
    '- Setup takes 2–3 days after checkout and intake. Strategy calls are 30 minutes.',
    '- Outbound seller calls are made by trained human callers, never AI or prerecorded voices. Lists are screened against national and applicable state Do Not Call lists daily.',
    '- Growth and Scale records come from county government records, skip traced through data providers (XLeads and DealMachine).',
    '- Follow-up and closing are handled by clients, so closing rates are not tied to VoloLeads leads.',
    '- Plans are billed monthly with no long-term contracts.',
    '',
    '## Services',
    ...services.map(service => link(service.name, `/services/${service.slug}`, service.seoDescription || service.promise)),
    '',
    '## Plans',
    ...plans.map(planLine),
    '',
    '## Who we serve',
    ...audiences.map(audience => link(audience.name, `/who-we-serve/${audience.slug}`, audience.lede)),
    '',
    '## Guides (The Acquisition Blueprint)',
    // Draft articles stay out until approved (they're noindexed too).
    ...groups.flatMap(group => group.items.filter(item => !drafts.has(item.href)).map(item => link(item.title, item.href, `${item.summary} (for ${group.label.toLowerCase()})`))),
    '',
    '## Company',
    link('FAQs', '/faqs', 'Leads per month, TCPA compliance, lead sources, setup time and pricing.'),
    link('Compliance Policy', '/compliance', 'TCPA, Do Not Call and SMS procedures.'),
    link('Call recordings', '/call-recordings', 'Real VoloLeads seller calls with QA breakdowns.'),
    link('Book a strategy call', '/contact'),
    '- Email: syed@vololeads.com',
    '- Reviews: https://www.trustpilot.com/review/vololeads.com',
    ''
  ].join('\n');
}
