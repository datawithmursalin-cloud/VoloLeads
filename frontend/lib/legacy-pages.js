import fs from 'node:fs';
import path from 'node:path';

const pages = {
  '': 'index.html',
  'index.html': 'index.html',
  '404.html': '404.html',
  'cancel.html': 'cancel.html',
  'compliance.html': 'compliance.html',
  'custom-quote.html': 'custom-quote.html',
  'disclaimer.html': 'disclaimer.html',
  'faqs.html': 'faqs.html',
  'insights-deal.html': 'insights-deal.html',
  'insights-intelligence.html': 'insights-intelligence.html',
  'insights-kpi.html': 'insights-kpi.html',
  'insights-market.html': 'insights-market.html',
  'maintenance.html': 'maintenance.html',
  'manage-subscription.html': 'manage-subscription.html',
  'privacy-policy.html': 'privacy-policy.html',
  'refund-policy.html': 'refund-policy.html',
  'schedule-onboarding.html': 'schedule-onboarding.html',
  'success.html': 'success.html',
  'terms-condition.html': 'terms-condition.html',
  'thank-you.html': 'thank-you.html'
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
  return `<form class="team-builder" action="/custom-quote.html" method="get" data-team-builder aria-labelledby="${idPrefix}-title">
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
    ? '<a href="#plan-builder" class="site-pill site-pill--filled plan-page-cta">Build your team</a><a href="/custom-quote.html" class="site-pill site-pill--outline plan-page-cta">Request a custom quote</a>'
    : `<button type="button" class="subscribe-btn site-pill site-pill--filled plan-page-cta" data-plan="${escapeHtml(plan.checkout)}">Subscribe now</button><p class="plan-stripe-note">${plan.price.save ? 'Enter your promo code in Stripe checkout.' : 'Secure checkout powered by Stripe'}</p><a href="/?service=${encodeURIComponent(plan.name)}#contact" class="site-pill site-pill--outline plan-page-cta">Book a strategy call</a>`;
  const fill = {
    title: `${plan.name} Plan for Real Estate Investors | VoloLeads`,
    description: `${plan.tagline} See what's included in VoloLeads ${plan.name}, how it works and what to expect in your first month.`,
    name: escapeHtml(plan.name),
    eyebrow: plan.popular ? 'Most popular plan' : (isCustom ? 'Custom build' : 'VoloLeads plan'),
    tagline: escapeHtml(plan.tagline),
    priceBlock: planPriceHtml(plan),
    ctas: `<div class="plan-page-ctas">${ctas}</div>`,
    ownLeads: plan.ownLeads ? `<aside class="plan-page-callout reveal-on-scroll"><p><strong>${escapeHtml(plan.ownLeads)}</strong> Ask about it on your strategy call.</p><a href="/?service=${encodeURIComponent(plan.name)}#contact" class="site-pill site-pill--outline">Ask on a strategy call</a></aside>` : '',
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

const BLUEPRINT_SLUGS = ['fix-and-flip', 'buy-and-hold', 'seller-finance', 'seller-listing-opportunities', 'buyer-opportunities', 'listing-marketing-support', 'how-we-operate', 'tcpa-compliance', 'ai-workflows'];

// Route list is fixed (it is built at import time, before any cwd is known); page content
// comes from content/plans.json at render. Keep in sync with the slugs in that file.
const PLAN_SLUGS = ['essential', 'growth', 'scale', 'custom-plus'];

export const legacyRouteParams = [
  ...Object.keys(pages).filter(Boolean).map(route => ({ slug: [route] })),
  ...PLAN_SLUGS.map(slug => ({ slug: ['plans', slug] })),
  { slug: ['resources'] },
  ...BLUEPRINT_SLUGS.map(slug => ({ slug: ['resources', slug] }))
];

function getMatch(source, expression) {
  return source.match(expression)?.[1]?.trim() || '';
}

export function getLegacyPage(route) {
  let source;
  const planMatch = /^plans\/([a-z-]+)$/.exec(route);
  const blueprintMatch = /^resources\/([a-z-]+)$/.exec(route);
  if (planMatch) {
    source = renderPlanPage(planMatch[1]);
    if (!source) return null;
  } else if (route === 'resources') {
    source = renderResourcesHub();
  } else if (blueprintMatch) {
    source = renderBlueprintPage(blueprintMatch[1]);
    if (!source) return null;
  } else {
    const fileName = pages[route];
    if (!fileName) return null;
    source = readPages[fileName]();
  }
  const bodyMatch = source.match(/<body([^>]*)>([\s\S]*?)<\/body>/i);
  if (!bodyMatch) return null;

  const bodyAttributes = bodyMatch[1] || '';
  const bodyClass = getMatch(bodyAttributes, /\bclass=["']([^"']*)["']/i);
  const headStyles = [...source.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)]
    .map(match => match[1].trim())
    .filter(Boolean)
    .join('\n');

  const bodyHtml = insertPartials(bodyMatch[2])
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/((?:src|href|data-src)=["'])(?:\.\/)?(png|audio)\//gi, '$1/legacy-assets/$2/');

  return {
    bodyClass,
    bodyHtml,
    headStyles,
    title: getMatch(source, /<title[^>]*>([\s\S]*?)<\/title>/i) || 'VoloLeads',
    description: getMatch(source, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i)
  };
}
