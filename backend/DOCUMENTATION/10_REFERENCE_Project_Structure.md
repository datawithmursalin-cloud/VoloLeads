# Project Structure

```
backend/
│
├── src/                           # Source code
│   ├── server.js                 # Main Express app
│   ├── controllers/              # Business logic controllers
│   │   └── authController.js
│   ├── routes/                   # API route handlers
│   │   ├── health.js
│   │   ├── auth.js
│   │   └── users.js
│   ├── models/                   # Database models (MongoDB)
│   │   └── User.js
│   ├── middleware/               # Express middleware
│   │   ├── authenticate.js      # JWT verification
│   │   └── validation.js        # Input validation
│   ├── config/                   # Configuration files
│   │   └── db.js                # Database connection
│   ├── utils/                    # Utility functions
│   │   ├── helpers.js           # Common helpers
│   │   └── logger.js            # Logging utility
│   ├── constants/                # Constants
│   │   └── index.js
│   └── __tests__/                # Test files
│       └── api.test.js
│
├── public/                        # Static files
│   ├── index.html               # Landing page
│   └── .htaccess                # Apache configuration
│
├── .env                          # Environment variables (local)
├── .env.example                  # Example environment variables
├── .env.production               # Production environment template
├── .gitignore                    # Git ignore rules
├── .eslintrc.json               # ESLint configuration
├── jest.config.js               # Jest testing configuration
├── package.json                 # Project dependencies
├── package-lock.json            # Dependency lock file
│
├── Dockerfile                    # Docker image definition
├── docker-compose.yml            # Docker compose orchestration
│
├── README.md                     # Project documentation
├── API_DOCUMENTATION.md          # API endpoints documentation
├── CPANEL_DEPLOYMENT.md          # cPanel deployment guide
├── MONITORING_GUIDE.md           # Monitoring and maintenance
│
└── setup.sh                      # Automated setup script
```

## Directory Descriptions

### `/src`
Main source code directory containing all application logic.

**Key Subdirectories:**
- **controllers/**: Business logic isolated from routes
- **routes/**: API endpoint definitions
- **models/**: Database schema definitions
- **middleware/**: Request processing functions
- **config/**: Application configuration
- **utils/**: Reusable utility functions
- **constants/**: Application constants and enums
- **__tests__/**: Unit and integration tests

### `/public`
Static files served by Express (HTML, CSS, JS, images).

### Environment Files
- **.env**: Local development variables (Git ignored)
- **.env.example**: Template showing required variables
- **.env.production**: Production environment template

### Configuration Files
- **package.json**: Dependencies and scripts
- **jest.config.js**: Test runner configuration
- **.eslintrc.json**: Code style rules
- **Dockerfile**: Container image definition
- **docker-compose.yml**: Multi-container orchestration

### Documentation
- **README.md**: Project overview and quick start
- **API_DOCUMENTATION.md**: Detailed API reference
- **CPANEL_DEPLOYMENT.md**: Deployment instructions
- **MONITORING_GUIDE.md**: Production monitoring

## File Purposes

| File | Purpose |
|------|---------|
| `server.js` | Express app initialization and middleware setup |
| `package.json` | Project metadata and dependencies |
| `.env` | Secret keys and sensitive configuration |
| `routes/*.js` | API endpoint handlers |
| `models/*.js` | Database schema definitions |
| `middleware/*.js` | Request interceptors and validators |
| `controllers/*.js` | Business logic separate from routes |
| `utils/*.js` | Shared utility functions |
| `__tests__/*.js` | Test suites |
| `Dockerfile` | Container build instructions |
| `docker-compose.yml` | Local development environment |

## Adding New Features

### Add a New Route
1. Create `src/routes/feature.js`
2. Define route handlers
3. Import in `src/server.js`: `app.use('/api/feature', require('./routes/feature'));`

### Add a New Model
1. Create `src/models/FeatureModel.js`
2. Define Mongoose schema
3. Export model: `module.exports = mongoose.model('Feature', schema);`

### Add a New Controller
1. Create `src/controllers/featureController.js`
2. Export functions handling business logic
3. Use in routes: `const controller = require('../controllers/featureController');`

### Add Middleware
1. Create `src/middleware/yourMiddleware.js`
2. Export function
3. Use in `src/server.js`: `app.use(yourMiddleware);`

## Environment Variables Reference

```
NODE_ENV              # development | production
PORT                  # Server port (default: 5000)
JWT_SECRET            # JWT signing secret
DATABASE_URL          # MongoDB connection string
API_BASE_URL          # API base URL
CORS_ORIGIN           # Allowed frontend URL
LOG_LEVEL             # debug | info | warn | error
```

## Common Commands

```bash
# Setup
npm install
cp .env.example .env

# Development
npm run dev

# Production
npm start

# Testing
npm test

# Linting
npm run lint
npm run lint:fix

# Docker
docker build -t vololeads-api .
docker run -p 5000:5000 vololeads-api

# Docker Compose
docker-compose up
docker-compose down
```

## Security Best Practices

1. **Never commit `.env` file** - Use `.env.example` template
2. **Use strong JWT_SECRET** - Generate with: `openssl rand -base64 32`
3. **Validate all inputs** - Use middleware in `src/middleware/validation.js`
4. **Use HTTPS in production** - Enable SSL/TLS certificate
5. **Rotate keys regularly** - Update JWT_SECRET periodically
6. **Monitor logs** - Check for suspicious activity
7. **Update dependencies** - Run `npm audit` monthly
8. **Use rate limiting** - Implement in middleware for production

## Deployment Checklist

- [ ] Update `.env.production` with real values
- [ ] Set `NODE_ENV=production`
- [ ] Enable HTTPS/SSL certificate
- [ ] Configure CORS_ORIGIN correctly
- [ ] Set strong JWT_SECRET
- [ ] Setup database backups
- [ ] Configure logging and monitoring
- [ ] Test health check: `/api/health`
- [ ] Test authentication endpoints
- [ ] Review security headers
- [ ] Setup error alerts

## Performance Optimization

1. **Enable Caching**: Redis for sessions/data
2. **Compress Responses**: Already enabled (Helmet)
3. **Use Database Indexes**: On frequently queried fields
4. **Implement Rate Limiting**: Prevent abuse
5. **Monitor Performance**: Use APM tools
6. **Load Balancing**: Use reverse proxy (nginx)
7. **CDN**: Serve static assets from CDN

## Troubleshooting

### Port Already in Use
```bash
lsof -i :5000
kill -9 <PID>
```

### Module Not Found
```bash
rm -rf node_modules package-lock.json
npm install
```

### Database Connection Failed
- Check CONNECTION_URL is correct
- Verify MongoDB is running
- Check firewall rules

### CORS Errors
- Update CORS_ORIGIN in .env
- Verify frontend domain matches CORS_ORIGIN

For more details, see CPANEL_DEPLOYMENT.md and MONITORING_GUIDE.md
