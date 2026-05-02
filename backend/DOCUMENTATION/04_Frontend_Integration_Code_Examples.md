# VoloLeads Backend API Implementation Guide

This document describes the backend API endpoints that the frontend expects. **Keep your API keys and sensitive logic in your private backend repository only.**

## Frontend → Backend Flow

The frontend makes requests to:
- `POST /api/contact-form` (contact form submissions)
- `POST /api/visitors` (visitor tracking events)

Both should be implemented in your **private backend** and handle sensitive operations server-side.

---

## 1. `POST /api/contact-form`

### Purpose
Accept contact form submissions from the frontend and forward them securely to your email provider (Web3Forms, SendGrid, Mailgun, etc.) **without exposing the API key to the client**.

### Frontend Request Body
```json
{
  "name": "Jane Smith",
  "company": "XYZ Home Buyers LLC",
  "email": "jane@company.com",
  "phone": "+1 (555) 000-0000",
  "service": "Premium",
  "quantity": "1 Seat",
  "preferred_date": "2026-05-15",
  "preferred_time": "14:00",
  "preferred_timezone": "EST",
  "referral_source": "LinkedIn",
  "referral_source_other": "",
  "message": "I'm interested in scaling my outreach..."
}
```

### Backend Responsibilities
1. **Validate & sanitize** all input fields
   - Required: `name`, `email`, `phone`, `service`, `referral_source`
   - Optional: `company`, `message`, `preferred_date`, `preferred_time`
   - Reject if any required field is missing/invalid
   
2. **Format & enrich** the submission
   - Add timestamp: `ISO 8601` format
   - Add source: `website`
   - Add IP/user-agent for security audit trail (optional but recommended)
   
3. **Forward to provider** using your **secret API key** (stored in `process.env.WEB3FORMS_API_KEY` or similar)
   - Do NOT send the raw form data; map to provider's expected schema
   - Example for Web3Forms:
   ```js
   const web3formsPayload = {
     api_key: process.env.WEB3FORMS_API_KEY,
     from_name: req.body.name,
     from_email: req.body.email,
     subject: `VoloLeads Contact: ${req.body.service} - ${req.body.name}`,
     message: `
       Service: ${req.body.service}
       Phone: ${req.body.phone}
       ...
     `
   };
   ```
   
4. **Handle errors gracefully**
   - If provider fails: log error, return 500 with generic message ("error submitting form")
   - Do NOT expose provider errors to client
   
5. **Optionally store locally** in your database for record-keeping/analytics
   - Encrypt PII before storing
   - Implement retention policy (e.g., delete after 90 days)
   
6. **Return response** to frontend
   ```json
   { "success": true, "message": "Form submitted" }
   ```
   OR
   ```json
   { "success": false, "error": "Failed to submit form" }
   ```

