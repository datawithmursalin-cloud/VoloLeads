# API Documentation

## Base URL
```
http://localhost:5000/api
https://api.yourdomain.com/api (production)
```

## Authentication
Most endpoints require JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

---

## Endpoints

### 1. Health Check
**GET** `/health`

No authentication required.

**Response:**
```json
{
  "success": true,
  "status": "OK",
  "message": "API is healthy",
  "timestamp": "2024-05-02T10:00:00.000Z"
}
```

---

### 2. Register User
**POST** `/auth/register`

No authentication required.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Success Response (201):**
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

**Error Response (400):**
```json
{
  "success": false,
  "message": "Email, password, and name are required"
}
```

**Error Response (409):**
```json
{
  "success": false,
  "message": "User already exists"
}
```

---

### 3. Login User
**POST** `/auth/login`

No authentication required.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Success Response (200):**
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

**Error Response (401):**
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

---

### 4. Get All Users
**GET** `/users`

No authentication required.

**Response (200):**
```json
{
  "success": true,
  "message": "Users endpoint",
  "users": []
}
```

---

### 5. Get User Profile
**GET** `/users/profile`

**Required:** JWT Token in Authorization header

**Response (200):**
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

**Error Response (401):**
```json
{
  "success": false,
  "message": "Access token required"
}
```

**Error Response (403):**
```json
{
  "success": false,
  "message": "Invalid or expired token"
}
```

---

## Error Handling

All error responses follow this format:
```json
{
  "success": false,
  "status": 400,
  "message": "Error message"
}
```

### Common Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `500` - Internal Server Error

---

## Rate Limiting
Currently not implemented. For production, add rate limiting middleware.

---

## Examples

### Register using cURL
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "securepassword123"
  }'
```

### Login using cURL
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "securepassword123"
  }'
```

### Get Profile using cURL
```bash
curl -X GET http://localhost:5000/api/users/profile \
  -H "Authorization: Bearer your-jwt-token-here"
```

---

## Adding New Endpoints

1. Create a new file in `src/routes/`
2. Define your routes and logic
3. Import and mount in `src/server.js`:
```javascript
app.use('/api/yourroute', require('./routes/yourroute'));
```

---

## CORS Policy
Default CORS origin is set via `CORS_ORIGIN` environment variable.

Allowed Methods: GET, POST, PUT, DELETE, PATCH
Allowed Headers: Content-Type, Authorization

---

## Versioning
Current API Version: v1 (implied in URLs)

For future versioning, prefix routes with `/api/v2/`
