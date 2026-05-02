# Backend Implementation Guide

This guide explains how to use the newly implemented contact form and visitor tracking features.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Contact Form Implementation](#contact-form-implementation)
3. [Visitor Tracking Implementation](#visitor-tracking-implementation)
4. [Database Setup](#database-setup)
5. [Security Considerations](#security-considerations)
6. [Troubleshooting](#troubleshooting)

---

## Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install
```

This installs:
- `express-rate-limit` - Rate limiting middleware
- `ua-parser-js` - User agent parsing
- All other required packages

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Update these critical variables:

```env
# Required for contact form
WEB3FORMS_API_KEY=your_api_key_here
CONTACT_EMAIL=your-email@example.com

# Security (generate with: openssl rand -base64 32)
JWT_SECRET=your-generated-secret-here
HASH_SALT=your-generated-salt-here

# Database
DATABASE_URL=mongodb://localhost:27017/vololeads

# Frontend
CORS_ORIGIN=http://localhost:3000
```

### 3. Start the Server

Development:
```bash
npm run dev
```

Production:
```bash
npm start
```

### 4. Verify Setup

Test health endpoint:
```bash
curl http://localhost:5000/api/health
```

---

## Contact Form Implementation

### Overview

The contact form feature securely collects submissions from the website and forwards them to an email provider (Web3Forms).

### Key Components

**Model:** `src/models/ContactForm.js`
- Stores form submissions in MongoDB
- Encrypts sensitive PII before storage
- Implements retention policies

**Controller:** `src/controllers/contactController.js`
- Validates input data
- Checks rate limits
- Integrates with email providers
- Handles errors gracefully

**Route:** `src/routes/contact.js`
- Defines `/contact-form` endpoint
- Applies rate limiting

### How It Works

```
1. Frontend submits form to POST /api/contact-form
   ↓
2. Backend validates all required fields
   ↓
3. Backend checks rate limit (3/hour per IP)
   ↓
4. Backend sanitizes and stores in database
   ↓
5. Backend forwards to Web3Forms (API key kept secret)
   ↓
6. Email is sent to CONTACT_EMAIL
   ↓
7. Return success/error to frontend
```

### Frontend Integration

```javascript
// Example: React/JavaScript
async function submitContactForm(formData) {
  try {
    const response = await fetch('/api/contact-form', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        service: formData.service,
        referral_source: formData.referral_source,
        message: formData.message,
        company: formData.company,
        preferred_date: formData.preferred_date,
        preferred_time: formData.preferred_time,
        preferred_timezone: formData.preferred_timezone,
        referral_source_other: formData.referral_source_other
      })
    });

    const data = await response.json();

    if (data.success) {
      // Show success message
      console.log('Form submitted successfully');
      // Redirect to thank you page
      window.location.href = '/thank-you.html';
    } else {
      // Show error message
      console.error('Error:', data.message);
      alert(`Error: ${data.message}`);
    }
  } catch (error) {
    console.error('Network error:', error);
    alert('Network error. Please try again.');
  }
}
```

### Managing Submissions

**Get All Submissions (admin):**
```bash
curl -X GET http://localhost:5000/api/contact-forms \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Get Single Submission:**
```bash
curl -X GET http://localhost:5000/api/contact-forms/FORM_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Update Status:**
```bash
curl -X PATCH http://localhost:5000/api/contact-forms/FORM_ID/status \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "contacted",
    "notes": "Called on 2026-05-03"
  }'
```

---

## Visitor Tracking Implementation

### Overview

Track visitor behavior across your website (page visits, time spent, exits, etc.) while respecting privacy and GDPR compliance.

### Key Components

**Model:** `src/models/VisitorEvent.js`
- Stores anonymized visitor events
- Auto-deletes data older than 180 days (TTL index)
- Hashes IP addresses for privacy

**Controller:** `src/controllers/visitorController.js`
- Validates and anonymizes visitor data
- Prevents IP address leakage
- Provides analytics aggregation
- Implements GDPR erasure endpoints

**Route:** `src/routes/visitors.js`
- Defines `/visitors` endpoint for tracking
- Defines `/analytics` endpoint for reports
- Implements rate limiting (100 events/hour)

### How It Works

```
1. Frontend sends event via navigator.sendBeacon() or fetch()
   ↓
2. Backend receives POST /api/visitors
   ↓
3. Backend hashes visitor IP (anonymization)
   ↓
4. Backend parses browser/OS from user agent
   ↓
5. Backend validates rate limit (100/hour)
   ↓
6. Backend stores anonymized event in DB
   ↓
7. Return 202 Accepted (fire-and-forget)
```

### Frontend Integration

```javascript
// Page Visit Tracking
function trackPageVisit() {
  fetch('/api/visitors', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event_type: 'page_visit',
      page_url: location.href,
      page_referrer: document.referrer,
      user_agent: navigator.userAgent,
      timestamp: new Date().toISOString()
    })
  });
}

