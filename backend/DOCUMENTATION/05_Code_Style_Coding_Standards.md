# Code Style & Standards Guide

This document outlines the coding conventions, patterns, and best practices used in the VoloLeads backend.

---

## Table of Contents

1. [File Organization](#file-organization)
2. [Naming Conventions](#naming-conventions)
3. [Code Structure](#code-structure)
4. [Error Handling](#error-handling)
5. [Comments & Documentation](#comments--documentation)
6. [Testing](#testing)
7. [Security Practices](#security-practices)

---

## File Organization

### Directory Structure

```
src/
├── controllers/      # Business logic (one per feature)
├── routes/           # API endpoints (one per feature)
├── models/           # Database schemas
├── middleware/       # Express middleware
├── utils/            # Helper functions & utilities
├── config/           # Configuration files
├── constants/        # Constants & enums
└── __tests__/        # Test files
```

### File Naming

- **Controllers:** `featureController.js` (e.g., `contactController.js`)
- **Routes:** `feature.js` (e.g., `contact.js`)
- **Models:** `Feature.js` (e.g., `ContactForm.js`)
- **Middleware:** `feature.js` (e.g., `authenticate.js`)
- **Utils:** `feature.js` (e.g., `helpers.js`)

---

## Naming Conventions

### Variables & Functions

**camelCase** for variables and functions:
```javascript
// Good
const contactForm = { name: 'John', email: 'john@example.com' };
function submitContactForm() { }
const getUserEmail = (user) => user.email;

// Avoid
const contact_form = { };
function Submit_Contact_Form() { }
const get_user_email = (user) => user.email;
```

### Constants

**UPPER_SNAKE_CASE** for constants:
```javascript
// Good
const MAX_SUBMISSIONS_PER_HOUR = 3;
const VALID_SERVICES = ['Basic', 'Standard', 'Premium'];
const DEFAULT_TIMEZONE = 'UTC';

// Avoid
const maxSubmissionsPerHour = 3;
const MAXSUBMISSIONS = 3;
```

### Classes & Schemas

**PascalCase** for classes and model names:
```javascript
// Good
class Logger { }
const ContactFormSchema = new mongoose.Schema();
const User = mongoose.model('User', userSchema);

// Avoid
class logger { }
const contactFormSchema = new mongoose.Schema();
const user = mongoose.model('user', userSchema);
```

### Boolean Variables

Prefix with `is` or `has`:
```javascript
// Good
const isValid = true;
const hasError = false;
const isAuthenticated = !!token;

// Avoid
const valid = true;
const error = false;
const authenticated = !!token;
```

---

## Code Structure

### Controllers

**Pattern:** Logic → Validation → Processing → Response

```javascript
exports.submitContactForm = async (req, res) => {
  try {
    // 1. Extract and validate input
    const { name, email, phone, service, referral_source } = req.body;
    
    if (!name || !email || !phone || !service || !referral_source) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // 2. Business logic / Processing
    const sanitized = sanitizeContactForm(req.body);
    const clientIP = getClientIP(req);
    const contactForm = new ContactForm({ ...sanitized, ipAddress: clientIP });
    await contactForm.save();

    // 3. External integrations
    await forwardToEmailProvider(sanitized);

    // 4. Return success
    return res.status(201).json({
      success: true,
      message: 'Form submitted successfully',
      data: { id: contactForm._id }
    });
  } catch (error) {
    logger.error(`Error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
```

### Routes

**Pattern:** Middleware → Handler → Response

```javascript
const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { submitContactForm } = require('../controllers/contactController');

// Middleware stack
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: 'Too many submissions'
});

// Routes
router.post('/contact-form', contactLimiter, submitContactForm);
router.get('/contact-forms', authenticate, getContactForms);
router.patch('/contact-forms/:id/status', authenticate, updateStatus);

module.exports = router;
```

### Models

**Pattern:** Schema → Indexes → Export

```javascript
const mongoose = require('mongoose');

const contactFormSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    }
  },
  {
    timestamps: true,
    collection: 'contact_forms'
  }
);

// Add indexes for frequently queried fields
contactFormSchema.index({ email: 1 });
contactFormSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ContactForm', contactFormSchema);
```

---

## Error Handling

### Response Format

Always return consistent error format:

```javascript
// Error response
{
  success: false,
  message: "User-friendly error message",
  status: 400
}

// Success response
{
  success: true,
  message: "Operation successful",
  data: { /* response data */ }
}
```

### HTTP Status Codes

Use correct status codes:

```javascript
// Validation error
res.status(400).json({ success: false, message: 'Invalid input' });

// Not authenticated
res.status(401).json({ success: false, message: 'Token required' });

// Forbidden
res.status(403).json({ success: false, message: 'Access denied' });

// Not found
res.status(404).json({ success: false, message: 'Resource not found' });

// Rate limited
res.status(429).json({ success: false, message: 'Too many requests' });

// Server error
res.status(500).json({ success: false, message: 'Internal server error' });
```

### Error Logging

Always log errors for debugging:

```javascript
// Good
try {
  const form = await ContactForm.findById(id);
  if (!form) {
    return res.status(404).json({ success: false, message: 'Not found' });
  }
} catch (error) {
  logger.error(`Database error: ${error.message}`);
  res.status(500).json({ success: false, message: 'Server error' });
}

// Avoid
try {
  const form = await ContactForm.findById(id);
} catch (error) {
  // No error logging!
  res.status(500).json({ success: false, message: 'Error' });
}
```

---

## Comments & Documentation

### When to Comment

Add comments for **why**, not **what**:

```javascript
// Good: Explains the reason
// Rate limit per IP to prevent spam submission abuse
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3
});

