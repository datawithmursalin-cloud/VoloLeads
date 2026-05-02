# VoloLeads Backend API Endpoints

This document provides detailed information about all API endpoints available in the VoloLeads backend. All endpoints are prefixed with `/api`.

---

## Table of Contents

1. [Health Check](#health-check)
2. [Authentication](#authentication)
3. [Users](#users)
4. [Contact Form](#contact-form)
5. [Visitor Tracking](#visitor-tracking)
6. [Error Handling](#error-handling)
7. [Rate Limiting](#rate-limiting)

---

## Health Check

### GET `/health`

Check if the API is running and healthy.

**Authentication:** Not required

**Response (200 OK):**
```json
{
  "success": true,
  "status": "OK",
  "message": "API is healthy",
  "timestamp": "2026-05-02T10:00:00.000Z"
}
```

---

## Authentication

### POST `/auth/register`

Register a new user account.

**Authentication:** Not required

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePassword123"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": "123456",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Email, password, and name are required"
}
```

---

### POST `/auth/login`

Authenticate user and receive JWT token.

**Authentication:** Not required

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePassword123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": "123456",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Response (401 Unauthorized):**
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

---

## Users

### GET `/users`

Get all users (public endpoint for testing).

**Authentication:** Not required

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Users endpoint",
  "users": []
}
```

---

### GET `/users/profile`

Get authenticated user's profile.

**Authentication:** Required (Bearer token)

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "User profile retrieved",
  "user": {
    "id": "123456",
    "email": "john@example.com"
  }
}
```

**Error Response (401 Unauthorized):**
```json
{
  "success": false,
  "message": "Access token required"
}
```

---

## Contact Form

### POST `/contact-form`

Submit a contact form from the website frontend.

**Authentication:** Not required (but rate-limited)

**Request Body:**
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

**Required Fields:**
- `name` - User's full name
- `email` - Valid email address
- `phone` - Phone number with at least 10 digits
- `service` - Service tier (Basic, Standard, Premium)
- `referral_source` - How they heard about you (Google, LinkedIn, Facebook, Twitter, Referral, Other)

**Optional Fields:**
- `company` - Company name
- `quantity` - Number of seats
- `preferred_date` - Preferred meeting date (ISO format)
- `preferred_time` - Preferred meeting time (HH:MM format)
- `preferred_timezone` - Timezone for meeting
- `referral_source_other` - Other referral source details
- `message` - Additional message

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Form submitted successfully",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "email": "jane@company.com"
  }
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Invalid email format"
}
```

**Error Response (429 Too Many Requests):**
```json
{
  "success": false,
  "message": "Too many submissions. Please try again later."
}
```

---

### GET `/contact-forms`

Retrieve all contact forms (admin endpoint).

**Authentication:** Required (Bearer token)

**Query Parameters:**
- `limit` - Number of results per page (default: 50)
- `skip` - Number of results to skip (default: 0)
- `status` - Filter by status (new, contacted, converted, spam)

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Contact forms retrieved",
  "data": {
    "forms": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "name": "Jane Smith",
        "email": "jane@company.com",
        "phone": "+1 (555) 000-0000",
        "service": "Premium",
        "status": "new",
        "createdAt": "2026-05-02T10:00:00Z",
        "updatedAt": "2026-05-02T10:00:00Z"
      }
    ],
    "pagination": {
      "total": 150,
      "limit": 50,
      "skip": 0
    }
  }
}
```

---

### GET `/contact-forms/:id`

Get a specific contact form by ID.

**Authentication:** Required (Bearer token)

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Contact form retrieved",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Jane Smith",
    "email": "jane@company.com",
    "phone": "+1 (555) 000-0000",
    "company": "XYZ Home Buyers LLC",
    "service": "Premium",
    "quantity": "1 Seat",
    "preferredDate": "2026-05-15",
    "preferredTime": "14:00",
    "preferredTimezone": "EST",
    "referralSource": "LinkedIn",
    "message": "I'm interested in scaling my outreach...",
    "status": "new",
    "notes": "",
    "createdAt": "2026-05-02T10:00:00Z",
    "updatedAt": "2026-05-02T10:00:00Z"
  }
}
```

---

### PATCH `/contact-forms/:id/status`

Update contact form status and notes.

**Authentication:** Required (Bearer token)

**Request Body:**
```json
{
  "status": "contacted",
  "notes": "Called on 2026-05-03, interested in demo"
}
```

**Valid Status Values:**
- `new` - Newly submitted
- `contacted` - Have reached out
- `converted` - Customer converted
- `spam` - Mark as spam

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Contact form updated",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "status": "contacted",
    "notes": "Called on 2026-05-03, interested in demo",
    "updatedAt": "2026-05-03T14:30:00Z"
  }
}
```

---

## Visitor Tracking

### POST `/visitors`

Track visitor events (page visits, exits, button clicks, etc).

**Authentication:** Not required (but rate-limited: 100 events/hour)

**Request Body:**
```json
{
  "event_type": "page_visit",
  "page_url": "https://vololeads.com",
  "page_referrer": "https://google.com",
  "user_agent": "Mozilla/5.0...",
  "timestamp": "2026-05-02T14:30:00Z"
}
```

**Required Fields:**
- `event_type` - Type of event
- `timestamp` - ISO 8601 timestamp

**Optional Fields:**
- `page_url` - Current page URL
- `page_referrer` - Referrer URL
- `user_agent` - User agent string
- `time_spent_seconds` - Time spent on page (for page_exit events)

**Event Types:**
- `page_visit` - User visited a page
- `page_exit` - User left a page
- `button_click` - User clicked a button
- `form_start` - User started filling a form
- `form_submit` - User submitted a form
- `scroll` - User scrolled
- `custom` - Custom event

**Response (202 Accepted):**
```json
{
  "received": true
}
```

**Example: Page Exit Event**
```json
{
  "event_type": "page_exit",
  "page_url": "https://vololeads.com/pricing",
  "time_spent_seconds": 45,
  "timestamp": "2026-05-02T14:31:30Z"
}
```

---

### GET `/visitors`

Retrieve visitor events (admin endpoint).

**Authentication:** Required (Bearer token)

**Query Parameters:**
- `limit` - Number of results per page (default: 100)
- `skip` - Number of results to skip (default: 0)
- `eventType` - Filter by event type
- `startDate` - Start date filter (ISO format)
- `endDate` - End date filter (ISO format)

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Visitor events retrieved",
  "data": {
    "events": [
      {
        "_id": "507f1f77bcf86cd799439012",
        "eventType": "page_visit",
        "visitorHash": "a1b2c3d4e5f6...",
        "pageUrl": "https://vololeads.com",
        "browser": "Chrome",
        "os": "Windows",
        "timestamp": "2026-05-02T14:30:00Z"
      }
    ],
    "pagination": {
      "total": 5000,
      "limit": 100,
      "skip": 0
    }
  }
}
```