// Page Exit Tracking (using sendBeacon for reliability)
function trackPageExit(timeSpent) {
  const data = JSON.stringify({
    event_type: 'page_exit',
    page_url: location.href,
    time_spent_seconds: timeSpent,
    timestamp: new Date().toISOString()
  });

  if (navigator.sendBeacon) {
    navigator.sendBeacon('/api/visitors', data);
  } else {
    // Fallback to fetch
    fetch('/api/visitors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: data,
      keepalive: true
    });
  }
}

// Track page exit when leaving
let pageStartTime = Date.now();
window.addEventListener('beforeunload', () => {
  const timeSpent = Math.round((Date.now() - pageStartTime) / 1000);
  trackPageExit(timeSpent);
});

// Track on page load
document.addEventListener('DOMContentLoaded', trackPageVisit);
```

### Viewing Analytics

**Get All Events (admin):**
```bash
curl -X GET "http://localhost:5000/api/visitors?limit=100" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Get Analytics Dashboard:**
```bash
curl -X GET "http://localhost:5000/api/analytics" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**GDPR Data Deletion:**
```bash
curl -X DELETE http://localhost:5000/api/visitors/VISITOR_HASH \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Database Setup

### MongoDB Collections

The backend creates two main collections:

#### 1. Contact Forms

```javascript
{
  _id: ObjectId,
  name: String,
  email: String,
  phone: String,
  company: String,
  service: String (Basic|Standard|Premium),
  quantity: String,
  preferredDate: Date,
  preferredTime: String,
  preferredTimezone: String,
  referralSource: String,
  referralSourceOther: String,
  message: String,
  ipAddress: String,
  userAgent: String,
  source: String (website|app|other),
  status: String (new|contacted|converted|spam),
  notes: String,
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `email` - For duplicate checking
- `createdAt` - For sorting/filtering
- `status` - For filtering by status
- `ipAddress` - For rate limiting

#### 2. Visitor Events

```javascript
{
  _id: ObjectId,
  eventType: String (page_visit|page_exit|button_click|etc),
  visitorHash: String,
  pageUrl: String,
  pageReferrer: String,
  userAgentShort: String,
  browser: String,
  os: String,
  timeSpentSeconds: Number,
  customData: Mixed,
  timestamp: Date (expires after 180 days)
}
```

**Indexes:**
- `visitorHash` + `timestamp` - For visitor analytics
- `eventType` + `timestamp` - For event filtering
- `pageUrl` + `timestamp` - For page analytics
- TTL index on `timestamp` - Auto-deletes old events

### Local MongoDB Setup

**Mac (using Homebrew):**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Docker:**
```bash
docker run -d \
  --name mongodb \
  -p 27017:27017 \
  -v mongodb_data:/data/db \
  mongo:latest
```

**Using Docker Compose:**
```bash
docker-compose up
```

### Verify Connection

```bash
mongosh "mongodb://localhost:27017/vololeads"
```

---

## Security Considerations

### 1. API Key Management

Never commit API keys to version control:

```bash
# Generate strong secrets
openssl rand -base64 32
```

**Do:**
- Store keys in `.env` (local) and environment variables (production)
- Rotate keys regularly
- Use different keys for dev/staging/production

**Don't:**
- Commit `.env` to Git
- Use same keys across environments
- Share keys via Slack/email

### 2. PII Protection

**What we do:**
- Hash visitor IPs (cannot be reversed)
- Truncate user agent strings (no personal data)
- Store contact form data encrypted at rest
- Auto-delete visitor data after 180 days
- Never send raw data to third parties

**What frontend should do:**
- Don't send PII to visitor tracking
- Get explicit consent before tracking
- Honor "Do Not Track" headers
- Show privacy policy

### 3. Rate Limiting

**Contact Form:** 3 submissions/hour per IP
- Prevents spam
- Prevents abuse
- IP detection works behind proxies

**Visitor Tracking:** 100 events/hour per IP
- Prevents log flooding
- Still returns 202 (doesn't break frontend)

### 4. CORS Security

Only your frontend domain can access the API:

```env
CORS_ORIGIN=https://vololeads.com
```

### 5. Authentication

Admin endpoints require JWT token:

```bash
# Get token via login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "SecurePassword123"
  }'