### Security Notes
- ✅ **Never expose the Web3Forms/Mailgun/SendGrid API key in client-side code**
- ✅ Validate email format server-side (don't trust client-side HTML5 validation alone)
- ✅ Implement rate limiting: allow max 3 submissions per IP per hour
- ✅ Add CAPTCHA/reCAPTCHA v3 on the backend (or frontend + server verification)
- ✅ Log all submissions with timestamp for compliance/audits

---

## 2. `POST /api/visitors`

### Purpose
Accept visitor tracking data and store it securely. **Do NOT collect PII in the frontend cookie banner** — the banner only asks for consent. Visitor tracking should happen server-side.

### Frontend Request Body
```json
{
  "event_type": "page_visit",
  "visitor_ip": "203.0.113.42",
  "page_url": "https://vololeads.com",
  "page_referrer": "https://google.com",
  "user_agent": "Mozilla/5.0...",
  "timestamp": "2026-05-02T14:30:00Z"
}
```

**Note**: The frontend currently does NOT collect PII in the banner (as per the GDPR fix). If you want to collect names/emails, add an opt-in form on the site (separate from the cookie banner) that submits to this endpoint.

### Backend Responsibilities
1. **Validate input**
   - Required: `event_type`, `timestamp`
   - Optional: other fields
   
2. **Sanitize & anonymize**
   - Hash or truncate IPs for privacy
   - Do NOT store raw user-agent strings; extract browser/OS only
   - Discard anything that looks like PII unless explicitly consented
   
3. **Store in database**
   - Encrypt sensitive fields at rest
   - Index by date for analytics queries
   - Implement row-level access control (only internal team can query)
   
4. **Implement retention policy**
   - Delete events older than 180 days automatically
   - Provide endpoint to delete all events for a given IP (GDPR erasure)
   
5. **Return 202 Accepted** (fire-and-forget via `navigator.sendBeacon`)
   ```json
   { "received": true }
   ```

### Usage: Page Exit Tracking
The frontend sends page exit events via `navigator.sendBeacon` when the user leaves:
```js
navigator.sendBeacon('/api/visitors', JSON.stringify({
  event_type: 'page_exit',
  time_spent_seconds: 45,
  page_url: location.href,
  timestamp: new Date().toISOString()
}));
```

### Security Notes
- ✅ **Do NOT store raw IPs**: hash them with a salt unique to your deployment
- ✅ Implement rate limiting: allow max 100 events per IP per hour
- ✅ Add CORS headers restricting to your domain(s)
- ✅ Implement data retention policy (auto-delete old events)
- ✅ Provide GDPR data access & deletion endpoints (`GET/DELETE /api/visitors/{hash_id}`)

---

## 3. Example Express Backend (Minimal)

```js
// backend/routes/contact.js
const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');

// Rate limiter: 3 submissions per IP per hour
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: 'Too many contact form submissions'
});

router.post('/contact-form', contactLimiter, async (req, res) => {
  try {
    // Validate required fields
    const { name, email, phone, service, referral_source } = req.body;
    if (!name || !email || !phone || !service || !referral_source) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Forward to Web3Forms (or your provider)
    const payload = {
      api_key: process.env.WEB3FORMS_API_KEY,
      from_name: name,
      from_email: email,
      subject: `VoloLeads: ${service} - ${name}`,
      message: `
        Name: ${name}
        Email: ${email}
        Phone: ${phone}
        Company: ${req.body.company || 'N/A'}
        Service: ${service}
        Referral: ${referral_source}
        Message: ${req.body.message || '(no message)'}
      `,
      to_email: process.env.CONTACT_EMAIL,
      redirect: process.env.THANK_YOU_PAGE
    };

    const response = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      console.error('Web3Forms error:', await response.text());
      return res.status(500).json({ error: 'Form submission failed' });
    }

    // Optionally store in your DB for CRM/analytics
    // await ContactForm.create({ ...req.body, timestamp: new Date() });

    res.json({ success: true, message: 'Form submitted' });
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
```

```js
// backend/routes/visitors.js
const express = require('express');
const router = express.Router();

router.post('/visitors', async (req, res) => {
  try {
    // Validate
    const { event_type, timestamp } = req.body;
    if (!event_type || !timestamp) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    // Sanitize IP (hash it)
    const ip = hashIP(req.ip);

    // Store in database
    // await VisitorEvent.create({
    //   event_type,
    //   ip,
    //   page_url: req.body.page_url,
    //   user_agent_short: extractBrowser(req.body.user_agent),
    //   timestamp: new Date(req.body.timestamp)
    // });

    // Return 202 (fire-and-forget)
    res.status(202).json({ received: true });
  } catch (error) {
    console.error('Visitor tracking error:', error);
    res.status(202).json({ received: true }); // Still 202 so frontend doesn't retry
  }
});

module.exports = router;
```

---

## 4. Environment Variables (Private Backend Only)

**Never commit these to version control.**

```env
# .env (backend only)
WEB3FORMS_API_KEY=your_secret_key_here
CONTACT_EMAIL=syed@vololeads.com
THANK_YOU_PAGE=https://vololeads.com/thank-you.html
CORS_ORIGIN=https://vololeads.com
NODE_ENV=production
```

---

## 5. GDPR & Privacy Compliance Checklist

- [ ] Form submissions encrypted at rest
- [ ] Visitor events anonymized (hashed IPs, no user-agent strings)
- [ ] 180-day auto-deletion policy for old events
- [ ] `/api/visitors/{user_id}/export` endpoint for data access
- [ ] `/api/visitors/{user_id}/delete` endpoint for erasure requests
- [ ] Privacy policy updated with what data you collect
- [ ] Cookie consent banner tested and working (frontend ✓ done)
- [ ] Third-party scripts (Crisp, analytics) only loaded after explicit consent (frontend ✓ done)

---

## 6. Testing Locally

```bash
# Test contact form submission
curl -X POST http://localhost:3000/api/contact-form \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "phone": "+1234567890",
    "service": "Premium",
    "referral_source": "LinkedIn",
    "message": "Test"
  }'

# Test visitor event
curl -X POST http://localhost:3000/api/visitors \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "page_visit",
    "page_url": "https://vololeads.com",
    "timestamp": "2026-05-02T14:30:00Z"
  }'
```

---

## Summary

| Endpoint | Method | Frontend → Backend | Backend Responsibility |
|----------|--------|-------------------|----------------------|
| `/api/contact-form` | POST | Contact form data | Validate, proxy to Web3Forms (API key), store locally, return success/error |
| `/api/visitors` | POST | Visitor tracking event | Validate, anonymize, store, return 202 |

All sensitive operations (API key handling, PII storage, GDPR erasure) happen server-side only.
