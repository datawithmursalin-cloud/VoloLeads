// Search engines and AI answer engines (ChatGPT, Claude, Perplexity, Gemini, Apple) may
// crawl everything except the API. Pages that shouldn't be indexed carry their own noindex.
const AI_CRAWLERS = ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-User', 'Claude-SearchBot', 'PerplexityBot', 'Perplexity-User', 'Google-Extended', 'Applebot-Extended', 'Bingbot', 'Googlebot'];

export default function robots() {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: '/api/' },
      { userAgent: AI_CRAWLERS, allow: '/', disallow: '/api/' }
    ],
    sitemap: 'https://www.vololeads.com/sitemap.xml',
    host: 'https://www.vololeads.com'
  };
}
