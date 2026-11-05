import { sitemapRoutes } from '../lib/legacy-pages';

const SITE_URL = 'https://www.vololeads.com';

export default function sitemap() {
  const lastModified = new Date();
  return sitemapRoutes().map(route => ({
    url: `${SITE_URL}${route === '/' ? '' : route}`,
    lastModified,
    changeFrequency: route === '/' ? 'weekly' : 'monthly',
    priority: route === '/' ? 1 : /^\/(services|who-we-serve|plans)/.test(route) ? 0.8 : 0.6
  }));
}
