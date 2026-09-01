import fs from 'node:fs';
import path from 'node:path';

const pages = {
  '': 'index.html',
  'index.html': 'index.html',
  '404.html': '404.html',
  'cancel.html': 'cancel.html',
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

export const legacyRouteParams = Object.keys(pages)
  .filter(Boolean)
  .map(route => ({ slug: [route] }));

function getMatch(source, expression) {
  return source.match(expression)?.[1]?.trim() || '';
}

export function getLegacyPage(route) {
  const fileName = pages[route];
  if (!fileName) return null;

  const source = fs.readFileSync(path.join(process.cwd(), fileName), 'utf8');
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
