const express = require('express');
const path = require('path');
const helmet = require('helmet');
const app = express();
const PORT = process.env.PORT || 3000;

// Security headers via Helmet
app.use(helmet({
  contentSecurityPolicy: false // fine-tune as needed in production
}));

// Basic static serving
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Simple API stubs (should be implemented in your private backend)
app.post('/api/contact-form', (req, res) => {
  // Frontend expects this route to proxy to your backend or form provider with an API key
  res.status(501).json({ error: 'Not implemented. Proxy to your backend with API key.' });
});

app.post('/api/visitors', (req, res) => {
  // Collect visitor events server-side (securely) in your private backend
  res.status(501).json({ error: 'Not implemented. Send visitor data to your backend.' });
});

// Catch-all to serve index for SPA-like behavior
app.get('*', (req, res) => {
  const filePath = path.join(__dirname, 'index.html');
  res.sendFile(filePath);
});

app.listen(PORT, () => {
  console.log(`Static server running on http://localhost:${PORT}`);
});