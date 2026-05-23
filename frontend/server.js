const express = require('express');
const http = require('http');
const https = require('https');
const path = require('path');
const helmet = require('helmet');
const app = express();
const PORT = process.env.PORT || 3000;
const API_BASE_URL = new URL(process.env.API_BASE_URL || 'http://localhost:5000');

// Security headers via Helmet
app.use(helmet({
  contentSecurityPolicy: false // fine-tune as needed in production
}));

// Basic static serving
app.use(express.json());
app.use(express.static(path.join(__dirname)));

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

// Catch-all to serve index for SPA-like behavior
app.get('*', (req, res) => {
  const filePath = path.join(__dirname, 'index.html');
  res.sendFile(filePath);
});

app.listen(PORT, () => {
  console.log(`Static server running on http://localhost:${PORT}`);
});
