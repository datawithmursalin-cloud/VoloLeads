# 🚀 VoloLeads Backend - Quick Start for Web Developers

## What's New?

Your backend now has **two fully implemented API endpoints** ready for the frontend:

1. **POST `/api/contact-form`** - Accept website contact form submissions
2. **POST `/api/visitors`** - Track visitor analytics events

---

## 📖 Documentation Guide

Read these in order:

### 1. **START HERE:** `ENDPOINTS.md`
   - Complete API reference for all endpoints
   - Request/response examples
   - How to test with cURL
   - **Time to read: 10 minutes**

### 2. **IMPLEMENTATION:** `IMPLEMENTATION_GUIDE.md`
   - How to set up locally
   - Frontend integration code samples
   - Database setup instructions
   - Troubleshooting guide
   - **Time to read: 15 minutes**

### 3. **CODE QUALITY:** `CODE_STYLE_GUIDE.md`
   - Coding standards and patterns
   - How to add new features
   - Security best practices
   - Common mistakes to avoid
   - **Time to read: 10 minutes**

### 4. **VERIFICATION:** `IMPLEMENTATION_COMPLETE.md`
   - Full checklist of what's implemented
   - Security verification
   - Testing instructions
   - **Time to read: 5 minutes**

---

## ⚡ Quick Setup (5 minutes)

```bash
# 1. Install dependencies
cd backend
npm install

# 2. Copy environment template
cp .env.example .env

# 3. Edit .env with your values
nano .env
# Add: WEB3FORMS_API_KEY, CONTACT_EMAIL, etc.

# 4. Start the server
npm run dev

# 5. Test an endpoint
curl -X POST http://localhost:5000/api/contact-form \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test",
    "email": "test@example.com",
    "phone": "+11234567890",
    "service": "Premium",
    "referral_source": "LinkedIn"
  }'
```

---

## 📁 What Was Added/Updated

### New Files (Core Features)
```
src/controllers/
  ├── contactController.js       - Contact form business logic
  └── visitorController.js       - Visitor tracking logic

src/models/
  ├── ContactForm.js             - Contact form database schema
  └── VisitorEvent.js            - Visitor event database schema

src/routes/
  ├── contact.js                 - Contact form API endpoint
  └── visitors.js                - Visitor tracking API endpoint
```

### Updated Files (Integration)
```
src/server.js                    - Added new routes
src/utils/helpers.js             - Enhanced with utility functions
src/utils/logger.js              - Added info() method
src/middleware/authenticate.js   - Named exports
package.json                     - Added express-rate-limit
.env.example                     - Added new environment variables
```

### New Documentation
```
ENDPOINTS.md                     - Complete API reference
IMPLEMENTATION_GUIDE.md          - Setup & integration guide
CODE_STYLE_GUIDE.md              - Coding standards
IMPLEMENTATION_COMPLETE.md       - Verification & checklist
README_QUICKSTART.md             - This file!
```

---

## 🔒 Security Built-In

✅ **Rate Limiting**
- Contact form: 3 submissions/hour per IP
- Visitor tracking: 100 events/hour per IP

✅ **Input Validation**
- All fields validated server-side
- Email/phone format checking
- Injection attack prevention

✅ **Privacy Protection**
- IP addresses hashed (cannot be reversed)
- User-agent strings truncated
- Auto-deletion after 180 days (GDPR)

✅ **API Key Protection**
- Never exposed to client
- Stored in environment variables only
- Never committed to Git

---

## 🎯 Frontend Integration

### Contact Form Submission
```javascript
const response = await fetch('/api/contact-form', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: formData.name,
    email: formData.email,
    phone: formData.phone,
    service: formData.service,
    referral_source: formData.referral_source,
    message: formData.message
  })
});

const result = await response.json();
if (result.success) {
  // Show success message
} else {
  // Show error message
}
```

### Visitor Tracking
```javascript
// Track page visit
fetch('/api/visitors', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    event_type: 'page_visit',
    page_url: location.href,
    timestamp: new Date().toISOString()
  })
});

// Track page exit (on beforeunload)
navigator.sendBeacon('/api/visitors', JSON.stringify({
  event_type: 'page_exit',
  time_spent_seconds: 45,
  timestamp: new Date().toISOString()
}));
```

