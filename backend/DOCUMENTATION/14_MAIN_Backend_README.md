# VoloLeads Backend API

Production-ready Node.js/Express backend for VoloLeads application.

## Features
- Express.js REST API
- JWT Authentication
- CORS & Security Middleware
- Error Handling
- Request Logging
- Environment Configuration
- cPanel Ready Deployment

## Tech Stack
- **Runtime**: Node.js 16+
- **Framework**: Express.js
- **Authentication**: JWT
- **Database**: MongoDB (optional)
- **Password Hashing**: bcryptjs
- **Security**: Helmet, CORS
- **Logging**: Morgan

## Quick Start

### Development
```bash
npm install
cp .env.example .env
npm run dev
```

### Production
```bash
npm install --production
npm start
```

## API Endpoints

### Health Check
```
GET /api/health
```

### Authentication
```
POST /api/auth/register
POST /api/auth/login
```

### Users
```
GET /api/users
GET /api/users/profile (requires auth)
```

## Configuration
Copy `.env.example` to `.env` and configure:
- `PORT` - Server port
- `NODE_ENV` - Environment (development/production)
- `JWT_SECRET` - JWT signing secret
- `DATABASE_URL` - MongoDB connection string
- `CORS_ORIGIN` - Allowed origins

## Project Structure
```
backend/
├── src/
│   ├── server.js          # Main application
│   └── routes/            # API routes
│       ├── health.js
│       ├── auth.js
│       └── users.js
├── public/                # Static files
├── package.json
├── .env.example
└── CPANEL_DEPLOYMENT.md   # Deployment guide
```

## Scripts
- `npm start` - Run production server
- `npm run dev` - Run with auto-reload
- `npm test` - Run tests
- `npm run lint` - Check code quality
- `npm run lint:fix` - Fix linting issues

## Deployment
See [CPANEL_DEPLOYMENT.md](./CPANEL_DEPLOYMENT.md) for cPanel deployment instructions.

## Security
- Environment variables for secrets
- CORS protection
- Helmet.js security headers
- JWT token expiration
- Password hashing with bcryptjs
- Input validation (ready for implementation)

## Development
```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Run development server
npm run dev

# Server runs on http://localhost:5000
```

## Testing
```bash
# Run test suite
npm test

# Run with coverage
npm test -- --coverage
```

## Extending the API

### Add New Route
1. Create `src/routes/yourroute.js`
2. Import in `src/server.js`
3. Add: `app.use('/api/yourroute', require('./routes/yourroute'));`

### Add Middleware
Add to `src/server.js` before routes:
```javascript
app.use(yourMiddleware);
```

### Add Database Models (MongoDB)
1. Create `src/models/Model.js`
2. Define mongoose schema
3. Import and use in routes

## License
ISC

## Support
For issues, check [CPANEL_DEPLOYMENT.md](./CPANEL_DEPLOYMENT.md) troubleshooting section.