---

### GET `/analytics`

Get visitor analytics and aggregated data.

**Authentication:** Required (Bearer token)

**Query Parameters:**
- `startDate` - Analytics period start (ISO format)
- `endDate` - Analytics period end (ISO format)

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Analytics retrieved",
  "data": {
    "totalEvents": 5000,
    "uniqueVisitors": 1200,
    "eventTypes": [
      {
        "_id": "page_visit",
        "count": 3500
      },
      {
        "_id": "page_exit",
        "count": 1200
      },
      {
        "_id": "button_click",
        "count": 300
      }
    ],
    "topBrowsers": [
      {
        "_id": "Chrome",
        "count": 3200
      },
      {
        "_id": "Safari",
        "count": 1200
      },
      {
        "_id": "Firefox",
        "count": 600
      }
    ],
    "avgTimeSpentSeconds": 45
  }
}
```

---

### DELETE `/visitors/:visitorHash`

Delete all visitor data for GDPR compliance (data erasure request).

**Authentication:** Required (Bearer token)

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Visitor data deleted (GDPR erasure)",
  "data": {
    "deletedCount": 150
  }
}
```

---

## Error Handling

All error responses follow this format:

```json
{
  "success": false,
  "status": 400,
  "message": "Error message describing what went wrong"
}
```

### Common HTTP Status Codes

| Status | Meaning |
|--------|---------|
| 200 | Success - Request completed successfully |
| 201 | Created - Resource created successfully |
| 202 | Accepted - Request accepted (fire-and-forget) |
| 400 | Bad Request - Invalid request body or parameters |
| 401 | Unauthorized - Missing or invalid authentication token |
| 403 | Forbidden - Token expired or invalid |
| 404 | Not Found - Resource doesn't exist |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Server error |

---

## Rate Limiting

### Contact Form Endpoint
- **Limit:** 3 submissions per IP per hour
- **Response:** 429 Too Many Requests when exceeded

### Visitor Tracking Endpoint
- **Limit:** 100 events per IP per hour
- **Response:** 202 Accepted (always, to not overload client)

### Admin Endpoints
- **Limit:** Standard rate limits apply, but authenticated users may have higher limits

---

## Environment Variables

Create a `.env` file in the `backend/` directory with these variables:

```env
# Server
NODE_ENV=development
PORT=5000

# Database
DATABASE_URL=mongodb://localhost:27017/vololeads

# Security
JWT_SECRET=your-super-secret-jwt-key-change-this
HASH_SALT=your-unique-hash-salt-for-ip-hashing

# CORS
CORS_ORIGIN=http://localhost:3000

# Contact Form
WEB3FORMS_API_KEY=your_web3forms_api_key_here
CONTACT_EMAIL=your-email@example.com
THANK_YOU_PAGE=https://yourdomain.com/thank-you.html

# Logging
LOG_LEVEL=debug
```

---

## Testing with cURL

### Test Contact Form Submission
```bash
curl -X POST http://localhost:5000/api/contact-form \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "phone": "+1 (555) 123-4567",
    "service": "Premium",
    "referral_source": "LinkedIn",
    "message": "Test message"
  }'
```

### Test Visitor Event Tracking
```bash
curl -X POST http://localhost:5000/api/visitors \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "page_visit",
    "page_url": "https://vololeads.com",
    "timestamp": "2026-05-02T14:30:00Z"
  }'
```

### Test Get Profile (with token)
```bash
curl -X GET http://localhost:5000/api/users/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

---

## API Response Patterns

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Response data here
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "status": 400
}
```

### Paginated Response
```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "total": 1000,
      "limit": 50,
      "skip": 0
    }
  }
}
```

---

## Best Practices for Frontend Integration

1. **Always check `success` field** - Use this to determine if request succeeded
2. **Implement error handling** - Display error message to user when `success` is false
3. **Respect rate limits** - Implement exponential backoff for rate-limited endpoints
4. **Store JWT tokens securely** - Use HTTP-only cookies or secure local storage
5. **Validate input before sending** - Reduce server load and improve UX
6. **Handle 202 responses** - Visitor tracking returns 202 (fire-and-forget)
7. **Include CORS headers** - Frontend must match CORS_ORIGIN setting

---

## Support & Documentation

For more information:
- See `API_DOCUMENTATION.md` for detailed API specifications
- See `BACKEND_API_GUIDE.md` for implementation guidance
- See `PROJECT_STRUCTURE.md` for codebase organization

For questions, contact the backend team or create an issue in the repository.