// Avoid: Redundant, the code is clear
// Create a rate limiter
const limiter = rateLimit({ });

// Good: Explains non-obvious logic
// Hash IP with salt to comply with GDPR (cannot be reversed)
const visitorHash = hashIP(clientIP);

// Avoid: Obvious from code
// Create hash
const hash = crypto.createHmac('sha256', salt).update(ip).digest('hex');
```

### Function Documentation

Use JSDoc for public functions:

```javascript
/**
 * Validate email address format
 * @param {string} email - The email to validate
 * @returns {boolean} True if valid email format
 */
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};
```

### Code Examples in Comments

```javascript
// Bad example in code comment:
// hashIP('192.168.1.1') // Returns: 'a1b2c3...'

// Better way: Put in JSDoc
/**
 * @example
 * const hash = hashIP('192.168.1.1');
 * // hash = 'a1b2c3d4e5f6...'
 */
```

---

## Testing

### Unit Tests Pattern

```javascript
const ContactForm = require('../models/ContactForm');
const { submitContactForm } = require('../controllers/contactController');

describe('Contact Form Controller', () => {
  test('should validate required fields', async () => {
    const req = { body: { name: 'John' } }; // Missing fields
    const res = { 
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    await submitContactForm(req, res);
    
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: expect.stringContaining('required')
    });
  });

  test('should save valid form submission', async () => {
    const validData = {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+11234567890',
      service: 'Premium',
      referral_source: 'LinkedIn'
    };
    
    const req = { body: validData };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    await submitContactForm(req, res);
    
    expect(res.status).toHaveBeenCalledWith(201);
  });
});
```

### Testing Middleware

```javascript
const { authenticate } = require('../middleware/authenticate');

describe('Authentication Middleware', () => {
  test('should reject missing token', (done) => {
    const req = { headers: {} };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    const next = jest.fn();
    
    authenticate(req, res, next);
    
    expect(res.status).toHaveBeenCalledWith(401);
    done();
  });
});
```

---

## Security Practices

### Input Validation

Always validate on the server side:

```javascript
// Good: Server-side validation
exports.submitForm = async (req, res) => {
  const { email, phone } = req.body;
  
  if (!isValidEmail(email)) {
    return res.status(400).json({ success: false });
  }
  if (!validatePhone(phone)) {
    return res.status(400).json({ success: false });
  }
  
  // Process valid data
};

// Avoid: Relying on client-side validation
// Frontend might bypass validation
```

### Sanitization

Clean user input before storing:

```javascript
// Good: Sanitize input
const sanitized = {
  name: req.body.name?.trim() || '',
  email: req.body.email?.trim().toLowerCase() || '',
  message: req.body.message?.trim().substring(0, 2000) || ''
};

// Avoid: Store raw input
const form = {
  name: req.body.name,
  email: req.body.email,
  message: req.body.message
};
```

### API Key Management

Never expose API keys:

```javascript
// Good: Keep API key in environment
const apiKey = process.env.WEB3FORMS_API_KEY;
const payload = {
  api_key: apiKey,
  // ...
};
await fetch('https://api.web3forms.com/submit', {
  method: 'POST',
  body: JSON.stringify(payload)
});

