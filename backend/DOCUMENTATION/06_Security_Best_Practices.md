# Step 5: Security Guide & Best Practices

This guide covers all security aspects of the VoloLeads backend and how to maintain them.

---

## Table of Contents

1. [API Key Security](#api-key-security)
2. [Rate Limiting](#rate-limiting)
3. [Input Validation](#input-validation)
4. [Data Protection](#data-protection)
5. [GDPR Compliance](#gdpr-compliance)
6. [Common Security Issues](#common-security-issues)
7. [Production Checklist](#production-checklist)

---

## API Key Security

### Environment Variables (CRITICAL)

**Never do this:**
```javascript
// ❌ WRONG - Exposing API key in code
const apiKey = 'sk_live_abc123def456';

// ❌ WRONG - In response to client
res.json({ apiKey: process.env.WEB3FORMS_API_KEY });

// ❌ WRONG - Committed to Git
// .env file pushed to repository
```

**Always do this:**
```javascript
// ✅ CORRECT - Use environment variables
const apiKey = process.env.WEB3FORMS_API_KEY;

// ✅ CORRECT - Server-side only
await fetch('https://api.web3forms.com/submit', {
  method: 'POST',
  body: JSON.stringify({
    api_key: apiKey, // Client never sees this
    // ...
  })
});
```

### Setup Instructions

**Local Development:**
```bash
# Create .env file
cp .env.example .env

# Add your keys (never commit this)
echo "WEB3FORMS_API_KEY=sk_test_your_key_here" >> .env

# Add to .gitignore (should already be there)
echo ".env" >> .gitignore
```

**Production Deployment:**
```bash
# Set environment variables via hosting provider
# DO NOT commit .env to production repository

# Example with Heroku
heroku config:set WEB3FORMS_API_KEY=sk_live_...
heroku config:set CONTACT_EMAIL=your-email@example.com
heroku config:set JWT_SECRET=$(openssl rand -base64 32)
```

### Rotating Keys

When to rotate:
- Quarterly as security best practice
- Immediately if key is compromised
- Before deploying to new environment
- When team member leaves

How to rotate:
```bash
# 1. Generate new key from provider
# 2. Update environment variable
# 3. Restart application
# 4. Verify emails are sending
# 5. Delete old key from provider
```

---

## Rate Limiting

### Current Configuration

**Contact Form Endpoint:**
```javascript
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,    // 1 hour
  max: 3,                       // 3 requests max
  message: 'Too many submissions'
});
router.post('/contact-form', contactLimiter, submitContactForm);
```

**Visitor Tracking Endpoint:**
```javascript
const visitorLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,    // 1 hour
  max: 100,                     // 100 requests max
  message: 'Too many events'
});
router.post('/visitors', visitorLimiter, trackVisitorEvent);
```

### Why These Limits?

- **Contact Form (3/hour):** Prevent spam and abuse
- **Visitor Tracking (100/hour):** Allow normal browsing while preventing log flooding

### Adjusting Limits

If you need different limits:

```javascript
// Less strict (for testing)
max: 10

// More strict (for high-traffic site)
max: 1

// Change time window
windowMs: 60 * 60 * 1000  // 1 hour
windowMs: 24 * 60 * 60 * 1000  // 1 day
```

### Monitoring Rate Limits

Check logs for rate limit violations:
```bash
# Watch for "Too many submissions" errors
npm run dev | grep "429"

# Or manually test
for i in {1..5}; do curl -X POST http://localhost:5000/api/contact-form ...; done
# First 3 succeed, 4th fails with 429
```

---

## Input Validation

### What We Validate

**Email Field:**
```javascript
// Server-side validation (required)
if (!isValidEmail(email)) {
  return res.status(400).json({ 
    success: false, 
    message: 'Invalid email format' 
  });
}

// Regex used
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
```

**Phone Field:**
```javascript
// Server-side validation (required)
if (!validatePhone(phone)) {
  return res.status(400).json({ 
    success: false, 
    message: 'Invalid phone format' 
  });
}

// Must be 10+ digits
const digitsOnly = phone.replace(/\D/g, '');
if (digitsOnly.length < 10) return false;
```

**Service Enum:**
```javascript
// Only allow specific values
const validServices = ['Basic', 'Standard', 'Premium'];
if (!validServices.includes(service)) {
  return res.status(400).json({ 
    success: false, 
    message: 'Invalid service type' 
  });
}
```

### Common Validation Mistakes

❌ **Don't:**
```javascript
// Only validate on frontend
if (email.includes('@')) {
  // Frontend validation can be bypassed!
  submitForm();
}

// Trust user input directly
const message = req.body.message; // Might contain injection

// Skip validation for optional fields
const company = req.body.company; // Could have XSS payload
```

✅ **Do:**
```javascript
// Always validate on backend
const isValidEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

// Sanitize all input
const message = req.body.message?.trim().substring(0, 2000) || '';

// Validate all fields, optional or not
const company = req.body.company?.trim() || '';
```

---

## Data Protection

### IP Address Hashing

**Why hash IPs?**
- GDPR compliance - cannot be reversed
- Privacy protection - cannot identify individuals
- Security - anonymous analytics

**How it works:**
```javascript
// In helpers.js
const hashIP = (ipAddress) => {
  const salt = process.env.HASH_SALT || 'default-salt';
  return crypto
    .createHmac('sha256', salt)
    .update(ipAddress)
    .digest('hex');
};

// Usage in controller
const clientIP = getClientIP(req);
const visitorHash = hashIP(clientIP); // Store this, not raw IP
```

**Important:** Your `HASH_SALT` must:
- Be strong and unique
- Never change (visitors won't match after change)
- Be different per environment (dev/staging/prod)
- Never be committed to Git

Generate a strong salt:
```bash
openssl rand -base64 32
# Example: lq8j7L8q9L8q9L8q9L8q9L8q9L8q9L8q9L8q9L8q9L8q=
```

### User-Agent Truncation

**Never store full user-agent strings:**
```javascript
// ❌ Wrong - Contains too much info
const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'; // Might contain personal info

// ✅ Correct - Truncate to 256 chars
const userAgentShort = userAgent.substring(0, 256);

// ✅ Better - Extract browser/OS only
const { browser, os } = parseUserAgent(userAgent);
// Result: { browser: 'Chrome', os: 'Windows' }
```

### Data at Rest Encryption

**Contact form submissions:**
```javascript
// Currently: Stored as-is
// TODO: Implement encryption for production
// Options:
// 1. MongoDB field-level encryption
// 2. Application-level encryption
// 3. HSM (Hardware Security Module)

// For now, ensure:
const form = new ContactForm({
  name: sanitized.name,
  email: sanitized.email,
  // Mark PII fields
  // Consider field-level access control
});
```

---

## GDPR Compliance

### Data Collection Rules

**What we collect:**
- ✅ Contact form: name, email, phone, company (with consent)
- ✅ Visitor tracking: hashed IP, browser, OS, page URLs

**What we don't collect:**
- ❌ Raw IP addresses (hashed instead)
- ❌ Full user-agent strings (parsed to browser/OS)
- ❌ Personal identifying information (no PII without consent)
- ❌ Cookies with personal data

### Data Retention Policy

**Contact Forms:**
- No automatic deletion (business requirement)
- Manual deletion available
- GDPR erasure endpoint: `DELETE /api/contact-forms/:id`

**Visitor Events:**
- Auto-delete after 180 days (TTL index on MongoDB)
- Manually accessible for GDPR request
- GDPR erasure endpoint: `DELETE /api/visitors/:visitorHash`

### Implementing Data Deletion

**Delete all events for a visitor (GDPR Right to Erasure):**
```bash
# Get visitor hash (from analytics)
HASH="a1b2c3d4e5f6..."

# Delete all their events
curl -X DELETE http://localhost:5000/api/visitors/$HASH \
  -H "Authorization: Bearer JWT_TOKEN"
```

**Delete specific contact form:**
```bash
# Get form ID
FORM_ID="507f1f77bcf86cd799439011"

# Delete it
curl -X DELETE http://localhost:5000/api/contact-forms/$FORM_ID \
  -H "Authorization: Bearer JWT_TOKEN"
```

### Privacy Policy Updates

Your privacy policy must state:
- What data you collect
- How you use it
- How long you keep it
- How users can access it
- How users can delete it

**Example text:**
```
"We collect visitor analytics including:
- Anonymized IP address (hashed, cannot be reversed)
- Browser and operating system information
- Pages visited and time spent
- Page referrers and exit events

This data is automatically deleted after 180 days.

You can request deletion of all your data by contacting privacy@vololeads.com.
```

---

## Common Security Issues

### 1. Exposing Provider Errors

**Problem:**
```javascript
// ❌ Wrong - exposes Web3Forms error to client
const response = await fetch('https://api.web3forms.com/submit', { ... });
if (!response.ok) {
  const error = await response.json();
  return res.json(error); // Client sees provider details!
}
```

**Solution:**
```javascript
// ✅ Correct - generic error message
const response = await fetch('https://api.web3forms.com/submit', { ... });
if (!response.ok) {
  logger.error(`Web3Forms error: ${await response.text()}`);
  return res.status(500).json({
    success: false,
    message: 'Failed to submit form' // Generic message
  });
}
```

### 2. SQL/NoSQL Injection

**Problem:**
```javascript
// ❌ Wrong - injection vulnerability (if using SQL)
db.query(`SELECT * FROM users WHERE email = '${req.body.email}'`);

// ❌ Wrong - MongoDB injection
db.collection('users').find({
  email: req.body.email // Might contain operators
});
```

**Solution:**
```javascript
// ✅ Correct - use Mongoose (prevents injection)
const user = await User.findOne({ email: req.body.email });

// ✅ Correct - sanitize before query
const email = req.body.email?.trim().toLowerCase();
const user = await User.findOne({ email });
```

### 3. CORS Misconfiguration

**Problem:**
```javascript
// ❌ Wrong - allows any origin
app.use(cors());

// ❌ Wrong - hardcoded domain
app.use(cors({
  origin: 'http://localhost:3000'
}));
```

**Solution:**
```javascript
// ✅ Correct - controlled origin from env
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### 4. Logging Sensitive Data

**Problem:**
```javascript
// ❌ Wrong - logs entire request with passwords
logger.info('Form submitted:', req.body);

// ❌ Wrong - logs authentication token
logger.error('Auth failed:', req.headers.authorization);
```

**Solution:**
```javascript
// ✅ Correct - log only what's needed
logger.info(`Form submitted: ${req.body.email}`);

// ✅ Correct - don't log tokens
logger.error('Auth failed: Invalid token');
```

---

## Production Checklist

Before deploying to production:

### Security
- [ ] Set `NODE_ENV=production`
- [ ] Generate strong `JWT_SECRET` (32+ chars)
- [ ] Generate strong `HASH_SALT` (32+ chars)
- [ ] Set `WEB3FORMS_API_KEY` (secret key, not public)
- [ ] Update `CORS_ORIGIN` to your domain (https)
- [ ] Enable HTTPS/SSL certificate
- [ ] Verify `.env` is in `.gitignore`
- [ ] Remove `.env` from Git history if accidentally committed

### Database
- [ ] Enable MongoDB authentication
- [ ] Use strong password for DB
- [ ] Enable encryption at rest
- [ ] Set up automated backups
- [ ] Test backup restoration
- [ ] Configure automatic deletion (TTL indexes)

### Monitoring
- [ ] Set up error logging (Sentry, DataDog, etc.)
- [ ] Set up performance monitoring
- [ ] Set up alerts for high error rates
- [ ] Set up alerts for rate limit violations
- [ ] Monitor API response times

### Testing
- [ ] Test contact form with real email
- [ ] Test visitor tracking in production
- [ ] Test rate limiting
- [ ] Test error handling
- [ ] Test CORS from your domain
- [ ] Test GDPR deletion endpoint

### Documentation
- [ ] Update privacy policy
- [ ] Update terms of service
- [ ] Document data retention policies
- [ ] Add security.txt file
- [ ] Document incident response process

---

## Security Incident Response

**If API key is compromised:**

1. **Immediately:**
   - Revoke compromised key from provider
   - Generate new key
   - Update production environment variable
   - Restart application

2. **Within 1 hour:**
   - Review logs for unauthorized activity
   - Check for unusual contact form submissions
   - Notify team

3. **Within 24 hours:**
   - Review all database access logs
   - Audit who accessed the .env file
   - Update security incident log

4. **Follow-up:**
   - Implement key rotation policy
   - Add alerts for API failures
   - Consider using separate keys per environment

---

## Questions?

Refer to:
- Step 1 - API reference for endpoint security
- Step 2 - Getting Started section on environment setup
- Step 4 - Code Style Guide for secure coding patterns
- Step 6 - Verification Checklist

Always prioritize security over convenience!
