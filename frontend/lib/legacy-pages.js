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

export const legacyRouteParams = Object.keys(pages)
  .filter(Boolean)
  .map(route => ({ slug: [route] }));

function getMatch(source, expression) {
  return source.match(expression)?.[1]?.trim() || '';
}

export function getLegacyPage(route) {
  const fileName = pages[route];
  if (!fileName) return null;

  const source = readPages[fileName]();
  const bodyMatch = source.match(/<body([^>]*)>([\s\S]*?)<\/body>/i);
  if (!bodyMatch) return null;

  const bodyAttributes = bodyMatch[1] || '';
  const bodyClass = getMatch(bodyAttributes, /\bclass=["']([^"']*)["']/i);
  const headStyles = [...source.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)]
    .map(match => match[1].trim())
    .filter(Boolean)
    .join('\n');

  const bodyHtml = bodyMatch[2]
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