// Avoid: Exposing API key in response or logs
res.json({
  success: true,
  apiKey: process.env.WEB3FORMS_API_KEY // NEVER!
});
```

### Rate Limiting

Protect endpoints from abuse:

```javascript
// Good: Apply rate limiting
const limiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: 'Too many requests'
});
router.post('/contact-form', limiter, submitForm);

// Avoid: No protection
router.post('/contact-form', submitForm); // Vulnerable to spam!
```

### Logging Best Practices

```javascript
// Good: Log sensitive info appropriately
logger.info(`Form submitted by ${email}`);
logger.error(`Database error: ${error.message}`);

// Avoid: Logging sensitive data
logger.info(`Form: ${JSON.stringify(req.body)}`); // Logs passwords!
logger.error(`Token: ${token}`); // Logs authentication data!
```

---

## Performance Tips

### Database Queries

```javascript
// Good: Lean queries for read-only access
const forms = await ContactForm.find().lean();

// Avoid: Loading full documents if not needed
const forms = await ContactForm.find(); // Uses more memory

// Good: Limit fields returned
const forms = await ContactForm.find().select('name email status');

// Avoid: Getting all fields
const forms = await ContactForm.find(); // Unnecessary data transfer
```

### Async/Await

```javascript
// Good: Parallel operations
const [forms, total] = await Promise.all([
  ContactForm.find(),
  ContactForm.countDocuments()
]);

// Avoid: Sequential when parallel possible
const forms = await ContactForm.find();
const total = await ContactForm.countDocuments(); // Waits unnecessarily
```

### Caching

```javascript
// Good: Cache frequently accessed data
const validServices = ['Basic', 'Standard', 'Premium'];

// Avoid: Repeated computation
function getServices() {
  return database.query('SELECT * FROM services'); // Repeated DB calls!
}
```

---

## Linting & Code Quality

### Run ESLint

```bash
npm run lint          # Check for issues
npm run lint:fix      # Fix automatically
```

### ESLint Configuration

Already configured in `.eslintrc.json`. Key rules:

- No unused variables
- Consistent indentation (2 spaces)
- Semicolons required
- No var (use const/let)
- Consistent quote style (single quotes)

---

## Example: Well-Structured Feature

### ContactForm Feature

**Model (`models/ContactForm.js`):**
- Clean schema with validation
- Proper indexes for performance
- Collection naming follows convention

**Controller (`controllers/contactController.js`):**
- Input validation first
- Error handling with logging
- Consistent response format
- Proper status codes

**Route (`routes/contact.js`):**
- Rate limiting applied
- Middleware stack clear
- Proper HTTP methods

**Utility (`utils/helpers.js`):**
- Reusable sanitization
- Consistent error handling
- Well-documented functions

---

## Common Mistakes to Avoid

| Mistake | Problem | Fix |
|---------|---------|-----|
| No error handling | App crashes | Wrap in try/catch |
| Logging sensitive data | Security risk | Log safe info only |
| No input validation | Injection attacks | Validate server-side |
| Hardcoded values | Not maintainable | Use constants/env vars |
| No rate limiting | DDoS vulnerability | Add rate limit middleware |
| Exposing API keys | Key theft | Use env variables |
| Mixing concerns | Hard to test | Separate controller/route/model |
| No database indexes | Slow queries | Add indexes for frequent queries |

---

## Checklist for New Features

- [ ] Created controller with error handling
- [ ] Created route with appropriate middleware
- [ ] Created model with validation and indexes
- [ ] Added helper functions to utils if needed
- [ ] Validated all inputs server-side
- [ ] Added rate limiting if needed
- [ ] Tested with manual curl requests
- [ ] Added unit tests
- [ ] Updated ENDPOINTS.md documentation
- [ ] Added JSDoc comments for public functions
- [ ] Reviewed for security issues
- [ ] Verified error messages are user-friendly
- [ ] Checked for hardcoded values

---

## Questions?

Refer to:
1. Existing feature implementation (e.g., contact form)
2. ENDPOINTS.md for API patterns
3. IMPLEMENTATION_GUIDE.md for backend usage
4. Git history for similar features

Maintain consistency with existing code patterns!