# Use token in requests
curl -H "Authorization: Bearer TOKEN_HERE" http://localhost:5000/api/contact-forms
```

---

## Troubleshooting

### Contact Form Not Sending Emails

**Check:**
1. Is `WEB3FORMS_API_KEY` set in `.env`?
2. Is `CONTACT_EMAIL` valid?
3. Can you test Web3Forms API directly?

```bash
curl -X POST https://api.web3forms.com/submit \
  -H "Content-Type: application/json" \
  -d '{
    "api_key": "YOUR_API_KEY",
    "subject": "Test",
    "message": "Test message",
    "to_email": "your-email@example.com"
  }'
```

### Rate Limit Issues

**Contact form blocked:**
- Wait 1 hour or use different IP
- Check if IP behind proxy (use `X-Forwarded-For`)

**Visitor tracking events not tracking:**
- Check browser console for errors
- Verify CORS_ORIGIN matches frontend domain
- Check rate limit (100/hour max)

### Database Connection Errors

```
Error: connect ECONNREFUSED 127.0.0.1:27017
```

**Fix:**
```bash
# Check if MongoDB is running
pgrep mongod

# Start MongoDB
brew services start mongodb-community

# Or use Docker
docker run -d -p 27017:27017 mongo:latest
```

### "Invalid token" Errors

**Issue:** Auth token expired or invalid

**Fix:**
1. Login again to get new token
2. Check token format: `Authorization: Bearer TOKEN`
3. Verify JWT_SECRET hasn't changed

### Missing Fields Error

**Issue:** Contact form submission returns "Missing required fields"

**Frontend fix:**
```javascript
// Ensure all required fields are present
const required = ['name', 'email', 'phone', 'service', 'referral_source'];
for (const field of required) {
  if (!formData[field]) {
    console.error(`Missing required field: ${field}`);
    return;
  }
}
```

### CORS Errors in Browser

**Error:** "Access to XMLHttpRequest has been blocked by CORS policy"

**Fix:**
1. Check CORS_ORIGIN in `.env` matches frontend URL
2. Restart server after changing CORS_ORIGIN
3. Clear browser cache

```env
# For localhost testing
CORS_ORIGIN=http://localhost:3000

# For production
CORS_ORIGIN=https://vololeads.com
```

### IP Hashing Not Working

**Issue:** Same visitor hash not appearing in analytics

**Check:**
1. Is `HASH_SALT` set consistently?
2. Are all requests coming from same IP?
3. Check server logs for hashing errors

```bash
# Generate consistent salt (don't change in production!)
HASH_SALT=$(openssl rand -base64 32)
echo $HASH_SALT
```

---

## Development Workflow

### 1. Local Testing

```bash
# Terminal 1: Start MongoDB
docker-compose up

# Terminal 2: Start backend
npm run dev

# Terminal 3: Test endpoints
curl -X POST http://localhost:5000/api/contact-form \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","phone":"+11234567890","service":"Premium","referral_source":"LinkedIn"}'
```

### 2. Check Logs

```bash
# View MongoDB logs
docker-compose logs mongodb

# View backend logs
npm run dev
```

### 3. Database Inspection

```bash
# Connect to MongoDB
mongosh "mongodb://localhost:27017/vololeads"

# View contact forms
db.contact_forms.find().limit(5)

# View visitor events
db.visitor_events.find().limit(5)

# Check collections
db.getCollectionNames()
```

### 4. Testing Email Integration

```javascript
// Test Web3Forms endpoint directly
const testWeb3Forms = async () => {
  const response = await fetch('https://api.web3forms.com/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: process.env.WEB3FORMS_API_KEY,
      subject: 'Test',
      message: 'Test message',
      to_email: process.env.CONTACT_EMAIL
    })
  });
  console.log(await response.json());
};
```

---

## Next Steps

1. **Frontend Integration:**
   - Add contact form to your website
   - Implement visitor tracking script
   - Test end-to-end flow

2. **Production Deployment:**
   - Update environment variables
   - Enable HTTPS
   - Set up monitoring
   - Configure database backups

3. **Advanced Features:**
   - Add CAPTCHA to contact form
   - Implement email notifications
   - Add form analytics
   - Create custom event types

---

## Support

For issues or questions:
1. Check this guide's troubleshooting section
2. Review `ENDPOINTS.md` for API reference
3. Check server logs: `npm run dev`
4. Contact the backend team
