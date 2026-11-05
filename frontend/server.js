const express = require('express');
const http = require('http');
const https = require('https');
const path = require('path');
const fs = require('node:fs');
const redirects = require('./legacy-redirects.json');
const pageLoader = import(`data:text/javascript;base64,${fs.readFileSync(path.join(__dirname, 'lib/legacy-pages.js')).toString('base64')}`);
const helmet = require('helmet');
const app = express();
const PORT = process.env.PORT || 3000;
const API_BASE_URL = new URL(process.env.API_BASE_URL || 'http://localhost:5000');

// Security headers via Helmet
app.use(helmet({
  contentSecurityPolicy: false // fine-tune as needed in production
}));

// Redirect old documents before static files can serve them.
app.use((req, res, next) => {
  const destination = redirects[req.path];
  if (!destination) return next();
  const query = req.originalUrl.slice(req.path.length);
  return res.redirect(301, destination + query);
});
app.use('/legacy-assets/png', express.static(path.join(__dirname, 'png')));
app.use('/legacy-assets/audio', express.static(path.join(__dirname, 'audio')));

// Basic static serving
app.use(express.json());
app.use(express.static(path.join(__dirname), { index: false }));

app.use('/api', (req, res) => {
  const transport = API_BASE_URL.protocol === 'https:' ? https : http;
  const body = req.method === 'GET' || req.method === 'HEAD'
    ? null
    : JSON.stringify(req.body || {});

  const proxyRequest = transport.request({
    protocol: API_BASE_URL.protocol,
    hostname: API_BASE_URL.hostname,
    port: API_BASE_URL.port,
    method: req.method,
    path: req.originalUrl,
    headers: {
      ...req.headers,
      host: API_BASE_URL.host,
      ...(body ? {
        'content-type': 'application/json',
        'content-length': Buffer.byteLength(body)
      } : {})
    }
  }, proxyResponse => {
    res.status(proxyResponse.statusCode || 502);

    Object.entries(proxyResponse.headers).forEach(([header, value]) => {
      if (value !== undefined) {
        res.setHeader(header, value);
      }
    });

    proxyResponse.pipe(res);
  });

  proxyRequest.on('error', error => {
    res.status(502).json({
      success: false,
      message: 'Backend API is unavailable.',
      error: error.message
    });
  });

  if (body) {
    proxyRequest.write(body);
  }

  proxyRequest.end();
});

// Render the same clean routes and shared partials as the Next.js application.
app.get('*', async (req, res, next) => {
  try {
    const { getLegacyPage } = await pageLoader;
    const page = getLegacyPage(req.path.replace(/^\/|\/$/g, ''));
    if (!page) return res.status(404).send('Page not found');
    const escape = value => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
    res.send(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(page.title)}</title><meta name="description" content="${escape(page.description)}"><link rel="stylesheet" href="/tailwind.css"><link rel="stylesheet" href="/styles.css"><style>${page.headStyles}</style></head><body class="${escape(page.bodyClass)}">${page.bodyHtml}<script src="/icons.js"></script><script src="/app.js"></script></body></html>`);
  } catch (error) { next(error); }
});

app.listen(PORT, () => {
  console.log(`Static server running on http://localhost:${PORT}`);
});