---

## 🧪 Testing Endpoints

### Test Contact Form
```bash
curl -X POST http://localhost:5000/api/contact-form \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Smith",
    "email": "jane@example.com",
    "phone": "+1 (555) 123-4567",
    "service": "Premium",
    "referral_source": "LinkedIn",
    "message": "Interested in pricing"
  }'
```

### Test Visitor Tracking
```bash
curl -X POST http://localhost:5000/api/visitors \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "page_visit",
    "page_url": "https://vololeads.com",
    "timestamp": "2026-05-02T14:30:00Z"
  }'
```

### Test Rate Limiting
```bash
# Run 4 times in quick succession
# First 3 succeed (201), 4th fails (429)
for i in {1..4}; do
  curl -X POST http://localhost:5000/api/contact-form \
    -H "Content-Type: application/json" \
    -d '{"name":"Test","email":"test@example.com","phone":"+11234567890","service":"Premium","referral_source":"LinkedIn"}'
  echo ""
done
```

---

## 📊 Admin Endpoints (Requires Auth)

```bash
# Get all contact forms
curl http://localhost:5000/api/contact-forms \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get visitor analytics
curl http://localhost:5000/api/analytics \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Delete visitor data (GDPR)
curl -X DELETE http://localhost:5000/api/visitors/VISITOR_HASH \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 🛠️ Development Commands

```bash
# Development mode (auto-reload)
npm run dev

# Production mode
npm start

# Run tests
npm test

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix
```

---

## ⚙️ Environment Variables

Required in `.env`:

```env
# Must Change
WEB3FORMS_API_KEY=your_secret_key_here
CONTACT_EMAIL=your-email@example.com
JWT_SECRET=your-generated-secret-here
HASH_SALT=your-generated-salt-here

# Recommended
CORS_ORIGIN=http://localhost:3000
NODE_ENV=development
DATABASE_URL=mongodb://localhost:27017/vololeads
```

---

## 📞 Common Questions

**Q: Where do I get the WEB3FORMS_API_KEY?**  
A: Sign up at https://web3forms.com/ and get your API key

**Q: How do I test locally?**  
A: See "Quick Setup" section or read Step 3

**Q: Is the data encrypted?**  
A: PII is marked for encryption; IPs are hashed (non-reversible)

**Q: What happens after 180 days?**  
A: Visitor events auto-delete (GDPR compliance)

**Q: How do I add new fields to the contact form?**  
A: Update the schema in `src/models/ContactForm.js` and controller

---

## 🚨 Troubleshooting

### Contact form not sending emails
- Check `WEB3FORMS_API_KEY` is set
- Check `CONTACT_EMAIL` is valid
- Check server logs: `npm run dev`

### Rate limit errors
- Wait 1 hour or use different IP/computer
- Rate limits reset hourly

### Database connection errors
- Ensure MongoDB is running: `docker-compose up`
- Check `DATABASE_URL` in `.env`

### CORS errors in browser
- Update `CORS_ORIGIN` to match frontend URL
- Restart server after changes

See Step 3 for more troubleshooting.

---

## 📚 Full Documentation Map

```
Step 0: Overview (this file)
    ↓
Step 1: API Endpoints Reference
Step 2: Getting Started & Setup  
Step 3: Implementation Guide
Step 4: Code Style & Standards
Step 5: Security Guide
Step 6: Verification Checklist
```

---

## ✅ Ready to Code!

The backend is production-ready. Your team can:

1. **Understand what's built** - Read this file
2. **Learn the API** - Read Step 1 (API Reference)
3. **Set up locally** - Follow Step 2 (Getting Started)
4. **Integrate with frontend** - Step 3 has code examples
5. **Write new features** - Follow patterns in Step 4

---

**Status:** ✅ Complete & Production-Ready  
**Last Updated:** 2026-05-02  
**Version:** 1.0.0
